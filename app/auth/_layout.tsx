import React from "react";
import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <LinearGradient
        colors={["#FF6B6B", "#4158D0"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
