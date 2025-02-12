import * as SecureStore from "expo-secure-store";

const PERSIST_KEY = "auth-persist";
const SESSION_KEY = "supabase-session";

export const authStorage = {
  setPersist: async (value: boolean) => {
    try {
      await SecureStore.setItemAsync(PERSIST_KEY, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting persist:", error);
    }
  },

  getPersist: async (): Promise<boolean> => {
    try {
      const value = await SecureStore.getItemAsync(PERSIST_KEY);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error("Error getting persist:", error);
      return false;
    }
  },

  setSession: async (session: any) => {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Error setting session:", error);
    }
  },

  getSession: async () => {
    try {
      const session = await SecureStore.getItemAsync(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  },

  clearSession: async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  },
};
