import React from "react";
import { View, StyleSheet } from "react-native";
import { RegularCategoryCreator } from "@/components/RegularCategoryCreator";
import { LinearGradient } from "expo-linear-gradient";

export default function CreateCategoryScreen() {
  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <RegularCategoryCreator />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
