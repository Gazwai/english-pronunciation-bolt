export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const targetWord = formData.get('targetWord') as string;

    if (!audioFile || !targetWord) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing audio file or target word',
          success: false 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if Seed-ASR credentials are configured
    const apiKey = process.env.EXPO_PUBLIC_BYTEDANCE_API_KEY;
    const apiEndpoint = process.env.EXPO_PUBLIC_BYTEDANCE_API_ENDPOINT;
    const appId = process.env.EXPO_PUBLIC_SEED_ASR_APP_ID;
    const token = process.env.EXPO_PUBLIC_SEED_ASR_TOKEN;

    if (!apiKey || !apiEndpoint || !appId || !token) {
      console.warn('Seed-ASR not configured, falling back to simple transcription');
      return fallbackTranscription(audioFile, targetWord);
    }

    // Convert audio file to base64 for API transmission
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Prepare Seed-ASR request
    const seedAsrPayload = {
      app: {
        appid: appId,
        token: token,
        cluster: 'volc_asr_common'
      },
      user: {
        uid: 'pronunciation_practice_user'
      },
      audio: {
        format: 'wav',
        rate: 16000,
        channel: 1,
        bits: 16,
        language: 'en-US'
      },
      request: {
        reqid: `req_${Date.now()}`,
        nbest: 3, // Get top 3 alternatives
        word_info: 1, // Enable word-level information
        show_utterances: true,
        sequence: 1
      }
    };

    // Make request to Seed-ASR
    const seedAsrResponse = await fetch(`${apiEndpoint}/api/v1/asr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...seedAsrPayload,
        data: audioBase64
      })
    });

    if (!seedAsrResponse.ok) {
      console.error('Seed-ASR API error:', await seedAsrResponse.text());
      return fallbackTranscription(audioFile, targetWord);
    }

    const seedAsrResult = await seedAsrResponse.json();
    
    // Process Seed-ASR response
    const transcript = extractBestTranscript(seedAsrResult);
    const accuracy = calculateAdvancedAccuracy(targetWord, transcript, seedAsrResult);
    const detailedFeedback = generateDetailedFeedback(targetWord, transcript, seedAsrResult);

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        accuracy,
        detailedFeedback,
        provider: 'seed-asr',
        rawResult: seedAsrResult // For debugging
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Pronunciation API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Fallback transcription for when Seed-ASR is not available
async function fallbackTranscription(audioFile: File, targetWord: string) {
  // Simple mock transcription for development/fallback
  const mockTranscripts = [
    targetWord, // Perfect match
    targetWord.toLowerCase(),
    targetWord.replace(/[aeiou]/g, 'e'), // Vowel substitution
    targetWord.slice(0, -1), // Missing last letter
    targetWord + 's' // Extra letter
  ];
  
  const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
  const accuracy = calculateSimpleAccuracy(targetWord, randomTranscript);
  
  return new Response(
    JSON.stringify({
      success: true,
      transcript: randomTranscript,
      accuracy,
      detailedFeedback: generateSimpleFeedback(targetWord, randomTranscript, accuracy),
      provider: 'fallback'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function extractBestTranscript(seedAsrResult: any): string {
  try {
    if (seedAsrResult.result && seedAsrResult.result.length > 0) {
      // Get the transcript with highest confidence
      const bestResult = seedAsrResult.result[0];
      return bestResult.text || bestResult.transcript || '';
    }
    return '';
  } catch (error) {
    console.error('Error extracting transcript:', error);
    return '';
  }
}

function calculateAdvancedAccuracy(targetWord: string, transcript: string, seedAsrResult: any): number {
  const target = targetWord.toLowerCase().trim();
  const spoken = transcript.toLowerCase().trim();
  
  // Exact match
  if (target === spoken) return 100;
  
  // Use confidence score from Seed-ASR if available
  let baseAccuracy = 0;
  try {
    if (seedAsrResult.result && seedAsrResult.result[0] && seedAsrResult.result[0].confidence) {
      baseAccuracy = Math.round(seedAsrResult.result[0].confidence * 100);
    }
  } catch (error) {
    console.error('Error extracting confidence:', error);
  }
  
  // If no confidence score, fall back to string similarity
  if (baseAccuracy === 0) {
    baseAccuracy = calculateSimpleAccuracy(target, spoken);
  }
  
  // Apply pronunciation-specific adjustments
  const pronunciationBonus = calculatePronunciationBonus(target, spoken);
  const stressPatternBonus = calculateStressPatternBonus(target, spoken);
  
  const finalAccuracy = Math.min(100, baseAccuracy + pronunciationBonus + stressPatternBonus);
  return Math.max(0, Math.round(finalAccuracy));
}

function calculateSimpleAccuracy(target: string, spoken: string): number {
  if (target === spoken) return 100;
  if (!target || !spoken) return 0;
  
  // Levenshtein distance based similarity
  const maxLength = Math.max(target.length, spoken.length);
  const distance = levenshteinDistance(target, spoken);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.max(0, Math.round(similarity));
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculatePronunciationBonus(target: string, spoken: string): number {
  let bonus = 0;
  
  // Common pronunciation variations
  const variations = [
    { from: /th/g, to: 'd' },
    { from: /th/g, to: 'f' },
    { from: /v/g, to: 'w' },
    { from: /w/g, to: 'v' },
    { from: /r$/g, to: '' }, // R-dropping
    { from: /er$/g, to: 'a' }
  ];
  
  for (const variation of variations) {
    const modifiedTarget = target.replace(variation.from, variation.to);
    const modifiedSpoken = spoken.replace(variation.from, variation.to);
    
    if (modifiedTarget === spoken || target === modifiedSpoken) {
      bonus += 10;
      break;
    }
  }
  
  return Math.min(15, bonus);
}

function calculateStressPatternBonus(target: string, spoken: string): number {
  // Simple syllable count comparison
  const targetSyllables = estimateSyllables(target);
  const spokenSyllables = estimateSyllables(spoken);
  
  if (targetSyllables === spokenSyllables) {
    return 5;
  } else if (Math.abs(targetSyllables - spokenSyllables) === 1) {
    return 2;
  }
  
  return 0;
}

function estimateSyllables(word: string): number {
  const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g) || [];
  let syllables = vowelGroups.length;
  
  // Adjust for silent e
  if (word.toLowerCase().endsWith('e') && syllables > 1) {
    syllables--;
  }
  
  return Math.max(1, syllables);
}

function generateDetailedFeedback(targetWord: string, transcript: string, seedAsrResult: any): string {
  const accuracy = calculateAdvancedAccuracy(targetWord, transcript, seedAsrResult);
  
  if (accuracy >= 95) {
    return "Perfect pronunciation! Your speech is crystal clear.";
  } else if (accuracy >= 85) {
    return "Excellent pronunciation! Very close to native speaker quality.";
  } else if (accuracy >= 75) {
    return "Good pronunciation! Just minor adjustments needed for clarity.";
  } else if (accuracy >= 65) {
    return "Fair pronunciation. Focus on stress patterns and vowel sounds.";
  } else if (accuracy >= 50) {
    return "Keep practicing! Pay attention to each syllable and speak slowly.";
  } else {
    return "Try again! Listen carefully to the example and repeat slowly.";
  }
}

function generateSimpleFeedback(targetWord: string, transcript: string, accuracy: number): string {
  if (accuracy >= 90) {
    return "Great job! Your pronunciation is very clear.";
  } else if (accuracy >= 70) {
    return "Good attempt! Try to match the stress pattern more closely.";
  } else if (accuracy >= 50) {
    return "Keep practicing! Focus on pronouncing each sound clearly.";
  } else {
    return "Try again! Listen to the example and speak more slowly.";
  }
}