import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, Volume2, Mic, CircleHelp as HelpCircle, Info, Trash2, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset logic would go here
            Alert.alert('Success', 'Progress has been reset successfully!');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'Pronunciation Practice App v1.0.0\n\nThis app helps students improve their English pronunciation through interactive practice sessions with real-time feedback.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help',
      'How to use the app:\n\n1. Select a word list from the Practice tab\n2. Listen to the pronunciation example\n3. Record yourself saying the word\n4. Get instant feedback on your accuracy\n5. Achieve 80% accuracy to unlock the next word\n\nFor teachers: Use the Teacher tab to create and manage word lists.',
      [{ text: 'OK' }]
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    danger = false
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, danger && styles.dangerItem]}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        <Text style={[styles.settingSubtitle, danger && styles.dangerSubtext]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your learning experience</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Settings</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Volume2 size={20} color="#3B82F6" />,
              'Pronunciation Examples',
              'Play audio examples for each word',
              () => Alert.alert('Info', 'Audio examples are always enabled for better learning experience.')
            )}
            {renderSettingItem(
              <Mic size={20} color="#3B82F6" />,
              'Microphone Settings',
              'Configure speech recognition',
              () => Alert.alert('Info', 'Microphone access is required for pronunciation practice.')
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <RefreshCw size={20} color="#F59E0B" />,
              'Reset Progress',
              'Clear all your learning progress',
              handleResetProgress,
              true
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <HelpCircle size={20} color="#10B981" />,
              'Help & Tutorial',
              'Learn how to use the app effectively',
              handleHelp
            )}
            {renderSettingItem(
              <Info size={20} color="#10B981" />,
              'About',
              'App version and information',
              handleAbout
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pronunciation Practice App
          </Text>
          <Text style={styles.footerSubtext}>
            Version 1.0.0 • Made with ❤️ for language learners
          </Text>
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
    color: '#C7D2FE',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  settingsGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dangerItem: {
    backgroundColor: '#FEF2F2',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dangerIcon: {
    backgroundColor: '#FEE2E2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  dangerText: {
    color: '#DC2626',
  },
  dangerSubtext: {
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
});