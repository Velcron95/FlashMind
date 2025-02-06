import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useUser } from "@/hooks/useUser";

export function PremiumStatus() {
  const { user, isPremium, loading } = useUser();

  if (loading) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Premium: {isPremium ? "Yes" : "No"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
  },
  text: {
    color: "white",
    fontSize: 12,
  },
});
