import { Word, WordList, Student, PronunciationAttempt, StudentProgress } from '../types';

class DataService {
  private wordLists: WordList[] = [];
  private students: Student[] = [];
  private attempts: PronunciationAttempt[] = [];
  private progress: StudentProgress[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default word lists
    const basicWords: Word[] = [
      { id: '1', text: 'apple', phonetic: '/ˈæpəl/', difficulty: 'easy', category: 'fruits' },
      { id: '2', text: 'banana', phonetic: '/bəˈnænə/', difficulty: 'easy', category: 'fruits' },
      { id: '3', text: 'orange', phonetic: '/ˈɔːrɪndʒ/', difficulty: 'easy', category: 'fruits' },
      { id: '4', text: 'strawberry', phonetic: '/ˈstrɔːberi/', difficulty: 'medium', category: 'fruits' },
      { id: '5', text: 'watermelon', phonetic: '/ˈwɔːtərmelən/', difficulty: 'medium', category: 'fruits' },
    ];

    const animalWords: Word[] = [
      { id: '6', text: 'cat', phonetic: '/kæt/', difficulty: 'easy', category: 'animals' },
      { id: '7', text: 'dog', phonetic: '/dɔːɡ/', difficulty: 'easy', category: 'animals' },
      { id: '8', text: 'elephant', phonetic: '/ˈeləfənt/', difficulty: 'medium', category: 'animals' },
      { id: '9', text: 'butterfly', phonetic: '/ˈbʌtərflaɪ/', difficulty: 'hard', category: 'animals' },
      { id: '10', text: 'hippopotamus', phonetic: '/ˌhɪpəˈpɒtəməs/', difficulty: 'hard', category: 'animals' },
    ];

    this.wordLists = [
      {
        id: '1',
        name: 'Basic Fruits',
        description: 'Common fruit names for beginners',
        words: basicWords,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Animal Names',
        description: 'Various animal names with different difficulty levels',
        words: animalWords,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Default student
    this.students = [
      {
        id: '1',
        name: 'Student Demo',
        email: 'student@demo.com',
        grade: '3rd Grade',
        createdAt: new Date(),
      },
    ];

    // Initialize progress for default student
    this.progress = this.wordLists.map(list => ({
      studentId: '1',
      wordListId: list.id,
      completedWords: [],
      currentWordIndex: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      averageAccuracy: 0,
      lastUpdated: new Date(),
    }));
  }

  // Word Lists
  getWordLists(): WordList[] {
    return this.wordLists;
  }

  getWordList(id: string): WordList | undefined {
    return this.wordLists.find(list => list.id === id);
  }

  createWordList(wordList: Omit<WordList, 'id' | 'createdAt' | 'updatedAt'>): WordList {
    const newWordList: WordList = {
      ...wordList,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.wordLists.push(newWordList);
    return newWordList;
  }

  updateWordList(id: string, updates: Partial<WordList>): WordList | undefined {
    const index = this.wordLists.findIndex(list => list.id === id);
    if (index !== -1) {
      this.wordLists[index] = { ...this.wordLists[index], ...updates, updatedAt: new Date() };
      return this.wordLists[index];
    }
    return undefined;
  }

  deleteWordList(id: string): boolean {
    const index = this.wordLists.findIndex(list => list.id === id);
    if (index !== -1) {
      this.wordLists.splice(index, 1);
      return true;
    }
    return false;
  }

  // Students
  getStudents(): Student[] {
    return this.students;
  }

  getStudent(id: string): Student | undefined {
    return this.students.find(student => student.id === id);
  }

  // Progress
  getStudentProgress(studentId: string, wordListId: string): StudentProgress | undefined {
    return this.progress.find(p => p.studentId === studentId && p.wordListId === wordListId);
  }

  updateStudentProgress(studentId: string, wordListId: string, updates: Partial<StudentProgress>): StudentProgress {
    const index = this.progress.findIndex(p => p.studentId === studentId && p.wordListId === wordListId);
    
    if (index !== -1) {
      this.progress[index] = { ...this.progress[index], ...updates, lastUpdated: new Date() };
      return this.progress[index];
    } else {
      // Create new progress record
      const newProgress: StudentProgress = {
        studentId,
        wordListId,
        completedWords: [],
        currentWordIndex: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageAccuracy: 0,
        lastUpdated: new Date(),
        ...updates,
      };
      this.progress.push(newProgress);
      return newProgress;
    }
  }

  // Pronunciation Attempts
  recordAttempt(attempt: Omit<PronunciationAttempt, 'id' | 'timestamp'>): PronunciationAttempt {
    const newAttempt: PronunciationAttempt = {
      ...attempt,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    this.attempts.push(newAttempt);
    return newAttempt;
  }

  getStudentAttempts(studentId: string): PronunciationAttempt[] {
    return this.attempts.filter(attempt => attempt.studentId === studentId);
  }

  // Analytics
  getStudentStats(studentId: string): {
    totalWords: number;
    completedWords: number;
    averageAccuracy: number;
    totalAttempts: number;
  } {
    const studentProgress = this.progress.filter(p => p.studentId === studentId);
    const totalWords = studentProgress.reduce((sum, p) => {
      const wordList = this.getWordList(p.wordListId);
      return sum + (wordList?.words.length || 0);
    }, 0);

    const completedWords = studentProgress.reduce((sum, p) => sum + p.completedWords.length, 0);
    const totalAttempts = studentProgress.reduce((sum, p) => sum + p.totalAttempts, 0);
    const averageAccuracy = studentProgress.length > 0 
      ? studentProgress.reduce((sum, p) => sum + p.averageAccuracy, 0) / studentProgress.length 
      : 0;

    return {
      totalWords,
      completedWords,
      averageAccuracy: Math.round(averageAccuracy),
      totalAttempts,
    };
  }
}

export const dataService = new DataService();