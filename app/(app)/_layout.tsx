import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import HeaderBar from "@/components/HeaderBar";
import { useAuth } from "../../features/auth/hooks/useAuth";
import type { NavigationState } from "@react-navigation/native";

export default function AppLayout() {
  const { user } = useAuth();
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.log("[Navigation] App layout mounted");
    return () => {
      console.log("[Navigation] App layout unmounted");
    };
  }, []);

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Stack
        screenOptions={{
          header: () => <HeaderBar />,
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          animationDuration: 200,
          presentation: "card",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
        screenListeners={{
          state: (e) => {
            if (e.data?.state) {
              console.log("[Navigation] Tab state changed:", e.data.state);
            }
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: true }}
          listeners={{
            focus: () => {
              console.log("[Navigation] Tabs focused");
            },
            blur: () => {
              console.log("[Navigation] Tabs blurred");
            },
          }}
        />
        {isDevelopment && (
          <Stack.Screen
            name="admin/premium-management"
            options={{
              title: "Premium Management",
              presentation: "modal",
            }}
            listeners={{
              focus: () => {
                console.log("[Navigation] Admin screen focused");
              },
              blur: () => {
                console.log("[Navigation] Admin screen blurred");
              },
            }}
          />
        )}
      </Stack>
    </LinearGradient>
  );
}
