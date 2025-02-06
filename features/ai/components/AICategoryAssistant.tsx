import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  TextInput,
  Button,
  Portal,
  Snackbar,
} from "react-native-paper";
import { useDeepseekAI } from "../hooks/useDeepseekAI";
import { PremiumFeature } from "../../premium/components/PremiumFeature";

interface AICategoryAssistantProps {
  onCategoryCreate: (category: {
    name: string;
    description: string;
    color: string;
  }) => Promise<void>;
  onUpgradePress?: () => void;
}

export const AICategoryAssistant: React.FC<AICategoryAssistantProps> = ({
  onCategoryCreate,
  onUpgradePress,
}) => {
  const [prompt, setPrompt] = useState("");
  const {
    improveDefinition,
    isLoading: isAILoading,
    error: aiError,
  } = useDeepseekAI();
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  const [suggestions, setSuggestions] = useState<
    Array<{
      name: string;
      description: string;
      color: string;
    }>
  >([]);

  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ visible: true, message, type });
  };

  const generateCategory = async () => {
    try {
      const result = await improveDefinition(
        "Category Suggestion",
        `Create a study category based on this description: ${prompt}. 
         Format the response as JSON with the following structure:
         {
           "name": "Category Name",
           "description": "Category Description",
           "color": "#HexColor"
         }`
      );

      if (result) {
        try {
          // Try to parse the AI response as JSON
          const parsedResult = JSON.parse(result.content);
          const suggestion = {
            name: parsedResult.name || "Generated Category",
            description: parsedResult.description || result.content,
            color: parsedResult.color || "#FF6B6B",
          };
          setSuggestions([suggestion, ...suggestions]);
          showFeedback("Category generated successfully!", "success");
        } catch (parseError) {
          // Fallback if JSON parsing fails
          const suggestion = {
            name: "Generated Category",
            description: result.content,
            color: "#FF6B6B",
          };
          setSuggestions([suggestion, ...suggestions]);
          showFeedback("Category generated with default formatting", "success");
        }
      }
    } catch (err) {
      showFeedback("Failed to generate category", "error");
    }
  };

  const handleCreateCategory = async (suggestion: (typeof suggestions)[0]) => {
    setIsCreating(true);
    try {
      await onCategoryCreate(suggestion);
      showFeedback("Category created successfully!", "success");
      // Clear suggestions after successful creation
      setSuggestions([]);
      setPrompt("");
    } catch (error) {
      showFeedback("Failed to create category", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <PremiumFeature
      featureName="AI Category Assistant"
      onUpgradePress={onUpgradePress}
    >
      <Card style={styles.container}>
        <Card.Content>
          <Text variant="titleMedium">AI Category Assistant</Text>

          {aiError && (
            <Text style={styles.error} variant="bodySmall">
              {aiError}
            </Text>
          )}

          <TextInput
            mode="outlined"
            label="Describe your category"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="E.g., 'I want to create a category for learning Spanish vocabulary related to food and cooking'"
            disabled={isAILoading || isCreating}
          />

          <Button
            mode="contained"
            onPress={generateCategory}
            loading={isAILoading}
            style={styles.button}
            disabled={!prompt.trim() || isCreating}
          >
            {isAILoading ? "Generating..." : "Generate Category"}
          </Button>

          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              style={[
                styles.suggestionCard,
                { borderLeftColor: suggestion.color },
              ]}
            >
              <Card.Content>
                <Text variant="titleSmall">{suggestion.name}</Text>
                <Text variant="bodySmall">{suggestion.description}</Text>
                <Button
                  mode="outlined"
                  onPress={() => handleCreateCategory(suggestion)}
                  style={styles.useButton}
                  loading={isCreating}
                  disabled={isAILoading || isCreating}
                >
                  {isCreating ? "Creating..." : "Use This Category"}
                </Button>
              </Card.Content>
            </Card>
          ))}
        </Card.Content>
      </Card>

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
    marginVertical: 10,
    marginHorizontal: 16,
  },
  input: {
    marginVertical: 10,
  },
  button: {
    marginVertical: 10,
  },
  error: {
    color: "red",
    marginVertical: 8,
  },
  suggestionCard: {
    marginTop: 12,
    borderLeftWidth: 4,
  },
  useButton: {
    marginTop: 8,
  },
  snackbar: {
    margin: 16,
  },
});
