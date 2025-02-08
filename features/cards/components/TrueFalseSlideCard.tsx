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
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface TrueFalseSlideCardProps {
  slideX: SharedValue<number>;
  statement: string;
  onTrue: () => void;
  onFalse: () => void;
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
  isAnswered,
  isCorrect,
  correctAnswer,
  style,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.statement}>{statement}</Text>

            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={onFalse}
                disabled={isAnswered}
                style={[
                  styles.button,
                  isAnswered && isCorrect === false && styles.correctAnswer,
                  isAnswered && isCorrect === true && styles.wrongAnswer,
                ]}
              >
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E53"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>False</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onTrue}
                disabled={isAnswered}
                style={[
                  styles.button,
                  isAnswered && isCorrect === true && styles.correctAnswer,
                  isAnswered && isCorrect === false && styles.wrongAnswer,
                ]}
              >
                <LinearGradient
                  colors={["#56ab2f", "#a8e063"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>True</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

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
                    Well done!
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
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
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
    overflow: "hidden",
    elevation: 2,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  correctAnswer: {
    backgroundColor: "#4CAF50",
    borderColor: "#45a049",
    transform: [{ scale: 0.98 }],
  },
  wrongAnswer: {
    backgroundColor: "#f44336",
    borderColor: "#d32f2f",
    transform: [{ scale: 0.98 }],
  },
  skipButton: {
    position: "absolute",
    bottom: -80,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 12,
    elevation: 2,
  },
  skipGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    overflow: "hidden",
  },
  correctOverlay: {
    backgroundColor: "rgba(76, 175, 80, 0.98)",
  },
  wrongOverlay: {
    backgroundColor: "rgba(244, 67, 54, 0.98)",
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
