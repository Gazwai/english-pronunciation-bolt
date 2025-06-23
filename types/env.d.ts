declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_BYTEDANCE_API_KEY: string;
      EXPO_PUBLIC_BYTEDANCE_API_ENDPOINT: string;
      EXPO_PUBLIC_SEED_ASR_APP_ID: string;
      EXPO_PUBLIC_SEED_ASR_TOKEN: string;
    }
  }
}

// Ensure this file is treated as a module
export {};