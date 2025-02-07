import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Text, IconButton, ProgressBar } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

// Add type for classic cards
interface ClassicCard {
  id: string;
  card_type: "classic";
  term: string;
  definition: string;
  times_reviewed: number;
  last_reviewed: string | null;
}

export default function ClassicReviewScreen() {
  const { categoryId } = useLocalSearchParams();
  const [cards, setCards] = useState<ClassicCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadCards();
  }, [categoryId]);

  useEffect(() => {
    if (cards.length > 0) {
      setProgress(currentIndex / cards.length);
    }
  }, [currentIndex, cards.length]);

  const loadCards = async () => {
    try {
      const { data: flashcards, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", categoryId)
        .eq("card_type", "classic");

      if (error) throw error;

      // Type guard and randomization
      const classicCards = (flashcards || [])
        .filter((card): card is ClassicCard => card.card_type === "classic")
        .sort(() => Math.random() - 0.5); // Randomize here

      setCards(classicCards);
    } catch (error) {
      console.error("Error loading flashcards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextCard = () => {
    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);

    if (cards[currentIndex]) {
      const card = cards[currentIndex];
      supabase
        .from("flashcards")
        .update({
          times_reviewed: (card.times_reviewed || 0) + 1,
          last_reviewed: new Date().toISOString(),
        })
        .eq("id", card.id);
    }
  };

  const handleStudyAgain = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCards((prevCards) => [...prevCards].sort(() => Math.random() - 0.5));
  };

  if (loading || cards.length === 0) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>
            {loading ? "Loading flashcards..." : "No basic cards found"}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.completeText}>Great job! 🎉</Text>
          <Text style={styles.statsText}>
            You reviewed {cards.length} cards
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleStudyAgain}>
            <Text style={styles.buttonText}>Study Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back to Category</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="white"
          onPress={() => router.back()}
        />
        <ProgressBar
          progress={progress}
          style={styles.progressBar}
          color="white"
        />
        <Text style={styles.counter}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => setIsFlipped(!isFlipped)}
          activeOpacity={0.9}
        >
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>
                {isFlipped
                  ? cards[currentIndex].definition
                  : cards[currentIndex].term}
              </Text>
            </View>
            <Text style={styles.tapHint}>Tap to flip</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNextCard}>
          <Text style={styles.nextButtonText}>Next Card</Text>
          <IconButton icon="arrow-right" iconColor="white" size={20} />
        </TouchableOpacity>
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
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 8,
  },
  counter: {
    color: "white",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    transform: [{ perspective: 1000 }],
  },
  card: {
    width: "100%",
    height: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
  },
  cardText: {
    fontSize: 24,
    color: "#2D3748",
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tapHint: {
    position: "absolute",
    bottom: 16,
    width: "100%",
    textAlign: "center",
    color: "#718096",
    fontSize: 12,
    fontWeight: "500",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    opacity: 0.8,
  },
  completeText: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
    marginBottom: 8,
  },
  statsText: {
    fontSize: 16,
    color: "white",
    opacity: 0.8,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});
