import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, Button } from "react-native-paper";
import type { TrueFalseCard as TrueFalseCardType } from "../types/cards";

interface TrueFalseCardProps {
  card: TrueFalseCardType;
  onAnswer?: (isCorrect: boolean) => void;
}

export const TrueFalseCard: React.FC<TrueFalseCardProps> = ({
  card,
  onAnswer,
}) => {
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleAnswer = (answer: boolean) => {
    const answerString = answer.toString();
    setSelectedAnswer(answerString);
    setAnswered(true);
    onAnswer?.(answerString === card.correct_answer);
  };

  return (
    <Surface style={styles.surface} elevation={3}>
      <View style={styles.content}>
        <Text style={styles.statement}>{card.statement}</Text>

        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={() => handleAnswer(true)}
            disabled={answered}
            style={[
              styles.button,
              answered &&
                selectedAnswer === "true" &&
                (card.correct_answer === "true"
                  ? styles.correctAnswer
                  : styles.wrongAnswer),
            ]}
          >
            True
          </Button>
          <Button
            mode="contained"
            onPress={() => handleAnswer(false)}
            disabled={answered}
            style={[
              styles.button,
              answered &&
                selectedAnswer === "false" &&
                (card.correct_answer === "false"
                  ? styles.correctAnswer
                  : styles.wrongAnswer),
            ]}
          >
            False
          </Button>
        </View>

        {answered && (
          <Text
            style={[
              styles.feedback,
              selectedAnswer === card.correct_answer
                ? styles.correctText
                : styles.wrongText,
            ]}
          >
            {selectedAnswer === card.correct_answer ? "Correct!" : "Incorrect!"}
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
    alignItems: "center",
  },
  statement: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  correctAnswer: {
    backgroundColor: "#4CAF50",
  },
  wrongAnswer: {
    backgroundColor: "#f44336",
  },
  feedback: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "bold",
  },
  correctText: {
    color: "#4CAF50",
  },
  wrongText: {
    color: "#f44336",
  },
});
