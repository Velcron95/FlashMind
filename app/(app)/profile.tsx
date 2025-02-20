import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user, loading } = useUser();

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.email}>{user?.email}</Text>
        <Button
          mode="contained"
          onPress={signOut}
          style={styles.button}
          loading={loading}
        >
          Sign Out
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  email: {
    fontSize: 18,
    color: "white",
    marginBottom: 24,
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});
