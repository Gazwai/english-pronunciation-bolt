import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Trophy, Star } from 'lucide-react-native';
import { dataService } from '../../services/dataService';
import { speechService } from '../../services/speechRecognition';
import { Word, WordList, StudentProgress } from '../../types';
import PronunciationCard from '../../components/PronunciationCard';
import ProgressBar from '../../components/ProgressBar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const ACCURACY_THRESHOLD = 80;
const CURRENT_STUDENT_ID = '1';

export default function StudentPracticeScreen() {
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [currentWordListIndex, setCurrentWordListIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [recentAccuracy, setRecentAccuracy] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const celebrationScale = useSharedValue(0);

  useEffect(() => {
    loadWordLists();
  }, []);

  useEffect(() => {
    if (wordLists.length > 0) {
      loadProgress();
    }
  }, [wordLists, currentWordListIndex]);

  const loadWordLists = () => {
    const lists = dataService.getWordLists();
    setWordLists(lists);
  };

  const loadProgress = () => {
    const currentWordList = wordLists[currentWordListIndex];
    if (currentWordList) {
      const studentProgress = dataService.getStudentProgress(CURRENT_STUDENT_ID, currentWordList.id);
      if (studentProgress) {
        setProgress(studentProgress);
        setCurrentWordIndex(studentProgress.currentWordIndex);
      } else {
        // Initialize new progress
        const newProgress = dataService.updateStudentProgress(CURRENT_STUDENT_ID, currentWordList.id, {
          currentWordIndex: 0,
          completedWords: [],
          totalAttempts: 0,
          successfulAttempts: 0,
          averageAccuracy: 0,
        });
        setProgress(newProgress);
        setCurrentWordIndex(0);
      }
    }
  };

  const handlePronunciationResult = (accuracy: number, transcript: string) => {
    if (!progress || !wordLists[currentWordListIndex]) return;

    const currentWordList = wordLists[currentWordListIndex];
    const currentWord = currentWordList.words[currentWordIndex];

    // Record the attempt
    dataService.recordAttempt({
      studentId: CURRENT_STUDENT_ID,
      wordId: currentWord.id,
      accuracy,
      passed: accuracy >= ACCURACY_THRESHOLD,
    });

    setRecentAccuracy(accuracy);

    // Update progress
    const newTotalAttempts = progress.totalAttempts + 1;
    const newSuccessfulAttempts = accuracy >= ACCURACY_THRESHOLD 
      ? progress.successfulAttempts + 1 
      : progress.successfulAttempts;

    let updatedProgress = {
      ...progress,
      totalAttempts: newTotalAttempts,
      successfulAttempts: newSuccessfulAttempts,
      averageAccuracy: Math.round(
        ((progress.averageAccuracy * progress.totalAttempts) + accuracy) / newTotalAttempts
      ),
    };

    // If passed, move to next word
    if (accuracy >= ACCURACY_THRESHOLD) {
      const newCompletedWords = [...progress.completedWords];
      if (!newCompletedWords.includes(currentWord.id)) {
        newCompletedWords.push(currentWord.id);
      }

      const nextWordIndex = Math.min(currentWordIndex + 1, currentWordList.words.length - 1);
      
      updatedProgress = {
        ...updatedProgress,
        completedWords: newCompletedWords,
        currentWordIndex: nextWordIndex,
      };

      // Show celebration
      setShowCelebration(true);
      celebrationScale.value = withSpring(1);
      setTimeout(() => {
        celebrationScale.value = withSpring(0);
        setShowCelebration(false);
      }, 2000);

      // Auto-advance after a delay
      setTimeout(() => {
        if (nextWordIndex < currentWordList.words.length) {
          setCurrentWordIndex(nextWordIndex);
        }
      }, 2500);
    }

    const newProgress = dataService.updateStudentProgress(CURRENT_STUDENT_ID, currentWordList.id, updatedProgress);
    setProgress(newProgress);
  };

  const navigateWordList = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentWordListIndex - 1)
      : Math.min(wordLists.length - 1, currentWordListIndex + 1);
    
    setCurrentWordListIndex(newIndex);
    setRecentAccuracy(null);
  };

  const canNavigateWord = (direction: 'prev' | 'next') => {
    if (!progress || !wordLists[currentWordListIndex]) return false;

    if (direction === 'prev') {
      return currentWordIndex > 0;
    } else {
      const currentWord = wordLists[currentWordListIndex].words[currentWordIndex];
      const isCompleted = progress.completedWords.includes(currentWord.id);
      return isCompleted && currentWordIndex < wordLists[currentWordListIndex].words.length - 1;
    }
  };

  const navigateWord = (direction: 'prev' | 'next') => {
    if (!canNavigateWord(direction)) return;

    const newIndex = direction === 'prev' 
      ? Math.max(0, currentWordIndex - 1)
      : Math.min(wordLists[currentWordListIndex].words.length - 1, currentWordIndex + 1);
    
    setCurrentWordIndex(newIndex);
    setRecentAccuracy(null);
  };

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: celebrationScale.value,
  }));

  if (wordLists.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No word lists available</Text>
          <Text style={styles.emptySubtext}>Ask your teacher to create some word lists for you!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentWordList = wordLists[currentWordListIndex];
  const currentWord = currentWordList?.words[currentWordIndex];
  const isCurrentWordCompleted = progress?.completedWords.includes(currentWord?.id || '') || false;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#1E40AF']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pronunciation Practice</Text>
          <Text style={styles.headerSubtitle}>{currentWordList?.name}</Text>
        </View>
      </LinearGradient>

      <ProgressBar
        current={progress?.completedWords.length || 0}
        total={currentWordList?.words.length || 0}
        accuracy={progress?.averageAccuracy}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentWordListIndex === 0 && styles.navButtonDisabled]}
            onPress={() => navigateWordList('prev')}
            disabled={currentWordListIndex === 0}
          >
            <ChevronLeft size={20} color={currentWordListIndex === 0 ? '#94A3B8' : '#ffffff'} />
            <Text style={[styles.navButtonText, currentWordListIndex === 0 && styles.navButtonTextDisabled]}>
              Prev List
            </Text>
          </TouchableOpacity>

          <View style={styles.wordListIndicator}>
            <Text style={styles.wordListText}>
              {currentWordListIndex + 1} / {wordLists.length}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.navButton, currentWordListIndex === wordLists.length - 1 && styles.navButtonDisabled]}
            onPress={() => navigateWordList('next')}
            disabled={currentWordListIndex === wordLists.length - 1}
          >
            <Text style={[styles.navButtonText, currentWordListIndex === wordLists.length - 1 && styles.navButtonTextDisabled]}>
              Next List
            </Text>
            <ChevronRight size={20} color={currentWordListIndex === wordLists.length - 1 ? '#94A3B8' : '#ffffff'} />
          </TouchableOpacity>
        </View>

        {currentWord && (
          <PronunciationCard
            word={currentWord}
            onPronunciationResult={handlePronunciationResult}
            isActive={!isCurrentWordCompleted || currentWordIndex === (progress?.currentWordIndex || 0)}
          />
        )}

        <View style={styles.wordNavigation}>
          <TouchableOpacity
            style={[styles.wordNavButton, !canNavigateWord('prev') && styles.wordNavButtonDisabled]}
            onPress={() => navigateWord('prev')}
            disabled={!canNavigateWord('prev')}
          >
            <ChevronLeft size={20} color={!canNavigateWord('prev') ? '#94A3B8' : '#3B82F6'} />
            <Text style={[styles.wordNavButtonText, !canNavigateWord('prev') && styles.wordNavButtonTextDisabled]}>
              Previous Word
            </Text>
          </TouchableOpacity>

          <View style={styles.wordIndicator}>
            <Text style={styles.wordIndicatorText}>
              {currentWordIndex + 1} / {currentWordList?.words.length || 0}
            </Text>
            {isCurrentWordCompleted && (
              <View style={styles.completedBadge}>
                <Star size={12} color="#10B981" />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.wordNavButton, !canNavigateWord('next') && styles.wordNavButtonDisabled]}
            onPress={() => navigateWord('next')}
            disabled={!canNavigateWord('next')}
          >
            <Text style={[styles.wordNavButtonText, !canNavigateWord('next') && styles.wordNavButtonTextDisabled]}>
              Next Word
            </Text>
            <ChevronRight size={20} color={!canNavigateWord('next') ? '#94A3B8' : '#3B82F6'} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showCelebration && (
        <Animated.View style={[styles.celebration, celebrationStyle]}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.celebrationContent}
          >
            <Trophy size={40} color="#ffffff" />
            <Text style={styles.celebrationText}>Great Job!</Text>
            <Text style={styles.celebrationSubtext}>You can move to the next word!</Text>
          </LinearGradient>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  navButtonTextDisabled: {
    color: '#94A3B8',
  },
  wordListIndicator: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wordListText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  wordNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
  },
  wordNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  wordNavButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  wordNavButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  wordNavButtonTextDisabled: {
    color: '#94A3B8',
  },
  wordIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  wordIndicatorText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  celebration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  celebrationContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  celebrationSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
});