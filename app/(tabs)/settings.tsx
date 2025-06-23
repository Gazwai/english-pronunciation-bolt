import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings as SettingsIcon, User, Bell, Palette, Heart, Info, MessageCircle, Shield, CircleHelp as HelpCircle, Star } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [positiveMode, setPositiveMode] = useState(true);

  const handleAbout = () => {
    Alert.alert(
      '💝 About PuroPuro',
      'PuroPuro is your friendly AI companion designed to spread positivity, encouragement, and joy! Created with love to make your days brighter and help you feel supported on your journey.\n\nVersion 1.0.0\n\nMade with ❤️ for amazing people like you! ✨',
      [{ text: 'Aww, thanks! 🥰' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      '🌟 How to Use PuroPuro',
      'Chat Tab: Have conversations with your AI friend PuroPuro! Share your thoughts, feelings, or just say hello!\n\nInspiration Tab: Get daily doses of motivation, affirmations, and positive energy!\n\nWellness Tab: Complete simple self-care activities to boost your mood and wellbeing!\n\nRemember: PuroPuro is here to support and encourage you every step of the way! 💫',
      [{ text: 'Got it! 🚀' }]
    );
  };

  const handleFeedback = () => {
    Alert.alert(
      '💌 We Love Your Feedback!',
      'Your thoughts and suggestions help make PuroPuro even better! We\'d love to hear about your experience and any ideas you have for improvement.\n\nThank you for being part of our positive community! 🌈',
      [
        { text: 'Maybe Later 😊' },
        { text: 'I\'d Love To Share! 💝' }
      ]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      '🔒 Your Privacy Matters',
      'PuroPuro is designed with your privacy in mind:\n\n• Your conversations are processed securely\n• We don\'t store personal information unnecessarily\n• Your wellbeing data stays on your device\n• We believe in transparency and respect\n\nYour trust means everything to us! 💝',
      [{ text: 'Thank You! 🙏' }]
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode,
    gradient: string[] = ['#f8fafc', '#e2e8f0']
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient
        colors={gradient}
        style={styles.settingItemGradient}
      >
        <View style={styles.settingIcon}>
          {icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
        {rightComponent && (
          <View style={styles.settingRight}>
            {rightComponent}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <SettingsIcon size={28} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your PuroPuro experience ⚙️</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile</Text>
          {renderSettingItem(
            <User size={20} color="#4ECDC4" />,
            'Personal Information',
            'Manage your profile and preferences',
            () => Alert.alert('Coming Soon! 🚀', 'Profile customization features are on the way! ✨'),
            undefined,
            ['#E0F7FA', '#B2EBF2']
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          {renderSettingItem(
            <Bell size={20} color="#FF6B9D" />,
            'Push Notifications',
            'Get encouraging messages throughout the day',
            undefined,
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e2e8f0', true: '#FF6B9D' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#94a3b8'}
            />,
            ['#FCE4EC', '#F8BBD9']
          )}
          {renderSettingItem(
            <MessageCircle size={20} color="#667eea" />,
            'Daily Wellness Reminders',
            'Gentle nudges for self-care activities',
            undefined,
            <Switch
              value={dailyReminders}
              onValueChange={setDailyReminders}
              trackColor={{ false: '#e2e8f0', true: '#667eea' }}
              thumbColor={dailyReminders ? '#ffffff' : '#94a3b8'}
            />,
            ['#E8EAF6', '#C5CAE9']
          )}
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Experience</Text>
          {renderSettingItem(
            <Heart size={20} color="#10B981" />,
            'Extra Positive Mode',
            'Turn up the encouragement and positivity!',
            undefined,
            <Switch
              value={positiveMode}
              onValueChange={setPositiveMode}
              trackColor={{ false: '#e2e8f0', true: '#10B981' }}
              thumbColor={positiveMode ? '#ffffff' : '#94a3b8'}
            />,
            ['#ECFDF5', '#D1FAE5']
          )}
          {renderSettingItem(
            <Palette size={20} color="#f093fb" />,
            'Theme & Appearance',
            'Customize colors and visual style',
            () => Alert.alert('Coming Soon! 🎨', 'Theme customization is being designed with love! 💝'),
            undefined,
            ['#FDF2F8', '#FCE7F3']
          )}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💝 Support & Info</Text>
          {renderSettingItem(
            <HelpCircle size={20} color="#F59E0B" />,
            'Help & Tutorial',
            'Learn how to make the most of PuroPuro',
            handleHelp,
            undefined,
            ['#FFFBEB', '#FEF3C7']
          )}
          {renderSettingItem(
            <Star size={20} color="#8B5CF6" />,
            'Share Feedback',
            'Help us make PuroPuro even better!',
            handleFeedback,
            undefined,
            ['#F3E8FF', '#E9D5FF']
          )}
          {renderSettingItem(
            <Shield size={20} color="#6366F1" />,
            'Privacy & Security',
            'Learn about how we protect your data',
            handlePrivacy,
            undefined,
            ['#EEF2FF', '#E0E7FF']
          )}
          {renderSettingItem(
            <Info size={20} color="#64748B" />,
            'About PuroPuro',
            'Version info and credits',
            handleAbout,
            undefined,
            ['#F8FAFC', '#F1F5F9']
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with 💝 for amazing people like you!
          </Text>
          <Text style={styles.footerSubtext}>
            PuroPuro v1.0.0 • Spreading positivity one conversation at a time ✨
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#334155',
    marginBottom: 12,
  },
  settingItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#334155',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    lineHeight: 18,
  },
  settingRight: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FF6B9D',
    marginBottom: 4,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});