import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Text, IconButton, ProgressBar, Card } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  runOnJS,
  withTiming,
  interpolate,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface MultipleChoiceCard {
  id: string;
  question: string;
  correct_answer: string;
  options: string[];
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function MultipleChoiceScreen() {
  const { categoryId } = useLocalSearchParams();
  const [cards, setCards] = useState<MultipleChoiceCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    totalTime: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const startTime = useRef(Date.now());
  const slideX = useSharedValue(0);
  const [answerStatus, setAnswerStatus] = useState<{
    answered: boolean;
    isCorrect: boolean;
  } | null>(null);
  const feedbackOpacity = useSharedValue(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Add animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // Add feedback animation style
  const feedbackAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(feedbackOpacity.value, [0, 1], [0.8, 1]);

    return {
      opacity: feedbackOpacity.value,
      transform: [{ scale }],
    };
  });

  useEffect(() => {
    loadCards();
  }, [categoryId]);

  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      const currentCard = cards[currentIndex];
      if (currentCard && Array.isArray(currentCard.options)) {
        setAnswers(shuffleArray([...currentCard.options]));
      }
    }
  }, [currentIndex, cards]);

  useEffect(() => {
    console.log("Current answers:", answers);
    console.log("Current card:", cards[currentIndex]);
  }, [answers, currentIndex, cards]);

  const updateNextCard = (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    setSelectedAnswer(null);
    if (cards[nextIndex]) {
      setAnswers(shuffleArray([...cards[nextIndex].options]));
    }
  };

  const handleNextCard = () => {
    setIsAnimating(true);
    const nextIndex = currentIndex + 1;

    slideX.value = withSpring(
      -SCREEN_WIDTH,
      {
        damping: 20,
        stiffness: 90,
      },
      () => {
        slideX.value = SCREEN_WIDTH;
        // Call the new function through runOnJS
        runOnJS(updateNextCard)(nextIndex);

        slideX.value = withSpring(
          0,
          {
            damping: 20,
            stiffness: 90,
          },
          () => {
            runOnJS(setIsAnimating)(false);
          }
        );
      }
    );
  };

  const handleAnswerPress = (answer: string) => {
    if (isAnimating) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === cards[currentIndex]?.correct_answer;
    setAnswerStatus({ answered: true, isCorrect });

    // Animate feedback
    feedbackOpacity.value = withTiming(1, { duration: 300 });

    if (isCorrect) {
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
      }));

      if (currentIndex < cards.length - 1) {
        setTimeout(() => {
          handleNextCard();
          setProgress((currentIndex + 1) / cards.length);
          setAnswerStatus(null);
          setSelectedAnswer(null);
          feedbackOpacity.value = 0;
        }, 1500);
      } else {
        setTimeout(() => {
          handleComplete();
        }, 1500);
      }
    } else {
      setStats((prev) => ({
        ...prev,
        incorrect: prev.incorrect + 1,
      }));
      if (currentIndex < cards.length - 1) {
        setTimeout(() => {
          handleNextCard();
          setProgress((currentIndex + 1) / cards.length);
          setAnswerStatus(null);
          setSelectedAnswer(null);
          feedbackOpacity.value = 0;
        }, 1500);
      } else {
        setTimeout(() => {
          handleComplete();
        }, 1500);
      }
    }
  };

  const loadCards = async () => {
    try {
      console.log("Loading cards for category:", categoryId);
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", categoryId)
        .eq("card_type", "multiple_choice");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Raw loaded cards:", data);

      if (!data || data.length === 0) {
        console.log("No cards found");
        return;
      }

      if (data && data.length > 0) {
        const validCards = data.map((card) => ({
          ...card,
          options: shuffleArray([...card.options]),
        }));
        const shuffledCards = shuffleArray(validCards);
        setCards(shuffledCards);

        const currentCard = shuffledCards[0];
        if (currentCard) {
          setAnswers(shuffleArray([...currentCard.options]));
        }
      }
    } catch (error) {
      console.error("Error in loadCards:", error);
    }
  };

  const handleComplete = () => {
    setStats((prev) => ({
      ...prev,
      totalTime: Math.floor((Date.now() - startTime.current) / 1000),
    }));
    setShowStats(true);
  };

  const handleRestart = () => {
    const reshuffledCards = shuffleArray([...cards]).map((card) => ({
      ...card,
      options: shuffleArray([...card.options]),
    }));
    setCards(reshuffledCards);
    setCurrentIndex(0);
    setProgress(0);
    setAnswerStatus(null);
    setSelectedAnswer(null);
    feedbackOpacity.value = 0;
    setIsAnimating(false);
    slideX.value = 0;

    if (reshuffledCards.length > 0) {
      const firstCard = reshuffledCards[0];
      setAnswers(shuffleArray([...firstCard.options]));
    }

    setShowStats(false);
    startTime.current = Date.now();
    setStats({
      correct: 0,
      incorrect: 0,
      totalTime: 0,
    });
  };

  // Always return something from the component
  return (
    <LinearGradient colors={["#9C27B0", "#4158D0"]} style={styles.container}>
      {showStats ? (
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Session Complete!</Text>
            <Text style={styles.statsSubtitle}>Here's how you did</Text>
          </View>

          <View style={styles.statsGrid}>
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <IconButton icon="check-circle" size={28} iconColor="white" />
              <Text style={styles.statValue}>{stats.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </LinearGradient>

            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <IconButton icon="close-circle" size={28} iconColor="white" />
              <Text style={styles.statValue}>{stats.incorrect}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </LinearGradient>

            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <IconButton icon="percent" size={28} iconColor="white" />
              <Text style={styles.statValue}>
                {Math.round(
                  (stats.correct / (stats.correct + stats.incorrect)) * 100
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </LinearGradient>

            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <IconButton icon="clock-outline" size={28} iconColor="white" />
              <Text style={styles.statValue}>
                {Math.floor(stats.totalTime / 60)}m {stats.totalTime % 60}s
              </Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </LinearGradient>
          </View>

          <View style={styles.statsActions}>
            <TouchableOpacity
              style={[styles.statsButton, styles.statsButtonLeft]}
              onPress={() => router.back()}
            >
              <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                style={styles.statsButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.statsButtonText}>← Back to Deck</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statsButton, styles.statsButtonRight]}
              onPress={handleRestart}
            >
              <LinearGradient
                colors={["#8B5CF6", "#6D28D9"]}
                style={styles.statsButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.statsButtonText}>Study Again →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Main game view
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <IconButton
                icon="arrow-left"
                iconColor="white"
                onPress={() => router.back()}
              />
              <Text style={styles.cardCount}>
                {currentIndex + 1}/{cards.length}
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              style={styles.progressBar}
              color="white"
            />
          </View>

          <View style={styles.content}>
            <Animated.View style={[styles.mainCard, animatedStyle]}>
              <View style={styles.cardContent}>
                <View style={styles.questionContainer}>
                  <Text style={styles.questionLabel}>Question:</Text>
                  <Text style={styles.questionText}>
                    {cards[currentIndex]?.question || "Loading..."}
                  </Text>
                </View>

                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsLabel}>Choose your answer:</Text>
                  {answers.map((answer, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        answerStatus?.answered && {
                          backgroundColor:
                            answer === cards[currentIndex]?.correct_answer
                              ? "#4CAF50" // Correct answer is always green
                              : answer === selectedAnswer
                              ? "#f44336" // Selected wrong answer is red
                              : "#F8FAFC", // Other options stay default
                        },
                      ]}
                      onPress={() => handleAnswerPress(answer)}
                      disabled={isAnimating || answerStatus?.answered}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          (answerStatus?.answered &&
                            answer === cards[currentIndex]?.correct_answer) ||
                          (answerStatus?.answered && answer === selectedAnswer)
                            ? { color: "white" }
                            : null,
                        ]}
                      >
                        {answer}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {answerStatus?.answered && (
                    <Animated.View
                      style={[styles.feedbackContainer, feedbackAnimatedStyle]}
                    >
                      <LinearGradient
                        colors={[
                          answerStatus.isCorrect ? "#4CAF50" : "#f44336",
                          answerStatus.isCorrect ? "#45a049" : "#d32f2f",
                        ]}
                        style={styles.feedbackGradient}
                      >
                        <Text style={styles.feedbackText}>
                          {answerStatus.isCorrect ? "Correct!" : "Incorrect!"}
                        </Text>
                        {!answerStatus.isCorrect && (
                          <Text style={styles.correctAnswerText}>
                            Correct answer:{" "}
                            {cards[currentIndex]?.correct_answer}
                          </Text>
                        )}
                      </LinearGradient>
                    </Animated.View>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>
        </>
      )}
    </LinearGradient>
  );
}

export default function MultipleChoiceStudyScreen() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary
        onError={(error: Error) => {
          console.error("Error in MultipleChoiceScreen:", error);
        }}
        fallbackRender={({ error, resetErrorBoundary }: FallbackProps) => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Something went wrong. Please try again.
            </Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => router.back()}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      >
        <MultipleChoiceScreen />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  cardCount: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginVertical: 8,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -60,
  },
  mainCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 16,
    backgroundColor: "white",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 20,
  },
  questionLabel: {
    fontSize: 18,
    color: "#666",
    marginBottom: 12,
    fontWeight: "600",
  },
  questionText: {
    fontSize: 24,
    color: "#333",
    fontWeight: "600",
    lineHeight: 32,
  },
  optionsContainer: {
    marginTop: 20,
  },
  optionsLabel: {
    fontSize: 18,
    color: "#666",
    marginBottom: 16,
    fontWeight: "600",
  },
  optionButton: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  optionText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  statsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  statsHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 16,
    color: "white",
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "white",
    opacity: 0.7,
    textAlign: "center",
  },
  statsActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  statsButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  statsButtonLeft: {
    marginRight: 6,
  },
  statsButtonRight: {
    marginLeft: 6,
  },
  statsButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  statsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    padding: 12,
    backgroundColor: "#9C27B0",
    borderRadius: 8,
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
  },
  feedbackContainer: {
    position: "absolute",
    bottom: -100,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  feedbackGradient: {
    padding: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  correctAnswerText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.9,
  },
});
