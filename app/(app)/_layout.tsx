import React, { useEffect } from "react";
import { Stack, Redirect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { HeaderBar } from "@/components/HeaderBar";

export default function AppLayout() {
  const { session, loading: authLoading } = useAuth();
  const { loading: userLoading } = useUser();

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/auth/sign-in");
    }
  }, [authLoading, session]);

  // Show loading state while initializing
  if (authLoading || userLoading) {
    return (
      <LinearGradient
        colors={["#FF6B6B", "#4158D0"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  // If no session, don't render anything (useEffect will handle redirect)
  if (!session) {
    return null;
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={{ flex: 1 }}>
      <HeaderBar />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </LinearGradient>
  );
}
