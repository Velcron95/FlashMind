import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../../lib/supabase/supabaseClient";
import { db } from "../../../../lib/supabase/db";
import ColorPicker from "../../../../components/ColorPicker";
import { LinearGradient } from "expo-linear-gradient";
import type { Category } from "@/hooks/useCategories";

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Category not found");

      setName(data.name);
      setColor(data.color);
    } catch (error) {
      console.error("Error fetching category:", error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Please enter a category name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await db.categories.update(id as string, {
        name: name.trim(),
        color,
      });

      router.back();
    } catch (err) {
      console.error("Error updating category:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category? This will also delete all flashcards in this category.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);
              await db.categories.delete(id as string);
              router.replace("/(app)/(tabs)/categories");
            } catch (error) {
              console.error("Error deleting category:", error);
              setError(
                error instanceof Error
                  ? error.message
                  : "Failed to delete category"
              );
              setLoading(false);
            }
          },
        },
      ]
    );
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
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.headerContainer}>
              <Text variant="displaySmall" style={styles.title}>
                Edit Category
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

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleUpdate}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  buttonColor="rgba(255,255,255,0.15)"
                  textColor="white"
                  labelStyle={styles.buttonLabel}
                >
                  Update Category
                </Button>

                <Button
                  mode="contained"
                  onPress={handleDelete}
                  disabled={loading}
                  style={[styles.button, styles.deleteButton]}
                  buttonColor="rgba(255,59,48,0.15)"
                  textColor="#FF3B30"
                  labelStyle={styles.buttonLabel}
                >
                  Delete Category
                </Button>
              </View>
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
    color: "white",
    fontWeight: "bold",
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
    textAlign: "center",
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  deleteButton: {
    borderColor: "rgba(255,59,48,0.3)",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
