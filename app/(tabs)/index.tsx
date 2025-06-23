import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Sparkles } from 'lucide-react-native';
import PuropuroChat from '../../components/PuropuroChat';

export default function ChatScreen() {
  const [userName, setUserName] = useState('');
  const [hasSetName, setHasSetName] = useState(false);
  const [tempName, setTempName] = useState('');

  const handleSetName = () => {
    if (!tempName.trim()) {
      Alert.alert('Oops! 😊', 'Please enter your name so PuroPuro can greet you properly! ✨');
      return;
    }
    setUserName(tempName.trim());
    setHasSetName(true);
  };

  const handleChangeName = () => {
    setHasSetName(false);
    setTempName(userName);
  };

  if (!hasSetName) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.welcomeContainer}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FF6B9D', '#C44569']}
                style={styles.logo}
              >
                <Sparkles size={40} color="#ffffff" />
              </LinearGradient>
            </View>
            
            <Text style={styles.welcomeTitle}>Welcome to PuroPuro! 🌟</Text>
            <Text style={styles.welcomeSubtitle}>
              Your friendly AI companion is here to brighten your day with positivity, encouragement, and cheerful conversations! ✨
            </Text>
            
            <View style={styles.nameInputContainer}>
              <Text style={styles.nameInputLabel}>What should I call you? 😊</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#64748b" />
                <TextInput
                  style={styles.nameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Enter your name..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.startButton,
                  !tempName.trim() && styles.startButtonDisabled,
                ]}
                onPress={handleSetName}
                disabled={!tempName.trim()}
              >
                <LinearGradient
                  colors={
                    !tempName.trim()
                      ? ['#e2e8f0', '#cbd5e1']
                      : ['#FF6B9D', '#C44569']
                  }
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Start Chatting! 🚀</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <PuropuroChat userName={userName} />
      
      <TouchableOpacity
        style={styles.changeNameButton}
        onPress={handleChangeName}
      >
        <Text style={styles.changeNameText}>Change Name</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 400,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  nameInputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nameInputLabel: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#334155',
    marginLeft: 12,
  },
  startButton: {
    width: '100%',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonGradient: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
  },
  changeNameButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeNameText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#667eea',
  },
});