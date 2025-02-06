import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_PERSIST_KEY = "auth-persist";
const AUTH_SESSION_KEY = "supabase.auth.token";

export const authStorage = {
  getPersist: async () => {
    try {
      const value = await AsyncStorage.getItem(AUTH_PERSIST_KEY);
      return value === "true";
    } catch (e) {
      return false;
    }
  },

  setPersist: async (value: boolean) => {
    try {
      await AsyncStorage.setItem(AUTH_PERSIST_KEY, value.toString());
    } catch (e) {
      console.error("Error setting persist:", e);
    }
  },

  clear: async () => {
    try {
      // Only clear auth-related keys
      await AsyncStorage.multiRemove([AUTH_PERSIST_KEY, AUTH_SESSION_KEY]);
    } catch (e) {
      console.error("Error clearing auth storage:", e);
    }
  },
};
