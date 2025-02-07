import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

// Log environment variables (without the key)
console.log("[Supabase] Checking configuration...");

// Use process.env instead of @env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
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

console.log("[Supabase] Client initialized successfully");
