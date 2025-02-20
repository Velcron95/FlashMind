import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  ActivityIndicator,
  SegmentedButtons,
  IconButton,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../../../lib/supabase/supabaseClient";
import CategoryPicker from "../../../../components/CategoryPicker";
import { LinearGradient } from "expo-linear-gradient";
import type { Flashcard } from "@/features/cards/types/cards";

const MAX_OPTIONS = 4;

export default function EditFlashcardScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);

  // Classic card states
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");

  // True/False card states
  const [statement, setStatement] = useState("");
  const [isTrue, setIsTrue] = useState(true);

  // Multiple choice card states
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  useEffect(() => {
    fetchFlashcard();
  }, [id]);

  const fetchFlashcard = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Flashcard not found");

      setFlashcard(data);

      // Set the appropriate states based on card type
      switch (data.card_type) {
        case "classic":
          setTerm(data.term || "");
          setDefinition(data.definition || "");
          break;
        case "true_false":
          setStatement(data.statement || "");
          setIsTrue(data.correct_answer === "true");
          break;
        case "multiple_choice":
          setQuestion(data.question || "");
          setOptions(data.options || []);
          setCorrectAnswer(data.correct_answer || "");
          break;
      }
    } catch (error) {
      console.error("Error fetching flashcard:", error);
      Alert.alert("Error", "Failed to load flashcard");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!flashcard) return;

    try {
      setSaving(true);
      setError(null);

      let updateData: Partial<Flashcard> = {};

      switch (flashcard.card_type) {
        case "classic":
          if (!term.trim() || !definition.trim()) {
            throw new Error("Please fill in both term and definition");
          }
          updateData = { term: term.trim(), definition: definition.trim() };
          break;

        case "true_false":
          if (!statement.trim()) {
            throw new Error("Please enter a statement");
          }
          updateData = {
            statement: statement.trim(),
            correct_answer: isTrue.toString(),
          };
          break;

        case "multiple_choice":
          if (!question.trim() || options.length < 2 || !correctAnswer) {
            throw new Error("Please fill in all required fields");
          }
          updateData = {
            question: question.trim(),
            options,
            correct_answer: correctAnswer,
          };
          break;
      }

      const { error } = await supabase
        .from("flashcards")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error("Error updating flashcard:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update flashcard"
      );
    } finally {
      setSaving(false);
    }
  };

  const renderEditForm = () => {
    if (!flashcard) return null;

    return (
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>
          {flashcard.card_type.replace("_", " ")} Card Details
        </Text>
        {renderCardTypeForm()}
      </View>
    );
  };

  const renderCardTypeForm = () => {
    switch (flashcard?.card_type) {
      case "classic":
        return (
          <>
            <TextInput
              mode="outlined"
              placeholder="Enter term"
              value={term}
              onChangeText={setTerm}
              style={styles.input}
              outlineStyle={styles.inputOutlineStyle}
              contentStyle={styles.inputContentStyle}
              theme={{
                colors: {
                  primary: "white",
                  text: "white",
                  placeholder: "rgba(255,255,255,0.6)",
                  background: "transparent",
                  onSurfaceVariant: "rgba(255,255,255,0.7)",
                  outline: "rgba(255,255,255,0.2)",
                },
              }}
              textColor="white"
            />
            <TextInput
              mode="outlined"
              placeholder="Enter definition"
              value={definition}
              onChangeText={setDefinition}
              style={[styles.input, styles.multilineInput]}
              multiline
              numberOfLines={4}
              outlineStyle={styles.inputOutlineStyle}
              contentStyle={styles.inputContentStyle}
              theme={{
                colors: {
                  primary: "white",
                  text: "white",
                  placeholder: "rgba(255,255,255,0.6)",
                  background: "transparent",
                  onSurfaceVariant: "rgba(255,255,255,0.7)",
                  outline: "rgba(255,255,255,0.2)",
                },
              }}
              textColor="white"
            />
          </>
        );

      case "true_false":
        return (
          <>
            <TextInput
              mode="outlined"
              placeholder="Enter true/false statement"
              value={statement}
              onChangeText={setStatement}
              style={[styles.input, styles.multilineInput]}
              multiline
              numberOfLines={3}
              outlineStyle={styles.inputOutlineStyle}
              contentStyle={styles.inputContentStyle}
              theme={{
                colors: {
                  primary: "white",
                  text: "white",
                  placeholder: "rgba(255,255,255,0.6)",
                  background: "transparent",
                  onSurfaceVariant: "rgba(255,255,255,0.7)",
                  outline: "rgba(255,255,255,0.2)",
                },
              }}
              textColor="white"
            />
            <View style={styles.trueFalseContainer}>
              <Text style={styles.label}>Correct Answer</Text>
              <SegmentedButtons
                value={isTrue ? "true" : "false"}
                onValueChange={(value) => setIsTrue(value === "true")}
                buttons={[
                  {
                    value: "true",
                    label: "True",
                    style: { flex: 1 },
                    labelStyle: { color: "white" },
                  },
                  {
                    value: "false",
                    label: "False",
                    style: { flex: 1 },
                    labelStyle: { color: "white" },
                  },
                ]}
                theme={{
                  colors: {
                    primary: "white",
                    secondaryContainer: "rgba(255,255,255,0.2)",
                    onSecondaryContainer: "white",
                  },
                }}
              />
            </View>
          </>
        );

      case "multiple_choice":
        return (
          <>
            <TextInput
              mode="outlined"
              placeholder="Enter your question"
              value={question}
              onChangeText={setQuestion}
              style={[styles.input, styles.multilineInput]}
              multiline
              outlineStyle={styles.inputOutlineStyle}
              contentStyle={styles.inputContentStyle}
              theme={{
                colors: {
                  primary: "white",
                  text: "white",
                  placeholder: "rgba(255,255,255,0.6)",
                  background: "transparent",
                  onSurfaceVariant: "rgba(255,255,255,0.7)",
                  outline: "rgba(255,255,255,0.2)",
                },
              }}
              textColor="white"
            />
            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <View key={index} style={styles.optionContainer}>
                  <TextInput
                    mode="outlined"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChangeText={(text) => {
                      const newOptions = [...options];
                      newOptions[index] = text;
                      setOptions(newOptions);
                    }}
                    style={styles.optionInput}
                    outlineStyle={styles.inputOutlineStyle}
                    contentStyle={styles.inputContentStyle}
                    theme={{
                      colors: {
                        primary: "white",
                        text: "white",
                        placeholder: "rgba(255,255,255,0.6)",
                        background: "transparent",
                        onSurfaceVariant: "rgba(255,255,255,0.7)",
                        outline: "rgba(255,255,255,0.2)",
                      },
                    }}
                    textColor="white"
                  />
                  <Button
                    mode={option === correctAnswer ? "contained" : "outlined"}
                    onPress={() => setCorrectAnswer(option)}
                    style={styles.correctButton}
                    textColor={
                      option === correctAnswer
                        ? "white"
                        : "rgba(255,255,255,0.9)"
                    }
                  >
                    Correct
                  </Button>
                  <IconButton
                    icon="close"
                    iconColor="rgba(255,255,255,0.7)"
                    size={20}
                    onPress={() => {
                      const newOptions = options.filter((_, i) => i !== index);
                      setOptions(newOptions);
                      if (option === correctAnswer) {
                        setCorrectAnswer("");
                      }
                    }}
                    style={styles.removeButton}
                  />
                </View>
              ))}
              {options.length < MAX_OPTIONS && (
                <Button
                  mode="outlined"
                  onPress={() => setOptions([...options, ""])}
                  style={styles.addButton}
                  icon="plus"
                  textColor="white"
                >
                  Add Option
                </Button>
              )}
            </View>
          </>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Edit {flashcard?.card_type.replace("_", " ")} Card
          </Text>
        </View>

        {renderEditForm()}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleUpdate}
            loading={saving}
            disabled={saving}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Save Changes
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            disabled={saving}
            style={[styles.button, styles.cancelButton]}
            textColor="white"
            labelStyle={styles.buttonLabel}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    opacity: 0.95,
    textAlign: "center",
  },
  formSection: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    height: undefined,
    minHeight: 56,
  },
  inputOutlineStyle: {
    borderRadius: 12,
  },
  inputContentStyle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  trueFalseContainer: {
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
  },
  label: {
    color: "white",
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.9,
  },
  optionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    minHeight: 50,
  },
  correctButton: {
    borderRadius: 8,
    minWidth: 80,
    height: 40,
  },
  removeButton: {
    margin: 0,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
  },
  addButton: {
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    marginTop: 16,
    height: 48,
  },
  actions: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    gap: 12,
  },
  button: {
    height: 50,
    borderRadius: 12,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  cancelButton: {
    borderColor: "rgba(255,255,255,0.3)",
  },
  errorContainer: {
    backgroundColor: "rgba(255,82,82,0.12)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.2)",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 14,
    textAlign: "center",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
