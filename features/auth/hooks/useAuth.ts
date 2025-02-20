import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { AuthContextType } from "../types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase/supabaseClient";

export function useAuth(): AuthContextType & {
  signOut: () => Promise<void>;
} {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const signOut = async () => {
    await AsyncStorage.removeItem("@auth_persist");
    await supabase.auth.signOut();
  };

  return {
    ...context,
    signOut,
  };
}
