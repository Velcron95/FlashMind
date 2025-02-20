import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useCategoriesStore } from "@/stores/categoriesStore";

interface StudySessionProps {
  mode: string;
  categoryId: string;
}

export function StudySession({ mode, categoryId }: StudySessionProps) {
  const { categories, loading } = useCategoriesStore();
  const category = categories.find((c) => c.id === categoryId);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Study Mode: {mode}</Text>
        <Text style={styles.subtitle}>{category.name}</Text>
        {/* Add your study session content here */}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "white",
    opacity: 0.8,
  },
  errorText: {
    color: "white",
    fontSize: 16,
  },
});
