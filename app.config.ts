import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "FlashMind",
  slug: "flashmind",
  scheme: "flashmind",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/FlashMindLogo.jpg",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/FlashMindLogo.jpg",
    resizeMode: "contain",
    backgroundColor: "#1A1A1A",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.flashmind.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/FlashMindLogo.jpg",
      backgroundColor: "#1A1A1A",
    },
    package: "com.flashmind.app",
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "aa552198-3989-4ec5-92e5-8413b23a994e",
    },
  },
  owner: "velcron",
});
