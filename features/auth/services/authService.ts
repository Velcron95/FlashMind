import { supabase } from "@/lib/supabase/supabaseClient";
import { AUTH_KEYS } from "../constants/index";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const authService = {
  async signIn(email: string, password: string, persist: boolean) {
    await AsyncStorage.setItem(AUTH_KEYS.PERSIST, persist.toString());
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  async signOut() {
    await AsyncStorage.removeItem(AUTH_KEYS.PERSIST);
    await supabase.auth.signOut();
  },

  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  async getPersistState() {
    return (await AsyncStorage.getItem(AUTH_KEYS.PERSIST)) === "true";
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
