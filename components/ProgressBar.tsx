import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, TrendingUp, Target } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withDelay } from 'react-native-reanimated';

interface ProgressBarProps {
  current: number;
  total: number;
  accuracy?: number;
}

export default function ProgressBar({ current, total, accuracy }: ProgressBarProps) {
  const progress = useSharedValue(0);
  const accuracyScale = useSharedValue(0);
  const trophyRotation = useSharedValue(0);
  const starScale = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((current / total) * 100, { duration: 1500 });
    
    if (accuracy) {
      accuracyScale.value = withDelay(500, withSpring(1, { damping: 8 }));
    }

    // Animate trophy for high completion
    if (current / total > 0.7) {
      trophyRotation.value = withSequence(
        withDelay(1000, withTiming(10, { duration: 200 })),
        withTiming(-10, { duration: 400 }),
        withTiming(0, { duration: 200 })
      );
    }

    // Animate stars for high accuracy
    if (accuracy && accuracy >= 80) {
      starScale.value = withDelay(1200, withSequence(
        withSpring(1.3, { damping: 6 }),
        withSpring(1, { damping: 8 })
      ));
    }
  }, [current, total, accuracy]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const animatedAccuracyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: accuracyScale.value }],
    opacity: accuracyScale.value,
  }));

  const animatedTrophyStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${trophyRotation.value}deg` }],
  }));

  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  const getProgressColor = () => {
    const percentage = current / total;
    if (percentage >= 0.8) return ['#10B981', '#059669'];
    if (percentage >= 0.6) return ['#3B82F6', '#1E40AF'];
    if (percentage >= 0.4) return ['#F59E0B', '#D97706'];
    return ['#EF4444', '#DC2626'];
  };

  const getAccuracyColor = () => {
    if (!accuracy) return '#64748B';
    if (accuracy >= 85) return '#10B981';
    if (accuracy >= 70) return '#3B82F6';
    if (accuracy >= 55) return '#F59E0B';
    return '#EF4444';
  };

  const getMotivationalMessage = () => {
    const percentage = current / total;
    if (percentage === 1) return "🎉 Perfect completion!";
    if (percentage >= 0.8) return "🔥 Almost there!";
    if (percentage >= 0.6) return "💪 Great progress!";
    if (percentage >= 0.4) return "🚀 Keep going!";
    if (percentage >= 0.2) return "⭐ You're doing great!";
    return "🌟 Every step counts!";
  };

  const getAccuracyMessage = () => {
    if (!accuracy) return "";
    if (accuracy >= 90) return "Outstanding precision! 🎯";
    if (accuracy >= 80) return "Excellent accuracy! ✨";
    if (accuracy >= 70) return "Great job! 👍";
    if (accuracy >= 60) return "Good effort! 📈";
    return "Keep practicing! 💪";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Animated.View style={animatedTrophyStyle}>
            <Trophy size={18} color="#F59E0B" />
          </Animated.View>
          <Text style={styles.title}>Your Progress</Text>
          {accuracy && accuracy >= 80 && (
            <Animated.View style={animatedStarStyle}>
              <Star size={16} color="#10B981" />
            </Animated.View>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.stats}>
            {current}/{total} words
          </Text>
          {accuracy && (
            <Animated.View style={[styles.accuracyBadge, animatedAccuracyStyle, { backgroundColor: getAccuracyColor() }]}>
              <Target size={12} color="#ffffff" />
              <Text style={styles.accuracyText}>{accuracy}%</Text>
            </Animated.View>
          )}
        </View>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressBar, animatedStyle]}>
              <LinearGradient
                colors={getProgressColor()}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          
          {/* Progress percentage indicator */}
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>
              {Math.round((current / total) * 100)}%
            </Text>
          </View>
        </View>

        {/* Motivational messages */}
        <View style={styles.messageContainer}>
          <Text style={styles.motivationalMessage}>
            {getMotivationalMessage()}
          </Text>
          {accuracy && (
            <Text style={[styles.accuracyMessage, { color: getAccuracyColor() }]}>
              {getAccuracyMessage()}
            </Text>
          )}
        </View>

        {/* Achievement indicators */}
        <View style={styles.achievementContainer}>
          {current / total >= 0.25 && (
            <View style={[styles.achievementBadge, styles.bronzeBadge]}>
              <Text style={styles.achievementText}>🥉 Getting Started</Text>
            </View>
          )}
          {current / total >= 0.5 && (
            <View style={[styles.achievementBadge, styles.silverBadge]}>
              <Text style={styles.achievementText}>🥈 Halfway Hero</Text>
            </View>
          )}
          {current / total >= 0.75 && (
            <View style={[styles.achievementBadge, styles.goldBadge]}>
              <Text style={styles.achievementText}>🥇 Almost Master</Text>
            </View>
          )}
          {current / total === 1 && (
            <View style={[styles.achievementBadge, styles.platinumBadge]}>
              <Text style={styles.achievementText}>💎 Word Master</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stats: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  accuracyText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  progressSection: {
    gap: 12,
  },
  progressContainer: {
    position: 'relative',
  },
  progressBackground: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  percentageContainer: {
    position: 'absolute',
    right: 8,
    top: -2,
  },
  percentageText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 4,
  },
  motivationalMessage: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    textAlign: 'center',
  },
  accuracyMessage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  achievementContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  achievementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  bronzeBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  silverBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#64748B',
  },
  goldBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  platinumBadge: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  achievementText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
});