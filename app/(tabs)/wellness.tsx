import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Smile, Moon, Coffee, Flower, CheckCircle, RotateCcw } from 'lucide-react-native';

interface WellnessActivity {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: 'mindfulness' | 'gratitude' | 'energy' | 'reflection';
  icon: React.ReactNode;
  gradient: string[];
  completed: boolean;
}

export default function WellnessScreen() {
  const [activities, setActivities] = useState<WellnessActivity[]>([]);
  const [completedToday, setCompletedToday] = useState(0);

  const wellnessActivities: Omit<WellnessActivity, 'id' | 'completed'>[] = [
    {
      title: 'Gratitude Moment',
      description: 'Think of three things you\'re grateful for today. Let that warm feeling fill your heart! 💝',
      duration: '2 min',
      category: 'gratitude',
      icon: <Heart size={24} color="#ffffff" />,
      gradient: ['#FF6B9D', '#C44569'],
    },
    {
      title: 'Mindful Breathing',
      description: 'Take 5 deep breaths. Inhale positivity, exhale any stress. You\'ve got this! 🌸',
      duration: '3 min',
      category: 'mindfulness',
      icon: <Flower size={24} color="#ffffff" />,
      gradient: ['#4ECDC4', '#44A08D'],
    },
    {
      title: 'Energy Boost',
      description: 'Do 10 jumping jacks or stretch your arms up high! Feel that energy flowing! ⚡',
      duration: '1 min',
      category: 'energy',
      icon: <Coffee size={24} color="#ffffff" />,
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      title: 'Smile Break',
      description: 'Give yourself a big smile in the mirror! You deserve all the happiness! 😊',
      duration: '30 sec',
      category: 'reflection',
      icon: <Smile size={24} color="#ffffff" />,
      gradient: ['#667eea', '#764ba2'],
    },
    {
      title: 'Positive Affirmation',
      description: 'Say "I am capable, I am worthy, I am enough" three times with conviction! ✨',
      duration: '1 min',
      category: 'reflection',
      icon: <Moon size={24} color="#ffffff" />,
      gradient: ['#a8edea', '#fed6e3'],
    },
    {
      title: 'Mindful Observation',
      description: 'Look around and notice 5 beautiful things in your environment. Beauty is everywhere! 🌟',
      duration: '2 min',
      category: 'mindfulness',
      icon: <Flower size={24} color="#ffffff" />,
      gradient: ['#ffecd2', '#fcb69f'],
    },
  ];

  useEffect(() => {
    // Initialize activities with random selection
    const shuffled = [...wellnessActivities].sort(() => 0.5 - Math.random());
    const dailyActivities = shuffled.slice(0, 4).map((activity, index) => ({
      ...activity,
      id: `activity-${index}`,
      completed: false,
    }));
    setActivities(dailyActivities);
  }, []);

  const completeActivity = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, completed: true }
          : activity
      )
    );
    
    setCompletedToday(prev => prev + 1);
    
    // Show encouraging message
    const encouragements = [
      "Amazing! 🌟 You're taking such good care of yourself!",
      "Wonderful! 💫 Every small step counts toward your wellbeing!",
      "Fantastic! ✨ You're building such healthy habits!",
      "Beautiful! 🌸 Your future self will thank you for this!",
      "Incredible! 💝 You're prioritizing what matters most - YOU!"
    ];
    
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    Alert.alert('Well Done! 🎉', randomEncouragement);
  };

  const resetActivities = () => {
    setActivities(prev => 
      prev.map(activity => ({ ...activity, completed: false }))
    );
    setCompletedToday(0);
  };

  const getProgressPercentage = () => {
    return activities.length > 0 ? (completedToday / activities.length) * 100 : 0;
  };

  const renderActivity = (activity: WellnessActivity) => (
    <View key={activity.id} style={styles.activityContainer}>
      <LinearGradient
        colors={activity.completed ? ['#10B981', '#059669'] : activity.gradient}
        style={[styles.activityCard, activity.completed && styles.completedCard]}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityIcon}>
            {activity.completed ? (
              <CheckCircle size={24} color="#ffffff" />
            ) : (
              activity.icon
            )}
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityDuration}>{activity.duration}</Text>
          </View>
        </View>
        
        <Text style={styles.activityDescription}>
          {activity.description}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.activityButton,
            activity.completed && styles.completedButton
          ]}
          onPress={() => completeActivity(activity.id)}
          disabled={activity.completed}
        >
          <Text style={styles.activityButtonText}>
            {activity.completed ? 'Completed! ✨' : 'Start Activity 🚀'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Heart size={28} color="#ffffff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Wellness Corner</Text>
              <Text style={styles.headerSubtitle}>Your daily dose of self-care 💝</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetActivities}
          >
            <RotateCcw size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={[
                  styles.progressBar,
                  { width: `${getProgressPercentage()}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedToday} of {activities.length} completed
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          🌟 Your Wellness Activities
        </Text>
        <Text style={styles.sectionSubtitle}>
          Small acts of self-care that make a big difference! Take your time and enjoy each moment.
        </Text>
        
        {activities.map(renderActivity)}
        
        {completedToday === activities.length && activities.length > 0 && (
          <View style={styles.celebrationContainer}>
            <LinearGradient
              colors={['#FF6B9D', '#C44569']}
              style={styles.celebrationCard}
            >
              <Text style={styles.celebrationTitle}>
                🎉 Incredible Work! 🎉
              </Text>
              <Text style={styles.celebrationText}>
                You've completed all your wellness activities today! You're absolutely amazing and deserve to feel proud of taking such wonderful care of yourself! 💝✨
              </Text>
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.bottomMessage}>
          <Text style={styles.bottomMessageText}>
            💫 Remember: Self-care isn't selfish - it's essential! You're worth every moment of kindness you give yourself.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#e2e8f0',
  },
  resetButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  activityContainer: {
    marginBottom: 16,
  },
  activityCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedCard: {
    opacity: 0.9,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  activityDuration: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 16,
  },
  activityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activityButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  celebrationContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  celebrationCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  celebrationText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomMessage: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomMessageText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FF6B9D',
    textAlign: 'center',
    lineHeight: 20,
  },
});