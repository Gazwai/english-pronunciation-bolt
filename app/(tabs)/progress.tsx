import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, Trophy, Target, Clock, TrendingUp, Award } from 'lucide-react-native';
import { dataService } from '../../services/dataService';
import { LinearGradient } from 'expo-linear-gradient';

const CURRENT_STUDENT_ID = '1';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

export default function ProgressScreen() {
  const [stats, setStats] = useState({
    totalWords: 0,
    completedWords: 0,
    averageAccuracy: 0,
    totalAttempts: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    const studentStats = dataService.getStudentStats(CURRENT_STUDENT_ID);
    setStats(studentStats);

    const attempts = dataService.getStudentAttempts(CURRENT_STUDENT_ID);
    const recent = attempts.slice(-10).reverse(); // Get last 10 attempts
    setRecentAttempts(recent);
  };

  const statCards: StatCard[] = [
    {
      title: 'Words Completed',
      value: `${stats.completedWords}/${stats.totalWords}`,
      subtitle: `${stats.totalWords > 0 ? Math.round((stats.completedWords / stats.totalWords) * 100) : 0}% complete`,
      icon: <Trophy size={24} color="#ffffff" />,
      color: '#10B981',
    },
    {
      title: 'Average Accuracy',
      value: `${stats.averageAccuracy}%`,
      subtitle: stats.averageAccuracy >= 80 ? 'Excellent!' : stats.averageAccuracy >= 60 ? 'Good progress' : 'Keep practicing',
      icon: <Target size={24} color="#ffffff" />,
      color: '#3B82F6',
    },
    {
      title: 'Total Attempts',
      value: stats.totalAttempts.toString(),
      subtitle: 'Practice sessions',
      icon: <Clock size={24} color="#ffffff" />,
      color: '#F59E0B',
    },
    {
      title: 'Success Rate',
      value: `${stats.totalAttempts > 0 ? Math.round((stats.completedWords / stats.totalAttempts) * 100) : 0}%`,
      subtitle: 'First-try success',
      icon: <TrendingUp size={24} color="#ffffff" />,
      color: '#EF4444',
    },
  ];

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#10B981';
    if (accuracy >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getAccuracyText = (accuracy: number) => {
    if (accuracy >= 80) return 'Excellent';
    if (accuracy >= 60) return 'Good';
    return 'Needs practice';
  };

  const renderStatCard = (card: StatCard, index: number) => (
    <View key={index} style={styles.statCard}>
      <LinearGradient
        colors={[card.color, card.color + 'CC']}
        style={styles.statCardGradient}
      >
        <View style={styles.statCardIcon}>
          {card.icon}
        </View>
        <View style={styles.statCardContent}>
          <Text style={styles.statCardTitle}>{card.title}</Text>
          <Text style={styles.statCardValue}>{card.value}</Text>
          <Text style={styles.statCardSubtitle}>{card.subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderRecentAttempt = (attempt: any, index: number) => {
    const wordLists = dataService.getWordLists();
    const word = wordLists
      .flatMap(list => list.words)
      .find(w => w.id === attempt.wordId);

    return (
      <View key={attempt.id} style={styles.attemptCard}>
        <View style={styles.attemptHeader}>
          <Text style={styles.attemptWord}>{word?.text || 'Unknown word'}</Text>
          <View style={[styles.accuracyBadge, { backgroundColor: getAccuracyColor(attempt.accuracy) }]}>
            <Text style={styles.accuracyBadgeText}>{attempt.accuracy}%</Text>
          </View>
        </View>
        <View style={styles.attemptDetails}>
          <Text style={styles.attemptCategory}>{word?.category || 'Unknown'}</Text>
          <Text style={styles.attemptStatus}>{getAccuracyText(attempt.accuracy)}</Text>
          <Text style={styles.attemptTime}>
            {new Date(attempt.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Track your pronunciation journey</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {statCards.map(renderStatCard)}
          </View>
        </View>

        {stats.completedWords > 0 && (
          <View style={styles.achievementSection}>
            <View style={styles.achievementCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.achievementGradient}
              >
                <Award size={32} color="#ffffff" />
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>Keep it up!</Text>
                  <Text style={styles.achievementText}>
                    You've completed {stats.completedWords} words with an average accuracy of {stats.averageAccuracy}%
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentAttempts.length === 0 ? (
            <View style={styles.emptyState}>
              <BarChart3 size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>Start practicing to see your progress here</Text>
            </View>
          ) : (
            <View style={styles.attemptsContainer}>
              {recentAttempts.map(renderRecentAttempt)}
            </View>
          )}
        </View>
      </ScrollView>
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
    color: '#E9D5FF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  statCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statCardContent: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.8,
  },
  achievementSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  achievementCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  achievementContent: {
    flex: 1,
    marginLeft: 16,
  },
  achievementTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  achievementText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 20,
  },
  attemptsContainer: {
    gap: 12,
  },
  attemptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attemptWord: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  accuracyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accuracyBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  attemptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  attemptStatus: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  attemptTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
});