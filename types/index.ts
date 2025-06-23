export interface Word {
  id: string;
  text: string;
  phonetic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  audioUrl?: string;
}

export interface WordList {
  id: string;
  name: string;
  description: string;
  words: Word[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  createdAt: Date;
}

export interface PronunciationAttempt {
  id: string;
  studentId: string;
  wordId: string;
  accuracy: number;
  audioUrl?: string;
  timestamp: Date;
  passed: boolean;
}

export interface StudentProgress {
  studentId: string;
  wordListId: string;
  completedWords: string[];
  currentWordIndex: number;
  totalAttempts: number;
  successfulAttempts: number;
  averageAccuracy: number;
  lastUpdated: Date;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}