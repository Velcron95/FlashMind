import { useEffect } from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { getInitialSession } from "@/lib/supabase/supabaseClient";
import { AuthProvider } from "../features/auth/context/AuthContext";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";
import { authStorage } from "@/lib/utils/authStorage";
import { supabase } from "@/lib/supabase/supabaseClient";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings if needed
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
]);

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const setupApp = async () => {
      try {
        console.log("[Navigation] App starting...");

        // Check if user wants to stay logged in
        const isPersisted = await authStorage.getPersist();
        if (isPersisted) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            console.log("[Auth] Session found, redirecting to app");
            router.replace("/(app)");
          } else {
            console.log("[Auth] No session found, redirecting to login");
            router.replace("/auth/sign-in");
          }
        } else {
          console.log("[Auth] No persistence requested, redirecting to login");
          router.replace("/auth/sign-in");
        }

        await SplashScreen.hideAsync();
      } catch (error) {
        console.error("[Navigation] Setup error:", error);
        router.replace("/auth/sign-in");
      }
    };

    setupApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider
          theme={colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
