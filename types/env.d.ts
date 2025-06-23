declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GEMINI_API_KEY: string;
    }
  }
}

// Ensure this file is treated as a module
export {};