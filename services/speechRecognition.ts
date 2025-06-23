import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export class SpeechRecognitionService {
  private recognition: any;
  private _isListening = false;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private minRecordingTime = 500;
  private maxRecordingTime = 6000;
  private recordingStartTime = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    if (Platform.OS === 'web') {
      this.initWebSpeechRecognition();
    }
  }

  private initWebSpeechRecognition() {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 5;
    }
  }

  async startListening(onResult: (transcript: string) => void, onError: (error: string) => void): Promise<void> {
    if (this._isListening) {
      const error = 'Speech recognition is already in progress. Please wait for it to complete.';
      onError(error);
      return Promise.reject(error);
    }

    this.recordingStartTime = Date.now();

    // Try to use the enhanced API route first
    if (Platform.OS === 'web' && this.canUseAdvancedRecording()) {
      return this.startAdvancedRecording(onResult, onError);
    }

    // Fallback to basic web speech recognition
    if (Platform.OS === 'web' && this.recognition) {
      return this.startBasicRecognition(onResult, onError);
    }

    // Mobile platforms
    const error = 'Speech recognition requires native implementation on mobile. This is a web-only demo.';
    onError(error);
    return Promise.reject('Mobile speech recognition not implemented');
  }

  private canUseAdvancedRecording(): boolean {
    return typeof window !== 'undefined' && 
           'MediaRecorder' in window && 
           'navigator' in window && 
           'mediaDevices' in navigator &&
           'getUserMedia' in navigator.mediaDevices;
  }

  private async startAdvancedRecording(onResult: (transcript: string) => void, onError: (error: string) => void): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 48000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });

        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
            
            // Send to our API route for processing
            const result = await this.processAudioWithAPI(audioBlob, 'target-word');
            
            if (result.success) {
              onResult(result.transcript);
              resolve();
            } else {
              onError(result.error || 'Failed to process audio');
              reject(result.error);
            }
          } catch (error) {
            console.error('Error processing recorded audio:', error);
            onError('Failed to process recorded audio');
            reject(error);
          } finally {
            // Clean up
            stream.getTracks().forEach(track => track.stop());
            this._isListening = false;
          }
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          onError('Recording failed');
          reject('Recording failed');
          this._isListening = false;
        };

        // Start recording
        this._isListening = true;
        this.mediaRecorder.start();

        // Auto-stop after max time
        setTimeout(() => {
          if (this._isListening && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, this.maxRecordingTime);

      } catch (error) {
        console.error('Failed to start advanced recording:', error);
        this._isListening = false;
        
        let errorMessage = 'Failed to access microphone. Please check permissions.';
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'No microphone found. Please connect a microphone and try again.';
          }
        }
        
        onError(errorMessage);
        reject(error);
      }
    });
  }

  private async processAudioWithAPI(audioBlob: Blob, targetWord: string) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('targetWord', targetWord);

    const response = await fetch('/api/pronunciation', {
      method: 'POST',
      body: formData
    });

    return await response.json();
  }

  private async startBasicRecognition(onResult: (transcript: string) => void, onError: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      let resultHandled = false;
      let bestTranscript = '';
      let bestConfidence = 0;

      const handleResult = (transcript: string) => {
        if (resultHandled) return;
        resultHandled = true;
        this._isListening = false;
        onResult(transcript);
        resolve();
      };

      const handleError = (errorMessage: string, errorType?: string) => {
        if (resultHandled) return;
        resultHandled = true;
        this._isListening = false;
        onError(errorMessage);
        reject(errorType || errorMessage);
      };

      // Clear any existing event handlers
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.onstart = null;

      const maxTimeout = setTimeout(() => {
        if (this._isListening && !resultHandled) {
          this.recognition.stop();
        }
      }, this.maxRecordingTime);

      this.recognition.onstart = () => {
        this._isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        clearTimeout(maxTimeout);
        
        if (event.results && event.results.length > 0) {
          const result = event.results[0];
          
          for (let i = 0; i < result.length; i++) {
            const alternative = result[i];
            const confidence = alternative.confidence || 0;
            const transcript = alternative.transcript.trim();
            
            if (confidence > bestConfidence || (confidence === bestConfidence && transcript.length > bestTranscript.length)) {
              bestConfidence = confidence;
              bestTranscript = transcript;
            }
          }
          
          if (!bestTranscript && result[0]) {
            bestTranscript = result[0].transcript.trim();
          }
          
          if (bestTranscript) {
            this.recognition.stop();
            handleResult(bestTranscript);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        clearTimeout(maxTimeout);
        this._isListening = false;
        
        let errorMessage = 'Speech recognition failed. Please try again.';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly and try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check your microphone settings.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          case 'aborted':
            errorMessage = 'Recording was stopped.';
            break;
        }
        
        handleError(errorMessage, event.error);
      };

      this.recognition.onend = () => {
        clearTimeout(maxTimeout);
        this._isListening = false;
        
        if (!resultHandled) {
          const recordingDuration = Date.now() - this.recordingStartTime;
          let errorMessage;
          
          if (recordingDuration < this.minRecordingTime) {
            errorMessage = 'Recording too short. Please speak for at least 0.5 seconds.';
          } else {
            errorMessage = 'No speech detected. Please try speaking more clearly.';
          }
          
          handleError(errorMessage, 'no-speech');
        }
      };

      try {
        this.recognition.start();
      } catch (error) {
        clearTimeout(maxTimeout);
        this._isListening = false;
        
        let errorMessage = 'Failed to start speech recognition. Please try again.';
        if (error instanceof Error && error.message.includes('already started')) {
          errorMessage = 'Speech recognition is already running. Please wait and try again.';
        }
        
        handleError(errorMessage);
      }
    });
  }

  stopListening(): void {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.recognition && this._isListening) {
      this.recognition.stop();
    }
  }

  isCurrentlyListening(): boolean {
    return this._isListening;
  }

  isAvailable(): boolean {
    if (Platform.OS === 'web') {
      return this.canUseAdvancedRecording() || 
             (typeof window !== 'undefined' && 
              ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window));
    }
    return false;
  }

  getRecordingProgress(): number {
    if (!this._isListening) return 0;
    const elapsed = Date.now() - this.recordingStartTime;
    return Math.min(elapsed / this.maxRecordingTime, 1);
  }

  // Enhanced accuracy calculation using the API response
  calculateAccuracy(targetWord: string, spokenWord: string): number {
    // This method is now primarily used for fallback scenarios
    // The main accuracy calculation happens in the API route
    const target = this.cleanWord(targetWord);
    const spoken = this.cleanWord(spokenWord);

    if (target === spoken) return 100;

    const similarity = this.calculateLenientSimilarity(target, spoken);
    const pronunciationBonus = this.calculateAccentToleranceBonus(target, spoken);
    
    return Math.min(100, Math.max(0, Math.round(similarity + pronunciationBonus)));
  }

  private cleanWord(word: string): string {
    return word.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '');
  }

  private calculateLenientSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const jaroSimilarity = this.calculateJaroSimilarity(str1, str2);
    const substringMatch = longer.includes(shorter) ? (shorter.length / longer.length) * 100 : 0;
    
    return Math.max(jaroSimilarity * 100, substringMatch);
  }

  private calculateJaroSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    
    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  }

  private calculateAccentToleranceBonus(target: string, spoken: string): number {
    let bonus = 0;

    const accentVariations = [
      { pattern: /r$/, replacement: '' },
      { pattern: /er$/, replacement: 'a' },
      { pattern: /a/, replacement: 'e' },
      { pattern: /i/, replacement: 'e' },
      { pattern: /o/, replacement: 'u' },
      { pattern: /th/, replacement: 'd' },
      { pattern: /th/, replacement: 'f' },
      { pattern: /v/, replacement: 'w' },
      { pattern: /w/, replacement: 'v' },
      { pattern: /z/, replacement: 's' },
      { pattern: /j/, replacement: 'y' },
    ];

    for (const variation of accentVariations) {
      const modifiedTarget = target.replace(variation.pattern, variation.replacement);
      const modifiedSpoken = spoken.replace(variation.pattern, variation.replacement);
      
      if (modifiedTarget === spoken || target === modifiedSpoken || modifiedTarget === modifiedSpoken) {
        bonus += 15;
        break;
      }
    }

    const lengthSimilarity = 1 - Math.abs(target.length - spoken.length) / Math.max(target.length, spoken.length);
    if (lengthSimilarity > 0.7) {
      bonus += 10;
    }

    return Math.min(25, bonus);
  }

  async speakWord(word: string): Promise<void> {
    if (Speech.isSpeakingAsync()) {
      await Speech.stop();
    }

    return Speech.speak(word, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.75,
    });
  }
}

export const speechService = new SpeechRecognitionService();