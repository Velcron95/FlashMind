import React, { useEffect } from "react";
import { Stack, Slot } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { UserProvider } from "@/features/user/context/UserContext";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "@/lib/supabase/supabaseClient";
import { authService } from "@/features/auth/services/authService";

// Keep splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get initial session and persistence state
        const currentSession = await authService.getSession();
        const shouldPersist = await authService.getPersistState();

        if (currentSession && !shouldPersist) {
          // If we have a session but shouldn't persist, sign out
          await authService.signOut();
        }

        if (currentSession) {
          console.log(
            "[Root] Initial session found for:",
            currentSession.user.email
          );
        }
      } catch (error) {
        console.error("[Root] Error initializing auth:", error);
      } finally {
        // Hide splash screen once we're done
        await SplashScreen.hideAsync();
      }
    };

    initAuth();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <UserProvider>
          <Slot />
        </UserProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
