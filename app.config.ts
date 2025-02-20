import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "FlashMind",
  slug: "flashmind",
  scheme: "flashmind",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/FlashMindLogo.jpg",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/FlashMindLogo.jpg",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.flashmind",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/FlashMindLogo.jpg",
      backgroundColor: "#ffffff",
    },
    package: "com.yourcompany.flashmind",
  },
  web: {
    favicon: "./assets/FlashMindLogo.jpg",
  },
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  },
  owner: "velcron",
});
