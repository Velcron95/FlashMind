import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { router } from "expo-router";
import { db } from "@/lib/supabase/db";
import { supabase } from "@/lib/supabase/supabaseClient";
import ColorPicker from "./ColorPicker";
import { LinearGradient } from "expo-linear-gradient";
import { generateRandomColor } from "@/lib/utils/colors";
import { useCategoriesStore } from "@/stores/categoriesStore";

export function RegularCategoryCreator() {
  const { addCategory } = useCategoriesStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

      // Update store immediately
      addCategory(newCategory);

      router.back();
    } catch (err) {
      console.error("Error creating category:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.headerContainer}>
              <Text variant="displaySmall" style={styles.title}>
                New Category
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Create a category for your flashcards
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Category Name"
                value={name}
                onChangeText={setName}
                mode="flat"
                style={styles.input}
                disabled={loading}
                left={
                  <TextInput.Icon icon="folder" color="rgba(255,255,255,0.9)" />
                }
                textColor="white"
                theme={{
                  colors: {
                    onSurfaceVariant: "rgba(255,255,255,0.9)",
                    placeholder: "rgba(255,255,255,0.5)",
                  },
                }}
                contentStyle={styles.inputContent}
                underlineColor="rgba(255,255,255,0.2)"
                activeUnderlineColor="white"
              />

              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="flat"
                style={styles.input}
                disabled={loading}
                left={
                  <TextInput.Icon icon="text" color="rgba(255,255,255,0.9)" />
                }
                textColor="white"
                theme={{
                  colors: {
                    onSurfaceVariant: "rgba(255,255,255,0.9)",
                    placeholder: "rgba(255,255,255,0.5)",
                  },
                }}
                contentStyle={styles.inputContent}
                underlineColor="rgba(255,255,255,0.2)"
                activeUnderlineColor="white"
              />

              <Text variant="bodyLarge" style={styles.label}>
                Choose Color
              </Text>
              <ColorPicker
                selectedColor={color}
                onSelectColor={setColor}
                style={styles.colorPicker}
              />

              {error && (
                <HelperText type="error" visible={!!error} style={styles.error}>
                  {error}
                </HelperText>
              )}

              <Button
                mode="contained"
                onPress={handleCreate}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                buttonColor="rgba(255,255,255,0.15)"
                textColor="white"
              >
                Create Category
              </Button>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  card: {
    padding: 32,
    borderRadius: 28,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerContainer: {
    marginBottom: 36,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    height: 56,
  },
  inputContent: {
    paddingVertical: 12,
  },
  label: {
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  colorPicker: {
    marginBottom: 24,
  },
  error: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
