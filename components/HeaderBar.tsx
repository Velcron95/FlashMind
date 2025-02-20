import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { useUser } from "@/hooks/useUser";

export function HeaderBar() {
  const { user, loading } = useUser();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.push("/(app)/(tabs)/dashboard")}>
        <Text style={styles.title}>FlashMind</Text>
      </Pressable>
      <View style={styles.userSection}>
        {loading ? (
          <Text style={styles.email}>Loading...</Text>
        ) : (
          <>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email || "Guest"}
            </Text>
            <IconButton
              icon="account-circle"
              iconColor="white"
              size={24}
              onPress={() => router.push("/(app)/profile")}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 48,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingLeft: 12,
  },
  email: {
    color: "white",
    fontSize: 14,
    maxWidth: 150,
  },
});
