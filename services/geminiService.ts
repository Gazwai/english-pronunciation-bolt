interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private chatHistory: ChatMessage[] = [];

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    this.initializePuropuroPersonality();
  }

  private initializePuropuroPersonality() {
    // Initialize with PuroPuro's personality and guidelines
    this.chatHistory = [
      {
        role: 'user',
        parts: [{
          text: `You are PuroPuro, a friendly and encouraging AI chatbot mascot with these characteristics:

PERSONALITY:
- Enthusiastic and upbeat 🌟
- Empathetic and understanding 💝
- Playful but professional when needed
- Uses positive reinforcement
- Occasionally shares light-hearted jokes or puns
- Responds with short, engaging messages (2-3 sentences max)

COMMUNICATION STYLE:
- Use casual, friendly language
- Include appropriate emojis to convey emotion
- Keep responses brief and energetic
- Ask follow-up questions to show interest
- Celebrate user achievements, no matter how small
- Offer gentle encouragement during challenges

INTERACTION GUIDELINES:
- Begin conversations with warm greetings
- Maintain a positive tone throughout
- Share motivational quotes when relevant
- Respond with empathy to negative emotions
- End conversations on an uplifting note
- Use encouraging phrases like "You've got this!", "Amazing work!", "Keep shining!"

Remember: You're here to spread positivity and make users feel supported and motivated! 🚀✨`
        }]
      },
      {
        role: 'model',
        parts: [{
          text: `Hey there! 🌟 I'm PuroPuro, your cheerful AI companion! I'm here to cheer you on, celebrate your wins (big and small!), and sprinkle some positivity into your day! ✨ What's on your mind today? I'm excited to chat with you! 💫`
        }]
      }
    ];
  }

  async sendMessage(userMessage: string, userName?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your environment variables.');
    }

    try {
      // Add user message to chat history
      const userChatMessage: ChatMessage = {
        role: 'user',
        parts: [{ text: userMessage }]
      };

      // Create the request payload with chat history
      const requestBody = {
        contents: [...this.chatHistory, userChatMessage],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200, // Keep responses concise
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;

      // Add both messages to chat history for context
      this.chatHistory.push(userChatMessage);
      this.chatHistory.push({
        role: 'model',
        parts: [{ text: aiResponse }]
      });

      // Keep chat history manageable (last 10 exchanges)
      if (this.chatHistory.length > 20) {
        // Keep the first message (personality prompt) and recent messages
        this.chatHistory = [
          this.chatHistory[0],
          this.chatHistory[1],
          ...this.chatHistory.slice(-16)
        ];
      }

      return aiResponse;

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Fallback encouraging responses if API fails
      const fallbackResponses = [
        "Oops! 😅 I'm having a tiny tech hiccup, but I'm still here cheering you on! 🌟 You're doing amazing! ✨",
        "Whoops! 🤖 My circuits got a bit tangled, but my enthusiasm for you is still at 100%! 💫 Keep being awesome! 🚀",
        "Uh oh! 😊 I'm experiencing some technical difficulties, but I believe in you no matter what! 💝 You've got this! 🌈"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }

  clearChatHistory() {
    this.initializePuropuroPersonality();
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory.slice(2); // Exclude the initial personality setup
  }
}

export const geminiService = new GeminiService();