import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
} from "react-native-paper";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase/supabaseClient";
import CategoryPicker from "../../components/CategoryPicker";

export default function CreateScreen() {
  const theme = useTheme();
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!term.trim() || !definition.trim() || !categoryId) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      const { error: insertError } = await supabase.from("flashcards").insert({
        term: term.trim(),
        definition: definition.trim(),
        category_id: categoryId,
        user_id: user.id,
      });

      if (insertError) throw insertError;

      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create flashcard"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      // ... implementation
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Flashcard
      </Text>

      <CategoryPicker
        value={categoryId}
        onChange={setCategoryId}
        style={styles.picker}
      />

      <TextInput
        mode="outlined"
        label="Term"
        value={term}
        onChangeText={setTerm}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        mode="outlined"
        label="Definition"
        value={definition}
        onChangeText={setDefinition}
        style={styles.input}
        multiline
        numberOfLines={4}
      />

      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Create
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          disabled={loading}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
  },
  actions: {
    marginTop: 24,
  },
  button: {
    marginBottom: 8,
  },
});
