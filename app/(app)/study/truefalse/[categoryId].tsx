import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, IconButton, ProgressBar, Button } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";
import Animated, { useSharedValue, Easing } from "react-native-reanimated";
import { FlipCard } from "@/features/cards/components/FlipCard";
import {
  SlideCard,
  slideNextCard,
} from "@/features/cards/components/SlideCard";
import type { TrueFalseCard } from "@/features/cards/types/cards";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface TrueFalseModeProps {
  cards: TrueFalseCard[];
  currentIndex: number;
  onComplete: () => void;
  onProgress: (progress: number) => void;
  onNextCard: (index: number) => void;
  isAnswered: boolean;
  setIsAnswered: (value: boolean) => void;
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
  onAnswerSubmit: (isCorrect: boolean) => void;
  onSkip: () => void;
}

const TrueFalseMode: React.FC<TrueFalseModeProps> = ({
  cards,
  currentIndex,
  onComplete,
  onProgress,
  onNextCard,
  isAnswered,
  setIsAnswered,
  isAnimating,
  setIsAnimating,
  onAnswerSubmit,
  onSkip,
}) => {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const slideX = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  useEffect(() => {
    setIsCorrect(null);
    setIsAnswered(false);
    setIsAnimating(false);
    slideX.value = 0;
    isFlipped.value = false;
  }, [currentIndex]);

  const handleAnswer = async (answer: boolean) => {
    if (isAnswered || isAnimating) return;

    const currentCard = cards[currentIndex];
    const isAnswerCorrect = answer.toString() === currentCard.correct_answer;

    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);
    onProgress((currentIndex + 1) / cards.length);
    onAnswerSubmit(isAnswerCorrect);

    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setIsAnimating(true);
        setIsCorrect(null);
        setIsAnswered(false);

        slideNextCard(
          slideX,
          () => {
            onNextCard(currentIndex + 1);
          },
          () => {
            isFlipped.value = false;
          }
        );
      } else {
        onComplete();
      }
    }, 1000);
  };

  const handleSkip = () => {
    if (!isAnswered && !isAnimating && currentIndex < cards.length - 1) {
      setIsAnimating(true);
      slideNextCard(
        slideX,
        () => {
          onNextCard(currentIndex + 1);
        },
        () => {
          isFlipped.value = false;
        },
        false,
        {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.0).factory(),
        }
      );
      onSkip();
    }
  };

  return (
    <View style={styles.cardContainer}>
      <SlideCard slideX={slideX} style={styles.cardWrapper}>
        <View style={styles.flipContainer}>
          <FlipCard
            isFlipped={isFlipped}
            cardStyle={[
              styles.card,
              isAnswered && (isCorrect ? styles.correctCard : styles.wrongCard),
            ]}
            RegularContent={
              <>
                <View style={styles.cardContent}>
                  <Text style={styles.cardText}>
                    {cards[currentIndex]?.statement}
                  </Text>
                  <View style={styles.actionContainer}>
                    <View style={styles.buttonContainer}>
                      <Button
                        mode="contained"
                        onPress={() => handleAnswer(true)}
                        disabled={isAnswered || isAnimating}
                        style={[styles.button, styles.trueButton]}
                        labelStyle={styles.buttonLabel}
                        contentStyle={styles.buttonContent}
                      >
                        True
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleAnswer(false)}
                        disabled={isAnswered || isAnimating}
                        style={[styles.button, styles.falseButton]}
                        labelStyle={styles.buttonLabel}
                        contentStyle={styles.buttonContent}
                      >
                        False
                      </Button>
                    </View>
                    <Button
                      mode="text"
                      onPress={handleSkip}
                      disabled={isAnswered || isAnimating}
                      style={styles.skipButton}
                      textColor="rgba(0, 0, 0, 0.6)"
                    >
                      Skip
                    </Button>
                  </View>
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
                  </View>
                )}
              </>
            }
            FlippedContent={
              <Text style={styles.cardText}>
                {isCorrect ? "Well done!" : "Keep practicing!"}
              </Text>
            }
          />
        </View>
      </SlideCard>
    </View>
  );
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function TrueFalseStudyScreen() {
  const { categoryId } = useLocalSearchParams();
  const [cards, setCards] = useState<TrueFalseCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    totalTime: 0,
  });
  const [showStats, setShowStats] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    loadCards();
  }, [categoryId]);

  const handleNextCard = (newIndex: number) => {
    console.log("handleNextCard called with:", { newIndex, currentIndex });
    setCurrentIndex(newIndex);
  };

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", categoryId)
        .eq("card_type", "true_false");

      if (error) throw error;

      // Randomize the cards order
      const randomizedCards = shuffleArray(data || []);
      setCards(randomizedCards);
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setStats((prev) => ({
      ...prev,
      totalTime: Math.floor((Date.now() - startTime.current) / 1000),
    }));
    setShowStats(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  const handleSkip = () => {
    setStats((prev) => ({
      ...prev,
      skipped: prev.skipped + 1,
    }));
  };

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      {!showStats ? (
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

          {cards.length > 0 && (
            <TrueFalseMode
              cards={cards}
              currentIndex={currentIndex}
              onComplete={handleComplete}
              onProgress={setProgress}
              onNextCard={handleNextCard}
              isAnswered={isAnswered}
              setIsAnswered={setIsAnswered}
              isAnimating={isAnimating}
              setIsAnimating={setIsAnimating}
              onAnswerSubmit={handleAnswer}
              onSkip={handleSkip}
            />
          )}
        </>
      ) : (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Study Complete!</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.incorrect}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(
                  (stats.correct / (stats.correct + stats.incorrect)) * 100
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.skipped}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <IconButton icon="clock-outline" iconColor="white" size={24} />
            <Text style={styles.timeText}>
              {Math.floor(stats.totalTime / 60)}m {stats.totalTime % 60}s
            </Text>
          </View>

          <View style={styles.statsActions}>
            <Button
              mode="contained"
              onPress={() => {
                // Reset everything and start over
                setCurrentIndex(0);
                setProgress(0);
                setStats({
                  correct: 0,
                  incorrect: 0,
                  skipped: 0,
                  totalTime: 0,
                });
                setShowStats(false);
                startTime.current = Date.now();
              }}
              style={styles.statsButton}
            >
              Try Again
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.statsButton}
              textColor="white"
            >
              Done
            </Button>
          </View>
        </View>
      )}
    </LinearGradient>
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
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
  },
  flipContainer: {
    flex: 1,
    perspective: "1000px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  correctCard: {
    backgroundColor: "#4CAF50",
  },
  wrongCard: {
    backgroundColor: "#f44336",
  },
  cardContent: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
    paddingVertical: 30,
  },
  cardText: {
    fontSize: 24,
    textAlign: "center",
    color: "#2D3748",
    lineHeight: 32,
    fontWeight: "500",
  },
  actionContainer: {
    width: "100%",
    marginTop: "auto",
    position: "relative",
  },
  feedbackOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 20,
    zIndex: 10,
  },
  correctOverlay: {
    backgroundColor: "#4CAF50",
  },
  wrongOverlay: {
    backgroundColor: "#f44336",
  },
  feedbackText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 16,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    height: 56,
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  trueButton: {
    backgroundColor: "#4CAF50",
  },
  falseButton: {
    backgroundColor: "#f44336",
  },
  skipButton: {
    marginTop: 8,
    borderColor: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1,
    borderRadius: 8,
  },
  statsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  statsTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 40,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 40,
  },
  statCard: {
    width: "47%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  timeText: {
    fontSize: 20,
    color: "white",
    marginLeft: 8,
  },
  statsActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  statsButton: {
    flex: 1,
  },
});
