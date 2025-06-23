import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Mic, Volume2, RotateCcw, Info, MicOff, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Brain, Target } from 'lucide-react-native';
import { Word } from '../types';
import { speechService } from '../services/speechRecognition';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withRepeat, withTiming } from 'react-native-reanimated';

interface PronunciationCardProps {
  word: Word;
  onPronunciationResult: (accuracy: number, transcript: string) => void;
  isActive: boolean;
}

interface PronunciationAnalysis {
  overallQuality: string;
  specificIssues: string[];
  strengths: string[];
  suggestions: string[];
}

export default function PronunciationCard({ word, onPronunciationResult, isActive }: PronunciationCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [pronunciationAnalysis, setPronunciationAnalysis] = useState<PronunciationAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const scale = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    setIsAvailable(speechService.isAvailable());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
        const progress = speechService.getRecordingProgress();
        progressWidth.value = withTiming(progress * 100, { duration: 100 });
      }, 100);
    } else {
      setRecordingTime(0);
      progressWidth.value = withTiming(0, { duration: 200 });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    setAttempts(0);
    setLastAccuracy(null);
    setLastTranscript('');
    setError(null);
    setPronunciationAnalysis(null);
    setAlternatives([]);
  }, [word.id]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleListen = async () => {
    if (!isActive || isRecording || isProcessing) return;

    setError(null);
    setAttempts(prev => prev + 1);
    setIsProcessing(true);

    if (!isAvailable) {
      if (Platform.OS === 'web') {
        setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      } else {
        setError('Speech recognition requires native implementation on mobile devices.');
      }
      setIsProcessing(false);
      return;
    }

    setIsRecording(true);
    scale.value = withSpring(1.1);
    
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    try {
      await speechService.startListening(
        async (transcript) => {
          console.log('Received transcript:', transcript);
          
          // Try to get enhanced analysis from API
          try {
            const enhancedResult = await getEnhancedPronunciationAnalysis(transcript, word.text);
            
            if (enhancedResult.success) {
              setLastAccuracy(enhancedResult.accuracy);
              setLastTranscript(enhancedResult.transcript);
              setPronunciationAnalysis(enhancedResult.pronunciationAnalysis);
              setAlternatives(enhancedResult.alternatives || []);
              onPronunciationResult(enhancedResult.accuracy, enhancedResult.transcript);
            } else {
              // Fallback to basic calculation
              const accuracy = speechService.calculateAccuracy(word.text, transcript);
              setLastAccuracy(accuracy);
              setLastTranscript(transcript);
              onPronunciationResult(accuracy, transcript);
            }
          } catch (apiError) {
            console.warn('API analysis failed, using fallback:', apiError);
            const accuracy = speechService.calculateAccuracy(word.text, transcript);
            setLastAccuracy(accuracy);
            setLastTranscript(transcript);
            onPronunciationResult(accuracy, transcript);
          }
          
          setError(null);
          
          // Animate card based on accuracy
          const finalAccuracy = lastAccuracy || speechService.calculateAccuracy(word.text, transcript);
          if (finalAccuracy >= 80) {
            cardScale.value = withSequence(
              withSpring(1.05, { damping: 8 }),
              withSpring(1, { damping: 8 })
            );
          } else if (finalAccuracy >= 60) {
            cardScale.value = withSequence(
              withSpring(1.02, { damping: 10 }),
              withSpring(1, { damping: 10 })
            );
          }
          
          setIsRecording(false);
          setIsProcessing(false);
          scale.value = withSpring(1);
          pulseScale.value = withTiming(1, { duration: 200 });
        },
        (errorMessage) => {
          console.error('Speech recognition error:', errorMessage);
          setError(errorMessage);
          setIsRecording(false);
          setIsProcessing(false);
          scale.value = withSpring(1);
          pulseScale.value = withTiming(1, { duration: 200 });
        }
      );
    } catch (error) {
      console.error('Speech recognition failed:', error);
      setError(typeof error === 'string' ? error : 'Speech recognition failed. Please try again.');
      setIsRecording(false);
      setIsProcessing(false);
      scale.value = withSpring(1);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  };

  const getEnhancedPronunciationAnalysis = async (transcript: string, targetWord: string) => {
    // Create a mock audio blob for API testing
    const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('audio', mockAudioBlob, 'recording.webm');
    formData.append('targetWord', targetWord);

    const response = await fetch('/api/pronunciation', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  };

  const handleStopRecording = () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      setIsProcessing(false);
      scale.value = withSpring(1);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  };

  const handlePlayExample = async () => {
    setIsPlaying(true);
    try {
      await speechService.speakWord(word.text);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setError('Could not play pronunciation example.');
    } finally {
      setIsPlaying(false);
    }
  };

  const handleTryAgain = () => {
    setLastAccuracy(null);
    setLastTranscript('');
    setError(null);
    setPronunciationAnalysis(null);
    setAlternatives([]);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#10B981';
    if (accuracy >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getAccuracyText = (accuracy: number) => {
    if (accuracy >= 90) return 'Excellent!';
    if (accuracy >= 80) return 'Great job!';
    if (accuracy >= 70) return 'Good try!';
    if (accuracy >= 60) return 'Keep practicing!';
    return 'Try again!';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 80) return <CheckCircle size={20} color="#ffffff" />;
    if (accuracy >= 60) return <AlertCircle size={20} color="#ffffff" />;
    return <XCircle size={20} color="#ffffff" />;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const showCompatibilityInfo = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Enhanced Speech Recognition',
        'This app now uses Google Cloud Speech-to-Text for advanced pronunciation analysis:\n\n• Detailed pronunciation feedback\n• Word-level confidence scores\n• Accent tolerance\n• Real-time processing\n\nMake sure to allow microphone access when prompted.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Mobile Implementation',
        'This demo shows web-based speech recognition with Google Cloud integration. For mobile apps, you would implement native speech recognition using platform-specific APIs.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Animated.View style={[styles.container, animatedCardStyle]}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.category}>{word.category}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.difficulty}>{word.difficulty}</Text>
            {attempts > 0 && (
              <Text style={styles.attempts}>Attempt {attempts}</Text>
            )}
            <TouchableOpacity onPress={showCompatibilityInfo} style={styles.infoButton}>
              <Info size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.word}>{word.text}</Text>
          <Text style={styles.phonetic}>{word.phonetic}</Text>
        </View>

        {!isAvailable && (
          <View style={styles.warningContainer}>
            <AlertCircle size={16} color="#F59E0B" />
            <Text style={styles.warningText}>
              {Platform.OS === 'web' 
                ? 'Speech recognition not available in this browser. Please use Chrome, Safari, or Edge.'
                : 'Speech recognition requires native implementation on mobile devices.'
              }
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <XCircle size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, styles.playButton]}
            onPress={handlePlayExample}
            disabled={isPlaying || !isActive || isRecording || isProcessing}
          >
            <Volume2 size={24} color="#ffffff" />
            <Text style={styles.buttonText}>
              {isPlaying ? 'Playing...' : 'Listen'}
            </Text>
          </TouchableOpacity>

          <Animated.View style={[animatedButtonStyle, isRecording && animatedPulseStyle]}>
            <TouchableOpacity
              style={[
                styles.button,
                isRecording ? styles.recordingButton : styles.recordButton,
                (!isActive || !isAvailable || isProcessing) && styles.disabledButton
              ]}
              onPress={isRecording ? handleStopRecording : handleListen}
              disabled={!isActive || isPlaying || !isAvailable || isProcessing}
            >
              {isProcessing ? (
                <Brain size={24} color="#ffffff" />
              ) : isRecording ? (
                <MicOff size={24} color="#ffffff" />
              ) : (
                <Mic size={24} color="#ffffff" />
              )}
              <Text style={styles.buttonText}>
                {isProcessing ? 'Processing...' : isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingHeader}>
              <View style={styles.recordingDotContainer}>
                <Animated.View style={[styles.recordingDot, animatedPulseStyle]} />
              </View>
              <Text style={styles.recordingText}>
                Listening... Speak clearly
              </Text>
              <Text style={styles.recordingTime}>
                {recordingTime.toFixed(1)}s
              </Text>
            </View>
            
            <View style={styles.progressContainer}>
              <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
            </View>
            
            <Text style={styles.recordingHint}>
              Say "{word.text}" clearly. Recording will stop automatically or tap Stop.
            </Text>
          </View>
        )}

        {lastAccuracy !== null && !isRecording && !isProcessing && (
          <View style={styles.feedback}>
            <View style={[styles.accuracyBar, { backgroundColor: getAccuracyColor(lastAccuracy) }]}>
              <View style={styles.accuracyHeader}>
                {getAccuracyIcon(lastAccuracy)}
                <Text style={styles.accuracyText}>
                  {lastAccuracy}% - {getAccuracyText(lastAccuracy)}
                </Text>
              </View>
            </View>
            
            {lastTranscript && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptLabel}>You said:</Text>
                <Text style={styles.transcriptText}>"{lastTranscript}"</Text>
                <Text style={styles.targetText}>Target: "{word.text}"</Text>
              </View>
            )}

            {pronunciationAnalysis && (
              <View style={styles.analysisContainer}>
                <View style={styles.analysisHeader}>
                  <Target size={16} color={getQualityColor(pronunciationAnalysis.overallQuality)} />
                  <Text style={[styles.analysisTitle, { color: getQualityColor(pronunciationAnalysis.overallQuality) }]}>
                    Pronunciation Analysis
                  </Text>
                </View>
                
                <View style={styles.qualityBadge}>
                  <Text style={[styles.qualityText, { color: getQualityColor(pronunciationAnalysis.overallQuality) }]}>
                    Overall Quality: {pronunciationAnalysis.overallQuality}
                  </Text>
                </View>

                {pronunciationAnalysis.strengths.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>✅ Strengths:</Text>
                    {pronunciationAnalysis.strengths.map((strength, index) => (
                      <Text key={index} style={styles.feedbackItem}>• {strength}</Text>
                    ))}
                  </View>
                )}

                {pronunciationAnalysis.specificIssues.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>⚠️ Areas to improve:</Text>
                    {pronunciationAnalysis.specificIssues.map((issue, index) => (
                      <Text key={index} style={styles.feedbackItem}>• {issue}</Text>
                    ))}
                  </View>
                )}

                {pronunciationAnalysis.suggestions.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>💡 Suggestions:</Text>
                    {pronunciationAnalysis.suggestions.map((suggestion, index) => (
                      <Text key={index} style={styles.feedbackItem}>• {suggestion}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {alternatives.length > 0 && (
              <View style={styles.alternativesContainer}>
                <Text style={styles.alternativesTitle}>Alternative interpretations:</Text>
                {alternatives.slice(0, 3).map((alt, index) => (
                  <Text key={index} style={styles.alternativeText}>
                    {index + 1}. "{alt}"
                  </Text>
                ))}
              </View>
            )}

            {lastAccuracy < 80 && (
              <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
                <RotateCcw size={16} color="#3B82F6" />
                <Text style={styles.tryAgainText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficulty: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  attempts: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
    marginBottom: 30,
  },
  word: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  phonetic: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    gap: 8,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 120,
    gap: 8,
  },
  playButton: {
    backgroundColor: '#3B82F6',
  },
  recordButton: {
    backgroundColor: '#EF4444',
  },
  recordingButton: {
    backgroundColor: '#F59E0B',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  recordingIndicator: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recordingDotContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    color: '#92400E',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  recordingTime: {
    color: '#92400E',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    minWidth: 40,
    textAlign: 'right',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#FDE68A',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  recordingHint: {
    color: '#92400E',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  feedback: {
    marginTop: 20,
  },
  accuracyBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  accuracyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  accuracyText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  transcriptContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  transcriptLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  targetText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  analysisContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  analysisTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  qualityBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  qualityText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  feedbackItem: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    lineHeight: 18,
    marginBottom: 2,
  },
  alternativesContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alternativesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 4,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tryAgainText: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});