import { useState } from "react";
import { View, StyleSheet, ScrollView, Keyboard } from "react-native";
import { Text, TextInput, Button, useTheme, Switch } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../../../lib/supabase/supabaseClient";

export default function CreateFlashcardScreen() {
  const { categoryId } = useLocalSearchParams();
  const theme = useTheme();
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);

  const handleCreate = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    // Validation
    if (!term.trim() || !definition.trim()) {
      setError("Please fill in both term and definition");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error: insertError } = await supabase.from("flashcards").insert({
        user_id: user.id,
        category_id: categoryId,
        term: term.trim(),
        definition: definition.trim(),
        difficulty_level: 1,
        times_reviewed: 0,
        is_learned: false,
      });

      if (insertError) throw insertError;

      if (createAnother) {
        // Clear form for next card
        setTerm("");
        setDefinition("");
      } else {
        // Return to category view
        router.back();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create flashcard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="headlineSmall" style={styles.title}>
        Create New Flashcard
      </Text>

      <TextInput
        label="Term"
        value={term}
        onChangeText={setTerm}
        style={styles.input}
        autoFocus
        returnKeyType="next"
      />

      <TextInput
        label="Definition"
        value={definition}
        onChangeText={setDefinition}
        style={styles.input}
        multiline
        numberOfLines={4}
      />

      <View style={styles.switchContainer}>
        <Text>Create another after saving</Text>
        <Switch value={createAnother} onValueChange={setCreateAnother} />
      </View>

      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <View style={styles.buttons}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Create
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
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  error: {
    marginBottom: 16,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  button: {
    minWidth: 120,
  },
});
