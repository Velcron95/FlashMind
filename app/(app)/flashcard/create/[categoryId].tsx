import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Switch,
  IconButton,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { db } from "@/lib/supabase/db";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { CardType } from "@/features/cards/types/cards";
import { CardFactory } from "@/features/cards/components/CardFactory";
import { LinearGradient } from "expo-linear-gradient";

type BaseCreateData = {
  category_id: string;
  user_id: string;
  is_learned: boolean;
  times_reviewed: number;
  last_reviewed: null;
};

type CreateFlashcardData = BaseCreateData &
  (
    | {
        card_type: "classic";
        term: string;
        definition: string;
      }
    | {
        card_type: "true_false";
        statement: string;
        correct_answer: string;
      }
    | {
        card_type: "multiple_choice";
        question: string;
        options: string[];
        correct_answer: string;
      }
  );

const MAX_OPTIONS = 4;

const cardTypes = [
  { value: "classic", label: "Basic", icon: "card-text-outline" },
  {
    value: "true_false",
    label: "T/F",
    icon: "checkbox-marked-circle-outline",
  },
  {
    value: "multiple_choice",
    label: "Choice",
    icon: "format-list-checks",
  },
];

export default function CreateFlashcardScreen() {
  const { categoryId } = useLocalSearchParams();
  const theme = useTheme();
  const [cardType, setCardType] = useState<CardType>("classic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);

  // Classic card fields
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");

  // True/False card fields
  const [statement, setStatement] = useState("");
  const [isTrue, setIsTrue] = useState(true);

  // Multiple choice card fields
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([""]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");

  const handleCreate = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    console.log("[CreateFlashcard] Starting card creation:", {
      cardType,
      categoryId,
      timestamp: new Date().toISOString(),
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("[CreateFlashcard] Authentication error: No user found");
        throw new Error("Not authenticated");
      }

      // Verify category exists and belongs to user
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", categoryId)
        .eq("user_id", user.id)
        .single();

      if (categoryError || !category) {
        console.error("[CreateFlashcard] Category verification failed:", {
          categoryError,
          categoryId,
          userId: user.id,
        });
        throw new Error("Category not found or access denied");
      }

      let cardData: CreateFlashcardData;
      const baseData = {
        category_id: categoryId as string,
        user_id: user.id,
        is_learned: false,
        times_reviewed: 0,
        last_reviewed: null,
      };

      console.log("[CreateFlashcard] Preparing card data for type:", cardType);

      switch (cardType) {
        case "classic":
          if (!term.trim() || !definition.trim()) {
            console.error("[CreateFlashcard] Classic card validation failed:", {
              termLength: term.length,
              definitionLength: definition.length,
            });
            throw new Error("Please fill in both term and definition");
          }
          cardData = {
            card_type: "classic",
            ...baseData,
            term: term.trim(),
            definition: definition.trim(),
          } as const;
          break;

        case "true_false":
          if (!statement.trim()) {
            console.error(
              "[CreateFlashcard] True/False card validation failed:",
              {
                statementLength: statement.length,
              }
            );
            throw new Error("Please enter a statement");
          }
          cardData = {
            card_type: "true_false",
            ...baseData,
            statement: statement.trim(),
            correct_answer: isTrue.toString(),
          } as const;
          break;

        case "multiple_choice":
          console.log("[CreateFlashcard] Multiple choice validation data:", {
            questionLength: question.length,
            optionsCount: options.length,
            correctAnswer,
            options,
          });

          if (
            !question.trim() ||
            !correctAnswer ||
            options.some((opt) => !opt.trim())
          ) {
            console.error(
              "[CreateFlashcard] Multiple choice validation failed"
            );
            throw new Error("Please fill in all fields");
          }
          if (!options.includes(correctAnswer)) {
            console.error("[CreateFlashcard] Correct answer not in options:", {
              correctAnswer,
              options,
            });
            throw new Error("Correct answer must be one of the options");
          }
          cardData = {
            card_type: "multiple_choice",
            ...baseData,
            question: question.trim(),
            options: options.map((opt) => opt.trim()),
            correct_answer: correctAnswer,
          } as const;
          break;

        default:
          console.error("[CreateFlashcard] Invalid card type:", cardType);
          throw new Error("Invalid card type");
      }

      console.log("[CreateFlashcard] Attempting to create card:", {
        cardType,
        categoryId,
        cardData,
      });

      const result = await db.flashcards.create(cardData);

      console.log("[CreateFlashcard] Card created successfully:", {
        cardId: result.id,
        cardType,
        categoryId,
      });

      if (createAnother) {
        // Clear form for next card
        setTerm("");
        setDefinition("");
        setStatement("");
        setQuestion("");
        setOptions([""]);
        setCorrectAnswer("");
      } else {
        router.replace(`/(app)/category/${categoryId}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create flashcard";
      console.error("[CreateFlashcard] Error creating card:", {
        error: err,
        errorMessage,
        cardType,
        categoryId,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderCardTypeForm = () => {
    switch (cardType) {
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
              placeholder="Enter your statement"
              value={statement}
              onChangeText={setStatement}
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
            <View style={styles.trueFalseContainer}>
              <Text style={styles.label}>Select the correct answer:</Text>
              <View style={styles.trueFalseButtons}>
                <Button
                  mode={isTrue ? "contained" : "outlined"}
                  onPress={() => setIsTrue(true)}
                  style={[
                    styles.trueFalseButton,
                    isTrue && styles.selectedButton,
                  ]}
                  textColor="white"
                  buttonColor={isTrue ? "rgba(255,255,255,0.2)" : undefined}
                >
                  True
                </Button>
                <Button
                  mode={!isTrue ? "contained" : "outlined"}
                  onPress={() => setIsTrue(false)}
                  style={[
                    styles.trueFalseButton,
                    !isTrue && styles.selectedButton,
                  ]}
                  textColor="white"
                  buttonColor={!isTrue ? "rgba(255,255,255,0.2)" : undefined}
                >
                  False
                </Button>
              </View>
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
                  <IconButton
                    icon={
                      option === correctAnswer
                        ? "check-circle"
                        : "circle-outline"
                    }
                    iconColor="white"
                    size={24}
                    style={styles.correctButton}
                    onPress={() => setCorrectAnswer(option)}
                  />
                  {options.length > 1 && (
                    <IconButton
                      icon="close"
                      iconColor="white"
                      size={20}
                      style={styles.removeButton}
                      onPress={() => {
                        const newOptions = options.filter(
                          (_, i) => i !== index
                        );
                        setOptions(newOptions);
                        if (correctAnswer === option) setCorrectAnswer("");
                      }}
                    />
                  )}
                </View>
              ))}
              {options.length < MAX_OPTIONS && (
                <Button
                  mode="outlined"
                  onPress={() => setOptions([...options, ""])}
                  style={styles.addButton}
                  textColor="white"
                  icon="plus"
                >
                  Add Option
                </Button>
              )}
            </View>
          </>
        );
    }
  };

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Create {cardType.replace("_", " ")} Card
          </Text>
          <View style={styles.cardTypeSelector}>
            {cardTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.cardTypeButton,
                  cardType === type.value && styles.cardTypeButtonSelected,
                ]}
                onPress={() => setCardType(type.value as CardType)}
              >
                <IconButton
                  icon={type.icon}
                  size={24}
                  iconColor={cardType === type.value ? "#4158D0" : "white"}
                />
                <Text
                  style={[
                    styles.cardTypeText,
                    cardType === type.value && styles.cardTypeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderCardTypeForm()}

        {error && (
          <Text style={styles.error} variant="bodyMedium">
            {error}
          </Text>
        )}

        <View style={styles.actions}>
          <View style={styles.createAnotherContainer}>
            <Text variant="bodyLarge" style={{ color: "white" }}>
              Create another card?
            </Text>
            <Switch value={createAnother} onValueChange={setCreateAnother} />
          </View>

          <Button
            mode="contained"
            onPress={handleCreate}
            loading={loading}
            style={styles.button}
            buttonColor="rgba(255, 255, 255, 0.2)"
            textColor="white"
            icon="check"
          >
            Create Card
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
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 16,
    marginBottom: 24,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
    color: "white",
  },
  cardTypeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
  },
  cardTypeButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  cardTypeButtonSelected: {
    backgroundColor: "white",
  },
  cardTypeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  cardTypeTextSelected: {
    color: "#4158D0",
  },
  formSection: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    height: undefined,
  },
  sectionTitle: {
    marginBottom: 12,
    color: "white",
    fontWeight: "500",
  },
  switchContainer: {
    padding: 16,
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  trueFalseButtons: {
    flexDirection: "row",
    gap: 16,
  },
  trueFalseButton: {
    flex: 1,
    minWidth: 120,
  },
  selectedButton: {
    borderWidth: 0,
  },
  optionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  optionsListContainer: {
    maxHeight: 200,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
  },
  addButton: {
    marginTop: 8,
  },
  correctButton: {
    margin: 0,
  },
  actions: {
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  createAnotherContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 16,
  },
  multilineInput: {
    minHeight: 120,
  },
  inputOutlineStyle: {
    borderRadius: 12,
  },
  inputContentStyle: {
    paddingHorizontal: 16,
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
  removeButton: {
    margin: 0,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
  },
});
