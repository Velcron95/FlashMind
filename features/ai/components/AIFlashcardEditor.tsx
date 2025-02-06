import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, Card } from "react-native-paper";
import { useDeepseekAI } from "../hooks/useDeepseekAI";
import { PremiumFeature } from "../../premium/components/PremiumFeature";

interface AIFlashcardEditorProps {
  term: string;
  definition: string;
  onDefinitionImprove: (newDefinition: string) => void;
  onUpgradePress?: () => void;
}

export const AIFlashcardEditor: React.FC<AIFlashcardEditorProps> = ({
  term,
  definition,
  onDefinitionImprove,
  onUpgradePress,
}) => {
  const {
    improveDefinition,
    analyzeDefinition,
    getExamples,
    isLoading,
    error,
  } = useDeepseekAI();
  const [analysis, setAnalysis] = useState<{
    clarity: number;
    suggestions: string[];
  } | null>(null);
  const [examples, setExamples] = useState<string[]>([]);

  const handleImproveDefinition = async () => {
    try {
      const result = await improveDefinition(term, definition);
      if (result) {
        onDefinitionImprove(result.content);
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleAnalyzeDefinition = async () => {
    try {
      const result = await analyzeDefinition(term, definition);
      if (result) {
        setAnalysis({
          clarity: result.clarity,
          suggestions: result.suggestions,
        });
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleGenerateExamples = async () => {
    try {
      const result = await getExamples(term, definition);
      if (result) {
        setExamples(result);
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <PremiumFeature
      featureName="AI Flashcard Assistant"
      onUpgradePress={onUpgradePress}
    >
      <Card style={styles.container}>
        <Card.Content>
          <Text variant="titleMedium">AI Assistance</Text>

          {error && (
            <Text style={styles.error} variant="bodySmall">
              {error}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleImproveDefinition}
              loading={isLoading}
              style={styles.button}
            >
              Improve Definition
            </Button>

            <Button
              mode="outlined"
              onPress={handleAnalyzeDefinition}
              loading={isLoading}
              style={styles.button}
            >
              Analyze Clarity
            </Button>

            <Button
              mode="outlined"
              onPress={handleGenerateExamples}
              loading={isLoading}
              style={styles.button}
            >
              Generate Examples
            </Button>
          </View>

          {analysis && (
            <Card style={styles.analysisCard}>
              <Card.Content>
                <Text variant="titleSmall">Analysis</Text>
                <Text variant="bodyMedium">
                  Clarity Score: {(analysis.clarity * 100).toFixed(0)}%
                </Text>
                <Text variant="bodySmall">Suggestions:</Text>
                {analysis.suggestions.map((suggestion, index) => (
                  <Text key={index} variant="bodySmall">
                    • {suggestion}
                  </Text>
                ))}
              </Card.Content>
            </Card>
          )}

          {examples.length > 0 && (
            <Card style={styles.examplesCard}>
              <Card.Content>
                <Text variant="titleSmall">Example Usage:</Text>
                {examples.map((example, index) => (
                  <Text key={index} variant="bodySmall" style={styles.example}>
                    {index + 1}. {example}
                  </Text>
                ))}
              </Card.Content>
            </Card>
          )}
        </Card.Content>
      </Card>
    </PremiumFeature>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 8,
    marginVertical: 10,
  },
  button: {
    marginVertical: 4,
  },
  error: {
    color: "red",
    marginVertical: 8,
  },
  analysisCard: {
    marginTop: 12,
    backgroundColor: "#f8f9fa",
  },
  examplesCard: {
    marginTop: 12,
    backgroundColor: "#f8f9fa",
  },
  example: {
    marginVertical: 4,
  },
});
