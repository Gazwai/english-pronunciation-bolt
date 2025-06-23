declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY: string;
      EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_ID: string;
      EXPO_PUBLIC_SPEECH_TO_TEXT_ENDPOINT: string;
    }
  }
}

// Ensure this file is treated as a module
export {};