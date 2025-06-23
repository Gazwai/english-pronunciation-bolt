import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export class SpeechRecognitionService {
  private recognition: any;
  private _isListening = false;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private minRecordingTime = 500; // Reduced from 1500ms to 500ms for better responsiveness
  private maxRecordingTime = 6000; // Maximum 6 seconds
  private recordingStartTime = 0;

  constructor() {
    if (Platform.OS === 'web') {
      this.initWebSpeechRecognition();
    }
  }

  private initWebSpeechRecognition() {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Single result
      this.recognition.interimResults = false; // Only final results
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 5; // Get multiple alternatives
    }
  }

  async startListening(onResult: (transcript: string) => void, onError: (error: string) => void): Promise<void> {
    // Check if already listening
    if (this._isListening) {
      const error = 'Speech recognition is already in progress. Please wait for it to complete.';
      onError(error);
      return Promise.reject(error);
    }

    this.recordingStartTime = Date.now();

    if (Platform.OS === 'web' && this.recognition) {
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

        // Clear any existing event handlers to prevent stale closures
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.onstart = null;
        this.recognition.onspeechstart = null;
        this.recognition.onspeechend = null;

        // Set up timeout for maximum recording time
        const maxTimeout = setTimeout(() => {
          if (this._isListening && !resultHandled) {
            console.log('Maximum recording time reached');
            this.recognition.stop();
          }
        }, this.maxRecordingTime);

        this.recognition.onstart = () => {
          console.log('Speech recognition started');
          this._isListening = true;
        };

        this.recognition.onresult = (event: any) => {
          console.log('Speech recognition result received:', event);
          clearTimeout(maxTimeout);
          
          if (event.results && event.results.length > 0) {
            const result = event.results[0];
            
            // Find the best alternative based on confidence
            for (let i = 0; i < result.length; i++) {
              const alternative = result[i];
              const confidence = alternative.confidence || 0;
              const transcript = alternative.transcript.trim();
              
              console.log(`Alternative ${i}: "${transcript}" (confidence: ${confidence})`);
              
              if (confidence > bestConfidence || (confidence === bestConfidence && transcript.length > bestTranscript.length)) {
                bestConfidence = confidence;
                bestTranscript = transcript;
              }
            }
            
            // Use the first result if no confidence scores available
            if (!bestTranscript && result[0]) {
              bestTranscript = result[0].transcript.trim();
            }
            
            if (bestTranscript) {
              console.log('Best transcript:', bestTranscript);
              this.recognition.stop();
              handleResult(bestTranscript);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error, event);
          clearTimeout(maxTimeout);
          this._isListening = false;
          
          let errorMessage = 'Speech recognition failed. Please try again.';
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'We couldn\'t detect any speech. Please ensure your microphone is working and speak clearly.';
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
              // User stopped recording manually - this is normal
              errorMessage = 'Recording was stopped.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service is not allowed. Please check your browser settings.';
              break;
          }
          
          handleError(errorMessage, event.error);
        };

        this.recognition.onend = () => {
          console.log('Speech recognition ended. Result handled:', resultHandled, 'Best transcript:', bestTranscript);
          clearTimeout(maxTimeout);
          this._isListening = false;
          
          // Only handle error if no result was already processed
          if (!resultHandled) {
            const recordingDuration = Date.now() - this.recordingStartTime;
            let errorMessage;
            
            if (recordingDuration < this.minRecordingTime) {
              errorMessage = 'It seems the recording was too short. Please speak for at least 0.5 seconds.';
            } else {
              errorMessage = 'We couldn\'t detect any speech. Please ensure your microphone is working and speak clearly.';
            }
            
            handleError(errorMessage, 'no-speech');
          }
        };

        this.recognition.onspeechstart = () => {
          console.log('Speech detected');
        };

        this.recognition.onspeechend = () => {
          console.log('Speech ended');
        };

        try {
          console.log('Starting speech recognition...');
          this.recognition.start();
        } catch (error) {
          clearTimeout(maxTimeout);
          console.error('Failed to start speech recognition:', error);
          this._isListening = false;
          
          let errorMessage = 'Failed to start speech recognition. Please try again.';
          if (error instanceof Error && error.message.includes('already started')) {
            errorMessage = 'Speech recognition is already running. Please wait and try again.';
          }
          
          handleError(errorMessage);
        }
      });
    } else if (Platform.OS === 'web') {
      // Web platform but no speech recognition support
      const error = 'Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.';
      onError(error);
      return Promise.reject('Speech recognition not supported');
    } else {
      // Mobile platforms - show error that native implementation is needed
      const error = 'Speech recognition requires native implementation on mobile. This is a web-only demo.';
      onError(error);
      return Promise.reject('Mobile speech recognition not implemented');
    }
  }

  stopListening(): void {
    console.log('Manually stopping speech recognition');
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    
    if (this.recognition && this._isListening) {
      this.recognition.stop();
      // Don't set _isListening to false here - let onend or onerror handle it
    }
  }

  isCurrentlyListening(): boolean {
    return this._isListening;
  }

  // Check if speech recognition is available
  isAvailable(): boolean {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && 
             ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    }
    // For mobile, native implementation would be needed
    return false;
  }

  // Get recording progress (0-1)
  getRecordingProgress(): number {
    if (!this._isListening) return 0;
    const elapsed = Date.now() - this.recordingStartTime;
    return Math.min(elapsed / this.maxRecordingTime, 1);
  }

  // More lenient pronunciation accuracy calculation focused on stress and intonation
  calculateAccuracy(targetWord: string, spokenWord: string): number {
    const target = this.cleanWord(targetWord);
    const spoken = this.cleanWord(spokenWord);

    console.log(`Calculating accuracy: "${target}" vs "${spoken}"`);

    // Exact match gets 100%
    if (target === spoken) {
      console.log('Exact match - 100%');
      return 100;
    }

    // If completely different words, check for reasonable attempts
    if (target.length === 0 || spoken.length === 0) {
      return 0;
    }

    // More lenient approach - focus on core pronunciation elements
    const coreWordAccuracy = this.calculateCoreWordAccuracy(target, spoken);
    const stressPatternAccuracy = this.calculateStressPatternAccuracy(target, spoken);
    const syllableAccuracy = this.calculateSyllableAccuracy(target, spoken);
    const accentToleranceBonus = this.calculateAccentToleranceBonus(target, spoken);

    console.log('Lenient accuracy metrics:', {
      coreWord: coreWordAccuracy,
      stressPattern: stressPatternAccuracy,
      syllable: syllableAccuracy,
      accentBonus: accentToleranceBonus
    });

    // More forgiving weighted combination
    const baseAccuracy = (
      coreWordAccuracy * 0.50 +      // Core word recognition (reduced weight)
      stressPatternAccuracy * 0.25 +  // Stress pattern matching
      syllableAccuracy * 0.25         // Syllable structure
    );

    // Apply accent tolerance bonus
    const finalAccuracy = Math.min(100, baseAccuracy + accentToleranceBonus);
    const roundedAccuracy = Math.round(Math.max(0, finalAccuracy));
    
    console.log('Final lenient accuracy:', roundedAccuracy);
    
    return roundedAccuracy;
  }

  private cleanWord(word: string): string {
    return word.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ''); // Remove all whitespace
  }

  // Focus on core word structure rather than exact phonetic matching
  private calculateCoreWordAccuracy(target: string, spoken: string): number {
    // Check for common accent variations and pronunciations
    const normalizedTarget = this.normalizeForAccents(target);
    const normalizedSpoken = this.normalizeForAccents(spoken);

    // If normalized versions match, high accuracy
    if (normalizedTarget === normalizedSpoken) {
      return 95;
    }

    // Use more lenient string similarity
    const similarity = this.calculateLenientSimilarity(normalizedTarget, normalizedSpoken);
    return similarity * 0.9; // Slightly reduce to account for normalization
  }

  // Calculate stress pattern accuracy (simplified)
  private calculateStressPatternAccuracy(target: string, spoken: string): number {
    const targetVowels = this.extractVowelPattern(target);
    const spokenVowels = this.extractVowelPattern(spoken);

    if (targetVowels.length === 0 && spokenVowels.length === 0) return 100;
    if (targetVowels.length === 0 || spokenVowels.length === 0) return 50;

    // Compare vowel patterns (simplified stress indication)
    const patternSimilarity = this.calculateSequenceSimilarity(targetVowels, spokenVowels);
    return Math.max(60, patternSimilarity); // Minimum 60% for attempting the word
  }

  // Calculate syllable structure accuracy
  private calculateSyllableAccuracy(target: string, spoken: string): number {
    const targetSyllables = this.estimateSyllableCount(target);
    const spokenSyllables = this.estimateSyllableCount(spoken);

    if (targetSyllables === spokenSyllables) {
      return 100;
    }

    // Be lenient with syllable count differences
    const difference = Math.abs(targetSyllables - spokenSyllables);
    const maxSyllables = Math.max(targetSyllables, spokenSyllables);
    
    if (maxSyllables === 0) return 100;
    
    // Allow for 1 syllable difference without major penalty
    if (difference <= 1) {
      return 85;
    }
    
    return Math.max(50, 100 - (difference / maxSyllables) * 50);
  }

  // Bonus for common accent variations and pronunciation differences
  private calculateAccentToleranceBonus(target: string, spoken: string): number {
    let bonus = 0;

    // Common accent variations
    const accentVariations = [
      // R-dropping (non-rhotic accents)
      { pattern: /r$/, replacement: '' },
      { pattern: /er$/, replacement: 'a' },
      
      // Vowel variations
      { pattern: /a/, replacement: 'e' },
      { pattern: /i/, replacement: 'e' },
      { pattern: /o/, replacement: 'u' },
      
      // Consonant variations
      { pattern: /th/, replacement: 'd' },
      { pattern: /th/, replacement: 'f' },
      { pattern: /v/, replacement: 'w' },
      { pattern: /w/, replacement: 'v' },
      
      // Common substitutions
      { pattern: /z/, replacement: 's' },
      { pattern: /j/, replacement: 'y' },
    ];

    // Check if spoken word matches target with common accent variations
    for (const variation of accentVariations) {
      const modifiedTarget = target.replace(variation.pattern, variation.replacement);
      const modifiedSpoken = spoken.replace(variation.pattern, variation.replacement);
      
      if (modifiedTarget === spoken || target === modifiedSpoken || modifiedTarget === modifiedSpoken) {
        bonus += 15; // Significant bonus for accent variation match
        break;
      }
    }

    // Bonus for reasonable attempt (word length similarity)
    const lengthSimilarity = 1 - Math.abs(target.length - spoken.length) / Math.max(target.length, spoken.length);
    if (lengthSimilarity > 0.7) {
      bonus += 10;
    }

    // Bonus for containing most of the target word
    const containmentRatio = this.calculateContainmentRatio(target, spoken);
    if (containmentRatio > 0.6) {
      bonus += 5;
    }

    return Math.min(25, bonus); // Cap bonus at 25 points
  }

  // Normalize words for common accent variations
  private normalizeForAccents(word: string): string {
    return word
      .replace(/ph/g, 'f')     // Phone -> fone
      .replace(/ck/g, 'k')     // Back -> bak
      .replace(/qu/g, 'kw')    // Queen -> kween
      .replace(/x/g, 'ks')     // Box -> boks
      .replace(/c/g, 'k')      // Cat -> kat
      .replace(/y/g, 'i')      // Happy -> happi
      .replace(/(.)\1+/g, '$1') // Remove double letters
      .replace(/e$/, '');      // Remove silent e
  }

  // More lenient string similarity calculation
  private calculateLenientSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    // Use Jaro-Winkler similarity (more lenient than Levenshtein)
    const jaroSimilarity = this.calculateJaroSimilarity(str1, str2);
    
    // Also check for substring matches
    const substringMatch = longer.includes(shorter) ? (shorter.length / longer.length) * 100 : 0;
    
    // Return the better of the two scores
    return Math.max(jaroSimilarity * 100, substringMatch);
  }

  // Jaro similarity algorithm (more lenient than edit distance)
  private calculateJaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  }

  private extractVowelPattern(word: string): string[] {
    return word.match(/[aeiou]/g) || [];
  }

  private estimateSyllableCount(word: string): number {
    if (word.length === 0) return 0;
    
    // Simple syllable estimation based on vowel groups
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g) || [];
    let syllables = vowelGroups.length;
    
    // Adjust for silent e
    if (word.toLowerCase().endsWith('e') && syllables > 1) {
      syllables--;
    }
    
    return Math.max(1, syllables);
  }

  private calculateContainmentRatio(target: string, spoken: string): number {
    if (target.length === 0) return 0;
    
    let matchedChars = 0;
    const targetChars = target.split('');
    const spokenChars = spoken.split('');
    
    for (const char of targetChars) {
      const index = spokenChars.indexOf(char);
      if (index !== -1) {
        matchedChars++;
        spokenChars.splice(index, 1); // Remove matched character
      }
    }
    
    return matchedChars / target.length;
  }

  private calculateSequenceSimilarity(seq1: string[], seq2: string[]): number {
    const maxLength = Math.max(seq1.length, seq2.length);
    if (maxLength === 0) return 100;

    // Use dynamic programming to find longest common subsequence
    const lcs = this.longestCommonSubsequence(seq1, seq2);
    const similarity = (lcs / maxLength) * 100;
    
    // Bonus for similar length
    const lengthSimilarity = 1 - Math.abs(seq1.length - seq2.length) / maxLength;
    
    return similarity * 0.8 + lengthSimilarity * 20;
  }

  private longestCommonSubsequence(seq1: string[], seq2: string[]): number {
    const m = seq1.length;
    const n = seq2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (seq1[i - 1] === seq2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  // Text-to-speech for pronunciation examples
  async speakWord(word: string): Promise<void> {
    if (Speech.isSpeakingAsync()) {
      await Speech.stop();
    }

    return Speech.speak(word, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.75, // Slightly slower for better pronunciation learning
    });
  }
}

export const speechService = new SpeechRecognitionService();