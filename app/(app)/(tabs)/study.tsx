import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme, MD3Theme } from "react-native-paper";
import { router } from "expo-router";

export default function StudyScreen() {
  const theme = useTheme<MD3Theme>();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Start Studying
        </Text>
        <Button
          mode="contained"
          style={styles.button}
          onPress={() => router.push("/(app)/(tabs)/categories")}
        >
          Choose Category
        </Button>
      </View>
    </View>
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
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    minWidth: 200,
  },
});
