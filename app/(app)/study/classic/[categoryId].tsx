import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Text, IconButton, ProgressBar, Button } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  withSequence,
  runOnJS,
  SharedValue,
  WithTimingConfig,
} from "react-native-reanimated";
import { FlipCard } from "@/features/cards/components/FlipCard";
import { supabase } from "@/lib/supabase/supabaseClient";
import {
  SlideCard,
  slideNextCard,
  slidePreviousCard,
} from "@/features/cards/components/SlideCard";
import type { ClassicCard } from "@/features/cards/types/cards";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface ClassicModeProps {
  cards: ClassicCard[];
  currentIndex: number;
  onComplete: () => void;
  onProgress: (progress: number) => void;
  onNextCard: (index: number) => void;
  onCardStatus: (status: "known" | "learning") => void;
}

interface GradientButtonProps {
  colors: [string, string];
  isSelected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  colors,
  isSelected,
  onPress,
  children,
}) => (
  <TouchableOpacity
    style={[styles.statusButton, { flex: 1 }]}
    onPress={onPress}
  >
    <LinearGradient
      colors={
        isSelected
          ? colors
          : (["transparent", "transparent"] as [string, string])
      }
      style={[
        styles.buttonGradient,
        !isSelected && styles.buttonOutline,
        { borderColor: colors[0] },
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          {
            color: isSelected ? "white" : colors[0],
            textShadowOffset: isSelected ? { width: 0, height: 1 } : undefined,
            textShadowRadius: isSelected ? 2 : undefined,
            textShadowColor: isSelected ? "rgba(0,0,0,0.2)" : undefined,
          },
        ]}
      >
        {children}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

type CardStatus = "learning" | "learned" | null;

export default function ClassicStudyScreen() {
  const { categoryId } = useLocalSearchParams();
  const [cards, setCards] = useState<ClassicCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [cardStatuses, setCardStatuses] = useState<Record<string, CardStatus>>(
    {}
  );
  const [stats, setStats] = useState({
    totalReviewed: 0,
    learned: 0,
    learning: 0,
    totalTime: 0,
  });
  const startTime = useRef(Date.now());

  const isFlipped = useSharedValue(false);
  const slideX = useSharedValue(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const animationConfig: WithTimingConfig = {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0).factory(),
  };

  useEffect(() => {
    loadCards();
  }, [categoryId]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", categoryId)
        .eq("card_type", "classic");

      if (error) throw error;

      setCards(shuffleArray(data || []));
    } catch (error) {
      console.error("Error loading cards:", error);
    }
  };

  const handleComplete = () => {
    const totalLearned = Object.values(cardStatuses).filter(
      (status) => status === "learned"
    ).length;

    setStats((prev) => ({
      ...prev,
      totalReviewed: cards.length,
      learned: totalLearned,
      learning: cards.length - totalLearned,
      totalTime: Math.floor((Date.now() - startTime.current) / 1000),
    }));
    setShowStats(true);
  };

  const handleCardStatus = (status: "learning" | "learned") => {
    // Update stats only
    setStats((prev) => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      [status]: prev[status] + 1,
    }));
  };

  const handleFlip = () => {
    isFlipped.value = !isFlipped.value;
  };

  const isValidCardIndex = (index: number) => {
    return index >= 0 && index < cards.length;
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex - 1;
    if (!isValidCardIndex(prevIndex)) return;

    setIsAnimating(true);
    const startSlideAnimation = () => {
      "worklet";
      slideX.value = withTiming(
        SCREEN_WIDTH,
        {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        },
        () => {
          runOnJS(setCurrentIndex)(prevIndex);
          runOnJS(setProgress)(prevIndex / cards.length);

          slideX.value = -SCREEN_WIDTH;
          slideX.value = withTiming(
            0,
            {
              duration: 300,
              easing: Easing.inOut(Easing.ease),
            },
            () => {
              runOnJS(setIsAnimating)(false);
            }
          );
        }
      );
    };

    if (isFlipped.value) {
      isFlipped.value = false;
      setTimeout(startSlideAnimation, 100);
    } else {
      startSlideAnimation();
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    // If we're at the last card, show stats
    if (nextIndex >= cards.length) {
      handleComplete();
      return;
    }

    setIsAnimating(true);
    const startSlideAnimation = () => {
      "worklet";
      slideX.value = withTiming(
        -SCREEN_WIDTH,
        {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        },
        () => {
          runOnJS(setCurrentIndex)(nextIndex);
          runOnJS(setProgress)(nextIndex / cards.length);

          slideX.value = SCREEN_WIDTH;
          slideX.value = withTiming(
            0,
            {
              duration: 300,
              easing: Easing.inOut(Easing.ease),
            },
            () => {
              runOnJS(setIsAnimating)(false);
            }
          );
        }
      );
    };

    if (isFlipped.value) {
      isFlipped.value = false;
      setTimeout(startSlideAnimation, 100);
    } else {
      startSlideAnimation();
    }
  };

  const loadCardStatuses = async () => {
    try {
      const savedStatuses = await AsyncStorage.getItem(
        `card_statuses_${categoryId}`
      );
      if (savedStatuses) {
        setCardStatuses(JSON.parse(savedStatuses));
      }
    } catch (error) {
      console.error("Error loading card statuses:", error);
    }
  };

  const saveCardStatuses = async (newStatuses: Record<string, CardStatus>) => {
    try {
      await AsyncStorage.setItem(
        `card_statuses_${categoryId}`,
        JSON.stringify(newStatuses)
      );
    } catch (error) {
      console.error("Error saving card statuses:", error);
    }
  };

  useEffect(() => {
    loadCardStatuses();
  }, [categoryId]);

  const CardButtons = ({ currentCard }: { currentCard: ClassicCard }) => {
    const isLearned = cardStatuses[currentCard?.id] === "learned";

    const toggleLearned = () => {
      const newStatus: CardStatus = isLearned ? null : "learned";
      const newStatuses: Record<string, CardStatus> = {
        ...cardStatuses,
        [currentCard.id]: newStatus,
      };
      setCardStatuses(newStatuses);
      saveCardStatuses(newStatuses);
    };

    return (
      <TouchableOpacity
        style={[styles.learnedToggle, isLearned && styles.learnedToggleActive]}
        onPress={toggleLearned}
      >
        <Text style={[styles.toggleText, isLearned && styles.toggleTextActive]}>
          {isLearned ? "Learned ✓" : "Mark as Learned"}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleStartAgain = () => {
    setCards(shuffleArray([...cards]));
    setCurrentIndex(0);
    setShowStats(false);
    setCardStatuses({});
    startTime.current = Date.now();
    setStats({
      totalReviewed: 0,
      learned: 0,
      learning: 0,
      totalTime: 0,
    });
  };

  if (cards.length === 0) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading flashcards...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (showStats) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
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
              <IconButton icon="cards" size={28} iconColor="white" />
              <Text style={styles.statValue}>{stats.totalReviewed}</Text>
              <Text style={styles.statLabel}>Total Cards</Text>
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
              <IconButton icon="check-circle" size={28} iconColor="white" />
              <Text style={styles.statValue}>{stats.learned}</Text>
              <Text style={styles.statLabel}>Learned</Text>
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
              <IconButton icon="school" size={28} iconColor="white" />
              <Text style={styles.statValue}>{stats.learning}</Text>
              <Text style={styles.statLabel}>Still Learning</Text>
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
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
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

      <View style={styles.cardContainer}>
        <SlideCard slideX={slideX} style={styles.cardWrapper}>
          <View style={styles.flipContainer}>
            <FlipCard
              isFlipped={isFlipped}
              cardStyle={styles.card}
              onPress={handleFlip}
              RegularContent={
                <View style={styles.cardContent}>
                  <Text style={styles.tapHint}>Tap to flip</Text>
                  <View style={styles.contentCenter}>
                    <Text style={styles.cardText}>
                      {cards[currentIndex]?.term}
                    </Text>
                  </View>
                  <View style={styles.footerContainer}>
                    <CardButtons currentCard={cards[currentIndex]} />
                  </View>
                </View>
              }
              FlippedContent={
                <View style={styles.cardContent}>
                  <Text style={styles.tapHint}>Tap to flip back</Text>
                  <View style={styles.contentCenter}>
                    <Text style={styles.cardText}>
                      {cards[currentIndex]?.definition}
                    </Text>
                  </View>
                  <View style={styles.footerContainer}>
                    <CardButtons currentCard={cards[currentIndex]} />
                  </View>
                </View>
              }
            />
          </View>
        </SlideCard>

        <View style={styles.footer}>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                !isValidCardIndex(currentIndex - 1) && styles.navButtonDisabled,
              ]}
              onPress={handlePrevious}
              disabled={!isValidCardIndex(currentIndex - 1) || isAnimating}
            >
              <LinearGradient
                colors={
                  !isValidCardIndex(currentIndex - 1) || isAnimating
                    ? ["#9CA3AF", "#6B7280"]
                    : ["#3B82F6", "#2563EB"]
                }
                style={styles.navGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.navButtonText}>← Previous</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton]}
              onPress={handleNext}
              disabled={isAnimating}
            >
              <LinearGradient
                colors={
                  isAnimating ? ["#9CA3AF", "#6B7280"] : ["#8B5CF6", "#6D28D9"]
                }
                style={styles.navGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.navButtonText}>
                  {currentIndex === cards.length - 1 ? "Complete →" : "Next →"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardCount: {
    color: "white",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 8,
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  flipContainer: {
    flex: 1,
    perspective: "1000px",
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    justifyContent: "center",
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
  cardText: {
    fontSize: 24,
    color: "#2D3748",
    textAlign: "center",
    fontWeight: "600",
  },
  tapHint: {
    color: "#666",
    fontSize: 14,
    marginBottom: 16,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    opacity: 0.8,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 40,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    height: 45,
    borderRadius: 8,
    overflow: "hidden",
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  buttonOutline: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
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
  navGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  navButtonDisabled: {
    opacity: 0.7,
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
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 12,
  },
  contentCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  footerContainer: {
    width: "100%",
    marginTop: 32,
  },
  cardFooter: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusToggle: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  learningActive: {
    backgroundColor: "#FFB75E",
    borderColor: "#FFB75E",
  },
  learnedActive: {
    backgroundColor: "#56ab2f",
    borderColor: "#56ab2f",
  },
  toggleText: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 16,
    fontWeight: "600",
  },
  activeText: {
    color: "white",
  },
  learnedToggle: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  learnedToggleActive: {
    backgroundColor: "#56ab2f",
    borderColor: "#56ab2f",
  },
  toggleTextActive: {
    color: "white",
  },
});
