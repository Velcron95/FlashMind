import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../../../lib/supabase/supabaseClient";
import CategoryPicker from "../../../../components/CategoryPicker";

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  category_id: string;
  user_id: string;
}

export default function EditFlashcardScreen() {
  const { id } = useLocalSearchParams();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlashcard();
  }, [id]);

  const fetchFlashcard = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error: fetchError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error("Flashcard not found");

      setFlashcard(data);
      setTerm(data.term);
      setDefinition(data.definition);
      setCategoryId(data.category_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flashcard");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!term.trim() || !definition.trim() || !categoryId) {
      setError("Please fill in all fields");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("flashcards")
        .update({
          term: term.trim(),
          definition: definition.trim(),
          category_id: categoryId,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update flashcard"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!flashcard) {
    return (
      <View style={styles.centered}>
        <Text>Flashcard not found</Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Edit Flashcard
      </Text>

      <CategoryPicker
        value={categoryId}
        onValueChange={setCategoryId}
        style={styles.input}
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
          onPress={handleUpdate}
          loading={saving}
          disabled={saving}
          style={styles.button}
        >
          Update
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          disabled={saving}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    marginTop: 24,
  },
  button: {
    marginBottom: 8,
  },
});
