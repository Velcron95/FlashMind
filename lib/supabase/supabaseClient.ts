import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { authStorage } from "../utils/authStorage";

// Log environment variables (without the key)
console.log("[Supabase] Checking configuration...");

// Use process.env instead of @env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Add debug logging
console.log("[Supabase] URL available:", !!supabaseUrl);
console.log("[Supabase] Key available:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing environment variables. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      async getItem(key) {
        try {
          const jsonValue = await AsyncStorage.getItem(key);
          return jsonValue;
        } catch (e) {
          return null;
        }
      },
      async setItem(key, value) {
        try {
          await AsyncStorage.setItem(key, value);
          if (key.includes("session")) {
            await authStorage.setSession(JSON.parse(value));
          }
        } catch (e) {
          // Handle error
        }
      },
      async removeItem(key) {
        try {
          await AsyncStorage.removeItem(key);
          if (key.includes("session")) {
            await authStorage.clearSession();
          }
        } catch (e) {
          // Handle error
        }
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Add auth state change listener separately
supabase.auth.onAuthStateChange(
  (event: AuthChangeEvent, session: Session | null) => {
    console.log("Auth state changed:", event, session?.user?.email);

    // Don't navigate on initial session check
    if (event === "INITIAL_SESSION") return;

    try {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.replace("/(app)");
      } else if (event === "SIGNED_OUT") {
        router.replace("/auth/sign-in");
      }
    } catch (error) {
      console.log("[Supabase] Navigation error:", error);
    }
  }
);

// Let the root layout handle initial session check
export const getInitialSession = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.log("[Supabase] Session initialization error:", error);
    return null;
  }
};

// Handle app state changes
AppState.addEventListener("change", (nextAppState) => {
  if (nextAppState === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

console.log("[Supabase] Client initialized successfully");
