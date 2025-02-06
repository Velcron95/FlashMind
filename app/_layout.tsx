import { useEffect } from "react";
import { Stack, Slot, router } from "expo-router";
import { useColorScheme } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { supabase } from "@/lib/supabase/supabaseClient";
import { authStorage } from "@/lib/utils/authStorage";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const isPersisted = await authStorage.getPersist();

    if (session && isPersisted) {
      router.replace("/(app)");
    } else if (!session) {
      router.replace("/auth/sign-in");
    }
  };

  return (
    <PaperProvider
      theme={colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme}
    >
      <Slot />
    </PaperProvider>
  );
}
