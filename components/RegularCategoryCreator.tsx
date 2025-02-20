import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { router } from "expo-router";
import { db } from "@/lib/supabase/db";
import { supabase } from "@/lib/supabase/supabaseClient";
import ColorPicker from "./ColorPicker";
import { LinearGradient } from "expo-linear-gradient";
import { generateRandomColor } from "@/lib/utils/colors";
import { useCategoriesStore } from "@/stores/categoriesStore";
import type { Category } from "@/types/database";

export function RegularCategoryCreator() {
  const addCategory = useCategoriesStore((state) => state.addCategory);
  const [name, setName] = useState("");
  const [color, setColor] = useState(generateRandomColor());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter a category name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newCategory = await db.categories.create({
        name: name.trim(),
        color,
        user_id: user.id,
      });

      console.log("Created category:", newCategory);

      // Add to store
      addCategory(newCategory);

      // Navigate back
      router.back();
    } catch (err) {
      console.error("Error creating category:", err);
      Alert.alert("Error", "Failed to create category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Text variant="headlineMedium" style={styles.title}>
            Create Category
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter category name"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            {error && <HelperText type="error">{error}</HelperText>}
          </View>

          <View style={styles.colorContainer}>
            <Text style={styles.label}>Color</Text>
            <ColorPicker
              selectedColor={color}
              onSelectColor={setColor}
              style={styles.colorPicker}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Category
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    gap: 24,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: "white",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    height: 56,
    color: "white",
  },
  colorContainer: {
    gap: 8,
  },
  colorPicker: {
    marginTop: 8,
  },
  button: {
    height: 56,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
