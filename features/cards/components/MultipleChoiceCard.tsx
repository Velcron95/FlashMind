import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Surface, Text } from "react-native-paper";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import type { MultipleChoiceCard as MultipleChoiceCardType } from "../types/cards";

interface MultipleChoiceCardProps {
  card: MultipleChoiceCardType;
  onAnswer?: (isCorrect: boolean) => void;
}

export const MultipleChoiceCard: React.FC<MultipleChoiceCardProps> = ({
  card,
  onAnswer,
}) => {
  const [options, setOptions] = useState(card.options);
  const [answered, setAnswered] = useState(false);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<string>) => {
    return (
      <ScaleDecorator>
        <Pressable onLongPress={drag}>
          <Surface
            style={[
              styles.optionContainer,
              isActive && styles.activeOption,
              answered && item === card.correct_answer && styles.correctOption,
              answered && item !== card.correct_answer && styles.wrongOption,
            ]}
          >
            <Text style={styles.optionText}>{item}</Text>
          </Surface>
        </Pressable>
      </ScaleDecorator>
    );
  };

  const handleDragEnd = ({ data }: { data: string[] }) => {
    if (!answered) {
      setAnswered(true);
      setOptions(data);
      const isCorrect = data[0] === card.correct_answer;
      onAnswer?.(isCorrect);
    }
  };

  return (
    <Surface style={styles.surface} elevation={3}>
      <View style={styles.content}>
        <Text style={styles.question}>{card.question}</Text>

        <DraggableFlatList
          data={options}
          onDragEnd={handleDragEnd}
          keyExtractor={(item: string) => item}
          renderItem={renderItem}
        />

        {answered && (
          <Text
            style={[
              styles.feedback,
              options[0] === card.correct_answer
                ? styles.correctText
                : styles.wrongText,
            ]}
          >
            {options[0] === card.correct_answer ? "Correct!" : "Incorrect!"}
          </Text>
        )}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
    margin: 16,
    backgroundColor: "white",
  },
  content: {
    padding: 16,
  },
  question: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  optionContainer: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  activeOption: {
    backgroundColor: "#e0e0e0",
  },
  correctOption: {
    backgroundColor: "#4CAF50",
  },
  wrongOption: {
    backgroundColor: "#f44336",
  },
  optionText: {
    fontSize: 16,
  },
  feedback: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  correctText: {
    color: "#4CAF50",
  },
  wrongText: {
    color: "#f44336",
  },
});
