import React from "react";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import HeaderBar from "@/components/HeaderBar";

export default function AppLayout() {
  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <HeaderBar />
      <Stack
        screenOptions={{
          header: () => null,
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          animationDuration: 200,
          presentation: "card",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </LinearGradient>
  );
}
