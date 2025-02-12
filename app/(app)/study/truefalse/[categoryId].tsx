import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Text, IconButton, ProgressBar, Button } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";
import Animated, {
  useSharedValue,
  Easing,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  SlideCard,
  slideNextCard,
} from "@/features/cards/components/SlideCard";
import type { TrueFalseCard } from "@/features/cards/types/cards";
import {
  TrueFalseSlideCard,
  slideTrueFalseCard,
} from "@/features/cards/components/TrueFalseSlideCard";

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
}) => {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const slideX = useSharedValue(0);

  useEffect(() => {
    setIsCorrect(null);
    setIsAnswered(false);
    setIsAnimating(false);
    slideX.value = 0;
  }, [currentIndex]);

  const animationConfig = {
    duration: 400,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1).factory(),
  };

  const moveToNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsAnimating(true);

      slideTrueFalseCard(
        slideX,
        () => {
          setIsAnimating(false);
        },
        () => {
          setIsCorrect(null);
          setIsAnswered(false);
        },
        () => {
          onNextCard(currentIndex + 1);
        },
        isAnswered,
        animationConfig
      );
    } else {
      onComplete();
    }
  };

  const handleAnswer = async (answer: boolean) => {
    if (isAnswered || isAnimating) return;

    const currentCard = cards[currentIndex];
    const isAnswerCorrect = answer.toString() === currentCard.correct_answer;

    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);
    onProgress((currentIndex + 1) / cards.length);
    onAnswerSubmit(isAnswerCorrect);

    setTimeout(moveToNextCard, 1500);
  };

  return (
    <View style={styles.cardContainer}>
      {currentIndex < cards.length ? (
        <TrueFalseSlideCard
          slideX={slideX}
          statement={cards[currentIndex]?.statement}
          onTrue={() => handleAnswer(true)}
          onFalse={() => handleAnswer(false)}
          isAnswered={isAnswered}
          isCorrect={isCorrect}
          correctAnswer={cards[currentIndex]?.correct_answer}
          style={styles.cardWrapper}
        />
      ) : (
        <View style={styles.statsActions}>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={[styles.statsButton, styles.statsButtonLeft]}
          >
            Back to Deck
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              // Reset everything and start over
              onNextCard(0);
              onProgress(0);
            }}
            style={[styles.statsButton, styles.statsButtonRight]}
          >
            Study Again
          </Button>
        </View>
      )}
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

  const handleComplete = async () => {
    try {
      const endTime = Date.now();
      const startedAt = new Date(startTime.current).toISOString();
      const endedAt = new Date(endTime).toISOString();
      const duration = Math.round((endTime - startTime.current) / 1000);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const sessionData = {
        user_id: user.id,
        category_id: categoryId,
        started_at: startedAt,
        ended_at: endedAt,
        duration: duration,
        cards_reviewed: cards.length,
        correct_answers: stats.correct,
        incorrect_answers: stats.incorrect,
        study_mode: "truefalse",
        accuracy: (stats.correct / (stats.correct + stats.incorrect)) * 100,
        created_at: startedAt,
        updated_at: endedAt,
      };

      const { error } = await supabase
        .from("study_sessions")
        .insert(sessionData);

      if (error) throw error;

      setStats((prev) => ({
        ...prev,
        totalTime: duration,
      }));

      setShowStats(true);
    } catch (error) {
      console.error("Error saving study session:", error);
    }
  };

  const handleStartAgain = () => {
    startTime.current = Date.now();
    setCurrentIndex(0);
    setShowStats(false);
    setStats({
      correct: 0,
      incorrect: 0,
      totalTime: 0,
    });
    setIsAnswered(false);
    setIsAnimating(false);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
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
              onAnswerSubmit={(isCorrect) => {
                handleAnswer(isCorrect);
              }}
            />
          )}
        </>
      ) : (
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
              onPress={handleStartAgain}
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
    marginTop: -60,
  },
  cardWrapper: {
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
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  trueButton: {
    backgroundColor: "#56ab2f",
    borderColor: "#56ab2f",
  },
  falseButton: {
    backgroundColor: "#FFB75E",
    borderColor: "#FFB75E",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "white",
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
  feedback: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  correctText: {
    color: "#4CAF50",
  },
  wrongText: {
    color: "#f44336",
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
});
