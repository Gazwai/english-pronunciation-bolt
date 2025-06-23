import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot, User, Sparkles, Heart, RefreshCw, Trash2 } from 'lucide-react-native';
import { geminiService } from '../services/geminiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface PuropuroChatProps {
  userName?: string;
}

export default function PuropuroChat({ userName }: PuropuroChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey there${userName ? ` ${userName}` : ''}! 🌟 I'm PuroPuro, your cheerful AI companion! I'm here to cheer you on, celebrate your wins (big and small!), and sprinkle some positivity into your day! ✨ What's on your mind today? I'm excited to chat with you! 💫`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sparkle animation for PuroPuro's messages
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isTyping]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await geminiService.sendMessage(inputText.trim(), userName);
      
      // Simulate typing delay for more natural feel
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000); // 1-2 second delay

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Oops! 😅 I'm having a tiny tech hiccup, but I'm still here cheering you on! 🌟 You're doing amazing! ✨",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    geminiService.clearChatHistory();
    setMessages([
      {
        id: '1',
        text: `Hey there${userName ? ` ${userName}` : ''}! 🌟 I'm PuroPuro, your cheerful AI companion! I'm here to cheer you on, celebrate your wins (big and small!), and sprinkle some positivity into your day! ✨ What's on your mind today? I'm excited to chat with you! 💫`,
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = (message: Message) => {
    const sparkleRotation = sparkleAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!message.isUser && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FF6B9D', '#C44569']}
              style={styles.aiAvatar}
            >
              <Bot size={20} color="#ffffff" />
              <Animated.View
                style={[
                  styles.sparkle,
                  {
                    transform: [{ rotate: sparkleRotation }],
                  },
                ]}
              >
                <Sparkles size={12} color="#FFD700" />
              </Animated.View>
            </LinearGradient>
          </View>
        )}
        
        {message.isUser && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.userAvatar}
            >
              <User size={20} color="#ffffff" />
            </LinearGradient>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.isUser ? styles.userText : styles.aiText,
            ]}
          >
            {message.text}
          </Text>
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    const dotScale = typingAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#FF6B9D', '#C44569']}
            style={styles.aiAvatar}
          >
            <Bot size={20} color="#ffffff" />
          </LinearGradient>
        </View>
        
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingDot, { transform: [{ scale: dotScale }] }]} />
            <Animated.View style={[styles.typingDot, { transform: [{ scale: dotScale }] }]} />
            <Animated.View style={[styles.typingDot, { transform: [{ scale: dotScale }] }]} />
          </View>
          <Text style={styles.typingText}>PuroPuro is typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#FF6B9D', '#C44569']}
              style={styles.headerAvatar}
            >
              <Bot size={24} color="#ffffff" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>PuroPuro</Text>
              <Text style={styles.headerSubtitle}>Your AI Cheerleader 🌟</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Trash2 size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        {isTyping && renderTypingIndicator()}
      </ScrollView>

      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.inputWrapper}
        >
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share what's on your mind... 💭"
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <LinearGradient
              colors={
                !inputText.trim() || isLoading
                  ? ['#e2e8f0', '#cbd5e1']
                  : ['#FF6B9D', '#C44569']
              }
              style={styles.sendButtonGradient}
            >
              {isLoading ? (
                <RefreshCw size={20} color="#ffffff" />
              ) : (
                <Send size={20} color="#ffffff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
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
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  messageBubble: {
    maxWidth: Dimensions.get('window').width * 0.7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#4ECDC4',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#334155',
  },
  timestamp: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B9D',
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#334155',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});