import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "FlashMind",
  slug: "flashmind",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "flashmind",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  experiments: {
    tsconfigPaths: true,
  },
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        newArchEnabled: true,
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    deepseekApiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
    eas: {
      projectId: "your-project-id",
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.flashmind",
  },
  android: {
    package: "com.yourcompany.flashmind",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
