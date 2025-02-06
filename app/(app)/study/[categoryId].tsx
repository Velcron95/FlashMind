import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import {
  Text,
  IconButton,
  Button,
  ProgressBar,
  Portal,
  Dialog,
  useTheme,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";
import FlipCard from "../../../components/FlipCard";

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  is_learned: boolean;
  last_reviewed?: string;
}

export default function StudyScreen() {
  const theme = useTheme();
  const { categoryId } = useLocalSearchParams();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [stats, setStats] = useState({
    learned: 0,
    total: 0,
  });

  useEffect(() => {
    fetchFlashcards();
  }, [categoryId]);

  const fetchFlashcards = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      let query = supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id);

      if (categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Shuffle the flashcards
      const shuffled = data ? [...data].sort(() => Math.random() - 0.5) : [];
      setFlashcards(shuffled);
      setStats({
        learned: shuffled.filter((f) => f.is_learned).length,
        total: shuffled.length,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load flashcards"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkLearned = async () => {
    if (currentIndex >= flashcards.length) return;

    const flashcard = flashcards[currentIndex];
    try {
      const { error: updateError } = await supabase
        .from("flashcards")
        .update({
          is_learned: true,
          last_reviewed: new Date().toISOString(),
        })
        .eq("id", flashcard.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedFlashcards = [...flashcards];
      updatedFlashcards[currentIndex] = {
        ...flashcard,
        is_learned: true,
      };
      setFlashcards(updatedFlashcards);
      setStats((prev) => ({
        ...prev,
        learned: prev.learned + 1,
      }));

      goToNext();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update flashcard"
      );
    }
  };

  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowCompleteDialog(true);
    }
  };

  const handleComplete = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading flashcards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No flashcards found in this category</Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => router.back()} />
          <ProgressBar
            progress={currentIndex / flashcards.length}
            style={styles.progress}
          />
          <Text style={styles.counter}>
            {currentIndex + 1} / {flashcards.length}
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <FlipCard
            front={flashcards[currentIndex].term}
            back={flashcards[currentIndex].definition}
          />
        </View>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={goToNext} style={styles.button}>
            Skip
          </Button>
          <Button
            mode="contained"
            onPress={handleMarkLearned}
            style={styles.button}
          >
            Learned
          </Button>
        </View>
      </View>

      <Portal>
        <Dialog visible={showCompleteDialog} onDismiss={handleComplete}>
          <Dialog.Title>Study Session Complete!</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge">
              You've reviewed all flashcards in this session.
            </Text>
            <Text style={styles.stats}>
              Learned: {stats.learned} / {stats.total}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleComplete}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  progress: {
    flex: 1,
    marginHorizontal: 16,
  },
  counter: {
    marginLeft: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  button: {
    minWidth: 120,
  },
  stats: {
    marginTop: 16,
    textAlign: "center",
  },
});
