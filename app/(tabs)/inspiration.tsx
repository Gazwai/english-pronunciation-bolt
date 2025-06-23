import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, RefreshCw, Heart, Star, Zap, Sun } from 'lucide-react-native';
import { geminiService } from '../../services/geminiService';

interface InspirationCard {
  id: string;
  title: string;
  content: string;
  category: 'motivation' | 'affirmation' | 'wisdom' | 'energy';
  icon: React.ReactNode;
  gradient: string[];
}

export default function InspirationScreen() {
  const [inspirationCards, setInspirationCards] = useState<InspirationCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categoryConfig = {
    motivation: {
      icon: <Zap size={24} color="#ffffff" />,
      gradient: ['#FF6B9D', '#C44569'],
      prompts: [
        'Give me a short motivational message about pursuing dreams',
        'Share an inspiring quote about overcoming challenges',
        'Write a brief motivational message about believing in yourself',
        'Give me encouragement about taking the first step toward goals'
      ]
    },
    affirmation: {
      icon: <Heart size={24} color="#ffffff" />,
      gradient: ['#4ECDC4', '#44A08D'],
      prompts: [
        'Write a positive affirmation about self-worth',
        'Give me an affirmation about inner strength',
        'Share a loving affirmation about self-acceptance',
        'Write an affirmation about personal growth'
      ]
    },
    wisdom: {
      icon: <Star size={24} color="#ffffff" />,
      gradient: ['#667eea', '#764ba2'],
      prompts: [
        'Share a piece of wisdom about life balance',
        'Give me insight about finding happiness in small things',
        'Write wisdom about the importance of kindness',
        'Share thoughts about embracing change positively'
      ]
    },
    energy: {
      icon: <Sun size={24} color="#ffffff" />,
      gradient: ['#f093fb', '#f5576c'],
      prompts: [
        'Give me an energizing message to start the day',
        'Write something uplifting about new possibilities',
        'Share an energetic message about seizing opportunities',
        'Give me motivation to stay positive and energetic'
      ]
    }
  };

  const generateInspiration = async () => {
    setIsLoading(true);
    const newCards: InspirationCard[] = [];

    try {
      for (const [category, config] of Object.entries(categoryConfig)) {
        const randomPrompt = config.prompts[Math.floor(Math.random() * config.prompts.length)];
        const prompt = `${randomPrompt}. Keep it brief (2-3 sentences), positive, and include appropriate emojis. Make it feel personal and encouraging.`;
        
        try {
          const response = await geminiService.sendMessage(prompt);
          
          newCards.push({
            id: `${category}-${Date.now()}`,
            title: category.charAt(0).toUpperCase() + category.slice(1),
            content: response,
            category: category as any,
            icon: config.icon,
            gradient: config.gradient,
          });
        } catch (error) {
          console.error(`Error generating ${category}:`, error);
          // Fallback content
          const fallbackContent = getFallbackContent(category as keyof typeof categoryConfig);
          newCards.push({
            id: `${category}-${Date.now()}`,
            title: category.charAt(0).toUpperCase() + category.slice(1),
            content: fallbackContent,
            category: category as any,
            icon: config.icon,
            gradient: config.gradient,
          });
        }
      }

      setInspirationCards(newCards);
    } catch (error) {
      console.error('Error generating inspiration:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getFallbackContent = (category: keyof typeof categoryConfig): string => {
    const fallbacks = {
      motivation: "🌟 You have everything within you to achieve amazing things! Every step forward, no matter how small, is progress worth celebrating. Keep shining! ✨",
      affirmation: "💝 You are worthy of love, success, and happiness exactly as you are. Your unique qualities make the world a brighter place. Embrace your wonderful self! 🌈",
      wisdom: "⭐ Life's most beautiful moments often come from the simplest experiences. Take time to appreciate the little joys around you - they add up to create a meaningful life! 🌸",
      energy: "☀️ Today is full of new possibilities and opportunities waiting for you! Approach each moment with curiosity and enthusiasm. You've got this! 🚀"
    };
    return fallbacks[category];
  };

  const onRefresh = () => {
    setRefreshing(true);
    generateInspiration();
  };

  useEffect(() => {
    generateInspiration();
  }, []);

  const renderInspirationCard = (card: InspirationCard) => (
    <View key={card.id} style={styles.cardContainer}>
      <LinearGradient
        colors={card.gradient}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            {card.icon}
          </View>
          <Text style={styles.cardTitle}>{card.title}</Text>
        </View>
        
        <Text style={styles.cardContent}>{card.content}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>From PuroPuro with 💝</Text>
        </View>
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
            <Sparkles size={28} color="#ffffff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Daily Inspiration</Text>
              <Text style={styles.headerSubtitle}>Positive vibes just for you! ✨</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={generateInspiration}
            disabled={isLoading}
          >
            <RefreshCw 
              size={24} 
              color="#ffffff" 
              style={[isLoading && styles.spinning]} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B9D']}
            tintColor="#FF6B9D"
          />
        }
      >
        {isLoading && inspirationCards.length === 0 ? (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['#FF6B9D', '#C44569']}
              style={styles.loadingCard}
            >
              <Sparkles size={40} color="#ffffff" />
              <Text style={styles.loadingText}>
                PuroPuro is crafting some special inspiration just for you! ✨
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              🌟 Your Personal Inspiration Collection
            </Text>
            <Text style={styles.sectionSubtitle}>
              Fresh positive energy, delivered with love! Pull down to refresh for new inspiration.
            </Text>
            
            {inspirationCards.map(renderInspirationCard)}
            
            <View style={styles.bottomMessage}>
              <Text style={styles.bottomMessageText}>
                💫 Remember: You're amazing, and every day is a new opportunity to shine! 
              </Text>
            </View>
          </>
        )}
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
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  spinning: {
    // Add rotation animation if needed
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
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
  },
  cardContent: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 16,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  cardFooterText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
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