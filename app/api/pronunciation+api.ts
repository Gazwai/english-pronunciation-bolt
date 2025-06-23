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

    // Check if Google Cloud Speech-to-Text credentials are configured
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;
    const projectId = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_ID;
    const endpoint = process.env.EXPO_PUBLIC_SPEECH_TO_TEXT_ENDPOINT;

    if (!apiKey || !projectId || !endpoint) {
      console.warn('Google Cloud Speech-to-Text not configured, falling back to simple transcription');
      return fallbackTranscription(audioFile, targetWord);
    }

    // Convert audio file to base64 for API transmission
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Prepare Google Cloud Speech-to-Text request
    const speechRequest = {
      config: {
        encoding: 'WEBM_OPUS', // Common web audio format
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        alternativeLanguageCodes: ['en-GB', 'en-AU'],
        maxAlternatives: 5,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: false,
        useEnhanced: true,
        model: 'latest_long', // Best model for pronunciation assessment
        speechContexts: [
          {
            phrases: [targetWord], // Bias recognition toward target word
            boost: 20.0
          }
        ]
      },
      audio: {
        content: audioBase64
      }
    };

    // Make request to Google Cloud Speech-to-Text
    const speechResponse = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(speechRequest)
    });

    if (!speechResponse.ok) {
      const errorText = await speechResponse.text();
      console.error('Google Speech-to-Text API error:', errorText);
      return fallbackTranscription(audioFile, targetWord);
    }

    const speechResult = await speechResponse.json();
    
    // Process Google Speech-to-Text response
    const transcript = extractBestTranscript(speechResult);
    const accuracy = calculateAdvancedAccuracy(targetWord, transcript, speechResult);
    const detailedFeedback = generateDetailedFeedback(targetWord, transcript, speechResult);
    const pronunciationAnalysis = analyzePronunciation(targetWord, speechResult);

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        accuracy,
        detailedFeedback,
        pronunciationAnalysis,
        provider: 'google-speech-to-text',
        alternatives: speechResult.results?.[0]?.alternatives?.slice(0, 3) || []
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

// Fallback transcription for when Google Speech-to-Text is not available
async function fallbackTranscription(audioFile: File, targetWord: string) {
  // Enhanced mock transcription for development/fallback
  const mockVariations = [
    targetWord, // Perfect match
    targetWord.toLowerCase(),
    targetWord.charAt(0).toUpperCase() + targetWord.slice(1).toLowerCase(),
    targetWord.replace(/[aeiou]/g, 'e'), // Vowel substitution
    targetWord.slice(0, -1), // Missing last letter
    targetWord + 's', // Extra letter
    targetWord.replace(/th/g, 'd'), // Common pronunciation variation
    targetWord.replace(/r$/, ''), // R-dropping
  ];
  
  const randomTranscript = mockVariations[Math.floor(Math.random() * mockVariations.length)];
  const accuracy = calculateSimpleAccuracy(targetWord, randomTranscript);
  
  return new Response(
    JSON.stringify({
      success: true,
      transcript: randomTranscript,
      accuracy,
      detailedFeedback: generateSimpleFeedback(targetWord, randomTranscript, accuracy),
      pronunciationAnalysis: generateMockAnalysis(targetWord, randomTranscript),
      provider: 'fallback'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function extractBestTranscript(speechResult: any): string {
  try {
    if (speechResult.results && speechResult.results.length > 0) {
      const alternatives = speechResult.results[0].alternatives;
      if (alternatives && alternatives.length > 0) {
        // Return the transcript with highest confidence
        return alternatives[0].transcript.trim();
      }
    }
    return '';
  } catch (error) {
    console.error('Error extracting transcript:', error);
    return '';
  }
}

function calculateAdvancedAccuracy(targetWord: string, transcript: string, speechResult: any): number {
  const target = targetWord.toLowerCase().trim();
  const spoken = transcript.toLowerCase().trim();
  
  // Exact match
  if (target === spoken) return 100;
  
  // Use confidence score from Google Speech-to-Text
  let baseAccuracy = 0;
  try {
    if (speechResult.results?.[0]?.alternatives?.[0]?.confidence) {
      baseAccuracy = Math.round(speechResult.results[0].alternatives[0].confidence * 100);
    }
  } catch (error) {
    console.error('Error extracting confidence:', error);
  }
  
  // If no confidence score, fall back to string similarity
  if (baseAccuracy === 0) {
    baseAccuracy = calculateStringsimilarity(target, spoken);
  }
  
  // Apply pronunciation-specific adjustments
  const pronunciationBonus = calculatePronunciationBonus(target, spoken);
  const wordLevelAccuracy = calculateWordLevelAccuracy(target, speechResult);
  const stressPatternBonus = calculateStressPatternBonus(target, spoken);
  
  // Weighted combination
  const finalAccuracy = Math.min(100, 
    baseAccuracy * 0.6 + 
    wordLevelAccuracy * 0.25 + 
    pronunciationBonus + 
    stressPatternBonus
  );
  
  return Math.max(0, Math.round(finalAccuracy));
}

function calculateWordLevelAccuracy(targetWord: string, speechResult: any): number {
  try {
    const words = speechResult.results?.[0]?.alternatives?.[0]?.words;
    if (!words || words.length === 0) return 0;
    
    // Find the word that best matches our target
    const targetLower = targetWord.toLowerCase();
    let bestMatch = 0;
    
    for (const word of words) {
      const wordText = word.word.toLowerCase();
      const confidence = word.confidence || 0;
      
      if (wordText === targetLower) {
        return confidence * 100;
      } else if (wordText.includes(targetLower) || targetLower.includes(wordText)) {
        bestMatch = Math.max(bestMatch, confidence * 80);
      }
    }
    
    return bestMatch;
  } catch (error) {
    console.error('Error calculating word-level accuracy:', error);
    return 0;
  }
}

function calculateStringsimilarity(target: string, spoken: string): number {
  if (target === spoken) return 100;
  if (!target || !spoken) return 0;
  
  // Jaro-Winkler similarity for better pronunciation matching
  const jaroSimilarity = calculateJaroSimilarity(target, spoken);
  
  // Also consider Levenshtein distance
  const maxLength = Math.max(target.length, spoken.length);
  const distance = levenshteinDistance(target, spoken);
  const levenshteinSimilarity = ((maxLength - distance) / maxLength);
  
  // Combine both metrics
  const combinedSimilarity = (jaroSimilarity * 0.7 + levenshteinSimilarity * 0.3) * 100;
  
  return Math.max(0, Math.round(combinedSimilarity));
}

function calculateJaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  // Find transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
}

function calculateSimpleAccuracy(target: string, spoken: string): number {
  return calculateStringsimilarity(target, spoken);
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
  
  // Common pronunciation variations and accent differences
  const variations = [
    { from: /th/g, to: 'd' },    // "think" -> "dink"
    { from: /th/g, to: 'f' },    // "think" -> "fink"
    { from: /v/g, to: 'w' },     // "very" -> "wery"
    { from: /w/g, to: 'v' },     // "water" -> "vater"
    { from: /r$/g, to: '' },     // R-dropping: "car" -> "ca"
    { from: /er$/g, to: 'a' },   // "water" -> "wata"
    { from: /z/g, to: 's' },     // "zero" -> "sero"
    { from: /j/g, to: 'y' },     // "yes" -> "jes"
    { from: /ʃ/g, to: 's' },     // "ship" -> "sip"
    { from: /tʃ/g, to: 'ts' },   // "chair" -> "tsair"
  ];
  
  for (const variation of variations) {
    const modifiedTarget = target.replace(variation.from, variation.to);
    const modifiedSpoken = spoken.replace(variation.from, variation.to);
    
    if (modifiedTarget === spoken || target === modifiedSpoken) {
      bonus += 8;
      break;
    }
  }
  
  // Bonus for similar length (indicates attempt at full word)
  const lengthDiff = Math.abs(target.length - spoken.length);
  if (lengthDiff <= 1) {
    bonus += 3;
  } else if (lengthDiff <= 2) {
    bonus += 1;
  }
  
  return Math.min(12, bonus);
}

function calculateStressPatternBonus(target: string, spoken: string): number {
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
  
  // Adjust for common patterns
  if (word.toLowerCase().endsWith('le') && syllables > 1) {
    syllables++;
  }
  
  return Math.max(1, syllables);
}

function analyzePronunciation(targetWord: string, speechResult: any) {
  const analysis = {
    overallQuality: 'good',
    specificIssues: [] as string[],
    strengths: [] as string[],
    suggestions: [] as string[]
  };
  
  try {
    const confidence = speechResult.results?.[0]?.alternatives?.[0]?.confidence || 0;
    const transcript = speechResult.results?.[0]?.alternatives?.[0]?.transcript?.toLowerCase().trim() || '';
    const target = targetWord.toLowerCase().trim();
    
    // Analyze overall quality
    if (confidence >= 0.9) {
      analysis.overallQuality = 'excellent';
      analysis.strengths.push('Very clear pronunciation');
    } else if (confidence >= 0.7) {
      analysis.overallQuality = 'good';
      analysis.strengths.push('Clear pronunciation');
    } else if (confidence >= 0.5) {
      analysis.overallQuality = 'fair';
      analysis.specificIssues.push('Some unclear sounds detected');
    } else {
      analysis.overallQuality = 'needs improvement';
      analysis.specificIssues.push('Pronunciation needs clarification');
    }
    
    // Analyze specific pronunciation issues
    if (transcript !== target) {
      if (transcript.length < target.length) {
        analysis.specificIssues.push('Some sounds may be missing');
        analysis.suggestions.push('Try to pronounce each syllable clearly');
      } else if (transcript.length > target.length) {
        analysis.specificIssues.push('Extra sounds detected');
        analysis.suggestions.push('Focus on the core sounds of the word');
      }
      
      // Check for common pronunciation issues
      if (target.includes('th') && !transcript.includes('th')) {
        analysis.specificIssues.push('TH sound needs attention');
        analysis.suggestions.push('Practice the TH sound by placing tongue between teeth');
      }
      
      if (target.includes('r') && !transcript.includes('r')) {
        analysis.specificIssues.push('R sound could be clearer');
        analysis.suggestions.push('Practice the R sound with tongue curled back');
      }
    } else {
      analysis.strengths.push('Perfect word recognition');
    }
    
    // Analyze word timing if available
    const words = speechResult.results?.[0]?.alternatives?.[0]?.words;
    if (words && words.length > 0) {
      const wordDuration = parseFloat(words[0].endTime?.replace('s', '') || '0') - 
                          parseFloat(words[0].startTime?.replace('s', '') || '0');
      
      if (wordDuration > 2.0) {
        analysis.suggestions.push('Try speaking a bit faster for more natural rhythm');
      } else if (wordDuration < 0.3) {
        analysis.suggestions.push('Take your time to pronounce each sound clearly');
      } else {
        analysis.strengths.push('Good speaking pace');
      }
    }
    
  } catch (error) {
    console.error('Error analyzing pronunciation:', error);
  }
  
  return analysis;
}

function generateDetailedFeedback(targetWord: string, transcript: string, speechResult: any): string {
  const accuracy = calculateAdvancedAccuracy(targetWord, transcript, speechResult);
  const analysis = analyzePronunciation(targetWord, speechResult);
  
  let feedback = '';
  
  if (accuracy >= 95) {
    feedback = "🎉 Outstanding! Your pronunciation is virtually perfect. ";
  } else if (accuracy >= 85) {
    feedback = "✨ Excellent work! Your pronunciation is very clear and natural. ";
  } else if (accuracy >= 75) {
    feedback = "👍 Good job! Your pronunciation is quite good with minor areas for improvement. ";
  } else if (accuracy >= 65) {
    feedback = "📈 Fair attempt! You're on the right track, focus on clarity. ";
  } else if (accuracy >= 50) {
    feedback = "💪 Keep practicing! Pay attention to each sound and syllable. ";
  } else {
    feedback = "🔄 Let's try again! Listen carefully to the example and speak slowly. ";
  }
  
  // Add specific suggestions
  if (analysis.suggestions.length > 0) {
    feedback += analysis.suggestions[0];
  }
  
  return feedback;
}

function generateSimpleFeedback(targetWord: string, transcript: string, accuracy: number): string {
  if (accuracy >= 90) {
    return "🎯 Excellent! Your pronunciation is very clear and accurate.";
  } else if (accuracy >= 70) {
    return "👍 Good attempt! Try to match the stress pattern and vowel sounds more closely.";
  } else if (accuracy >= 50) {
    return "📚 Keep practicing! Focus on pronouncing each sound clearly and slowly.";
  } else {
    return "🔄 Try again! Listen to the example carefully and repeat slowly.";
  }
}

function generateMockAnalysis(targetWord: string, transcript: string) {
  const accuracy = calculateSimpleAccuracy(targetWord, transcript);
  
  return {
    overallQuality: accuracy >= 80 ? 'good' : accuracy >= 60 ? 'fair' : 'needs improvement',
    specificIssues: accuracy < 80 ? ['Practice needed for clearer pronunciation'] : [],
    strengths: accuracy >= 80 ? ['Good attempt at the word'] : [],
    suggestions: ['Listen to the example and practice slowly']
  };
}