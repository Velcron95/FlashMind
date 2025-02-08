import React from "react";
import { StyleSheet, Dimensions, View, TouchableOpacity } from "react-native";
import { Text, IconButton } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  SharedValue,
  runOnJS,
  WithTimingConfig,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface TrueFalseSlideCardProps {
  slideX: SharedValue<number>;
  statement: string;
  onTrue: () => void;
  onFalse: () => void;
  onSkip: () => void;
  isAnswered: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
  style?: any;
}

export const TrueFalseSlideCard: React.FC<TrueFalseSlideCardProps> = ({
  slideX,
  statement,
  onTrue,
  onFalse,
  onSkip,
  isAnswered,
  isCorrect,
  correctAnswer,
  style,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.statement}>{statement}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={onTrue}
              disabled={isAnswered}
              style={[
                styles.button,
                styles.trueButton,
                isAnswered && isCorrect === true && styles.correctAnswer,
                isAnswered && isCorrect === false && styles.wrongAnswer,
              ]}
            >
              <Text style={styles.buttonText}>True</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onFalse}
              disabled={isAnswered}
              style={[
                styles.button,
                styles.falseButton,
                isAnswered && isCorrect === false && styles.correctAnswer,
                isAnswered && isCorrect === true && styles.wrongAnswer,
              ]}
            >
              <Text style={styles.buttonText}>False</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onSkip}
            disabled={isAnswered}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {isAnswered && (
            <View
              style={[
                styles.feedbackOverlay,
                isCorrect ? styles.correctOverlay : styles.wrongOverlay,
              ]}
            >
              <IconButton
                icon={isCorrect ? "check-circle" : "close-circle"}
                iconColor="white"
                size={64}
              />
              <Text style={styles.feedbackText}>
                {isCorrect ? "Correct!" : "Incorrect!"}
              </Text>
              <Text style={styles.correctAnswerText}>
                Correct answer: {correctAnswer === "true" ? "True" : "False"}
              </Text>
              {isCorrect && (
                <Text style={[styles.correctAnswerText, styles.wellDoneText]}>
                  Well done! ��
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export const slideTrueFalseCard = (
  slideX: SharedValue<number>,
  onComplete: () => void,
  onStateReset: () => void,
  onUpdateContent: () => void,
  isAnswered: boolean,
  config: WithTimingConfig
) => {
  "worklet";

  slideX.value = withSequence(
    // First slide out to the left
    withTiming(
      -SCREEN_WIDTH,
      { duration: 350, easing: config.easing },
      (finished) => {
        if (finished) {
          // Reset states and update content when card is off screen
          runOnJS(onStateReset)();
          runOnJS(onUpdateContent)();
        }
      }
    ),
    // Directly slide in from the right
    withTiming(0, { duration: 500, easing: config.easing }, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
      }
    })
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  statement: {
    fontSize: 22,
    textAlign: "center",
    color: "#2D3748",
    lineHeight: 32,
    fontWeight: "600",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginTop: "auto",
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  trueButton: {
    backgroundColor: "#4CAF50",
  },
  falseButton: {
    backgroundColor: "#f44336",
  },
  correctAnswer: {
    backgroundColor: "#4CAF50",
    transform: [{ scale: 0.98 }],
  },
  wrongAnswer: {
    backgroundColor: "#f44336",
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  skipText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  feedbackOverlay: {
    position: "absolute",
    top: -24,
    left: -24,
    right: -24,
    bottom: -24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 1)",
    overflow: "hidden",
  },
  correctOverlay: {
    backgroundColor: "#4CAF50",
  },
  wrongOverlay: {
    backgroundColor: "#f44336",
  },
  feedbackText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  correctAnswerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  wellDoneText: {
    marginTop: 8,
    fontSize: 20,
    opacity: 1,
  },
});
