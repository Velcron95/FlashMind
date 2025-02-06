import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Card,
  Text,
  TextInput,
  Button,
  Portal,
  Snackbar,
  ProgressBar,
  Chip,
  List,
} from "react-native-paper";
import { useDeepseekAI } from "../hooks/useDeepseekAI";
import { PremiumFeature } from "../../premium/components/PremiumFeature";

interface AICategoryCreatorProps {
  onCategoryCreate: (category: {
    name: string;
    description: string;
    color: string;
    flashcards: Array<{ term: string; definition: string }>;
  }) => Promise<void>;
  onUpgradePress?: () => void;
}

type CreationStep = {
  id: string;
  title: string;
  status: "pending" | "loading" | "success" | "error";
  error?: string;
};

export const AICategoryCreator: React.FC<AICategoryCreatorProps> = ({
  onCategoryCreate,
  onUpgradePress,
}) => {
  const [prompt, setPrompt] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const { createCategoryWithFlashcards, isLoading, error } = useDeepseekAI();
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  // Creation progress tracking
  const [creationSteps, setCreationSteps] = useState<CreationStep[]>([
    {
      id: "generate",
      title: "Generating category and flashcards",
      status: "pending",
    },
    { id: "save", title: "Saving to database", status: "pending" },
    { id: "complete", title: "Finalizing", status: "pending" },
  ]);

  const updateStepStatus = (
    stepId: string,
    status: CreationStep["status"],
    error?: string
  ) => {
    setCreationSteps((steps) =>
      steps.map((step) =>
        step.id === stepId ? { ...step, status, error } : step
      )
    );
  };

  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ visible: true, message, type });
  };

  const resetProgress = () => {
    setCreationSteps((steps) =>
      steps.map((step) => ({ ...step, status: "pending", error: undefined }))
    );
  };

  const handleGenerate = async () => {
    try {
      resetProgress();

      // Step 1: Generate content
      updateStepStatus("generate", "loading");
      const result = await createCategoryWithFlashcards(prompt, cardCount);
      if (!result) throw new Error("Failed to generate content");
      updateStepStatus("generate", "success");

      // Step 2: Save to database
      updateStepStatus("save", "loading");
      try {
        await onCategoryCreate({
          ...result.category,
          flashcards: result.flashcards,
        });
        updateStepStatus("save", "success");
      } catch (err) {
        updateStepStatus(
          "save",
          "error",
          err instanceof Error ? err.message : "Failed to save category"
        );
        throw err;
      }

      // Step 3: Complete
      updateStepStatus("complete", "loading");
      showFeedback(
        `Created category "${result.category.name}" with ${result.flashcards.length} flashcards!`,
        "success"
      );
      setPrompt("");
      updateStepStatus("complete", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create category";
      showFeedback(errorMessage, "error");
    }
  };

  const cardCountOptions = [5, 10, 15, 20, 25, 30];

  const getStepIcon = (status: CreationStep["status"]) => {
    switch (status) {
      case "loading":
        return "progress-clock";
      case "success":
        return "check-circle";
      case "error":
        return "alert-circle";
      default:
        return "circle-outline";
    }
  };

  return (
    <PremiumFeature
      featureName="AI Category Creator"
      onUpgradePress={onUpgradePress}
    >
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              AI Category Creator
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Describe what you want to learn, and I'll create a category with
              flashcards for you.
            </Text>

            {error && (
              <Text style={styles.error} variant="bodySmall">
                {error}
              </Text>
            )}

            <TextInput
              mode="outlined"
              label="What would you like to learn?"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="E.g., Create a category about basic Spanish food vocabulary with common ingredients, cooking verbs, and kitchen utensils"
              disabled={isLoading}
            />

            <Text variant="bodyMedium" style={styles.label}>
              Number of Flashcards
            </Text>
            <View style={styles.chipContainer}>
              {cardCountOptions.map((count) => (
                <Chip
                  key={count}
                  selected={cardCount === count}
                  onPress={() => setCardCount(count)}
                  style={styles.chip}
                  disabled={isLoading}
                >
                  {count}
                </Chip>
              ))}
            </View>

            {isLoading && (
              <Card style={styles.progressCard}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.progressTitle}>
                    Creation Progress
                  </Text>
                  {creationSteps.map((step) => (
                    <List.Item
                      key={step.id}
                      title={step.title}
                      left={(props) => (
                        <List.Icon {...props} icon={getStepIcon(step.status)} />
                      )}
                      description={step.error}
                      descriptionStyle={styles.errorText}
                      titleStyle={{
                        color:
                          step.status === "success"
                            ? "#4CAF50"
                            : step.status === "error"
                            ? "#f44336"
                            : undefined,
                      }}
                    />
                  ))}
                </Card.Content>
              </Card>
            )}

            <Button
              mode="contained"
              onPress={handleGenerate}
              loading={isLoading}
              style={styles.button}
              disabled={!prompt.trim() || isLoading}
            >
              {isLoading ? "Creating..." : "Create Category & Flashcards"}
            </Button>

            <Text variant="bodySmall" style={styles.tip}>
              💡 Tip: Be specific about what you want to learn. The more details
              you provide, the better the results!
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Snackbar
          visible={feedback.visible}
          onDismiss={() => setFeedback((prev) => ({ ...prev, visible: false }))}
          duration={3000}
          style={[
            styles.snackbar,
            {
              backgroundColor:
                feedback.type === "success" ? "#4CAF50" : "#f44336",
            },
          ]}
        >
          {feedback.message}
        </Snackbar>
      </Portal>
    </PremiumFeature>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  loadingContainer: {
    marginVertical: 16,
  },
  loadingText: {
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: "#f44336",
    marginBottom: 16,
  },
  tip: {
    marginTop: 16,
    fontStyle: "italic",
    opacity: 0.7,
  },
  snackbar: {
    margin: 16,
  },
  progressCard: {
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  progressTitle: {
    marginBottom: 8,
  },
  errorText: {
    color: "#f44336",
  },
});
