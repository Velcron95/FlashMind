import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Log environment variables (without the key)
console.log("[Supabase] Checking configuration...");

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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

// Add auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event, session?.user?.email);

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    router.replace("/(app)");
  } else if (event === "SIGNED_OUT") {
    router.replace("/auth/sign-in");
  }
});

// Initialize session from storage
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    router.replace("/(app)");
  }
});

console.log("[Supabase] Client initialized successfully");
