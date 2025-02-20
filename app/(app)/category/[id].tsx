/**
 * CategoryDetailScreen - Individual category view with flashcards
 * Route: /category/[id]
 */
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Text,
  IconButton,
  Button,
  ActivityIndicator,
  Surface,
  Portal,
  Dialog,
} from "react-native-paper";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { Category } from "@/types/database";
import type { Flashcard } from "@/features/cards/types/cards";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [classicCards, setClassicCards] = useState<Flashcard[]>([]);
  const [trueFalseCards, setTrueFalseCards] = useState<Flashcard[]>([]);
  const [multipleChoiceCards, setMultipleChoiceCards] = useState<Flashcard[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("[CategoryDetail] Fetching data for category:", id);

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", id)
        .order("created_at", { ascending: false });

      if (flashcardsError) throw flashcardsError;

      const cards = flashcardsData || [];
      setFlashcards(cards);

      // Group cards by type
      setClassicCards(cards.filter((card) => card.card_type === "classic"));
      setTrueFalseCards(
        cards.filter((card) => card.card_type === "true_false")
      );
      setMultipleChoiceCards(
        cards.filter((card) => card.card_type === "multiple_choice")
      );
    } catch (error) {
      console.error("[CategoryDetail] Error in fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      router.replace("/(app)/(tabs)/categories");
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (loading || !category) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{category.name}</Text>
            <IconButton
              icon="pencil"
              mode="contained"
              containerColor="rgba(255,255,255,0.15)"
              iconColor="white"
              size={24}
              style={styles.editButton}
              onPress={() => router.push(`/category/edit/${id}`)}
            />
          </View>
          <Text style={styles.subtitle}>
            {flashcards.length} {flashcards.length === 1 ? "card" : "cards"} to
            study
          </Text>
        </View>

        {/* Study Modes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Modes</Text>
          <View style={styles.studyModes}>
            <Surface style={styles.studyModeCard} elevation={2}>
              <IconButton icon="cards" size={32} iconColor="#4CAF50" />
              <Text style={styles.studyModeTitle}>Classic</Text>
              <Text style={styles.studyModeCount}>
                {classicCards.length} cards
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push(`/study/classic/${id}`)}
                style={styles.studyButton}
                disabled={classicCards.length === 0}
              >
                Study
              </Button>
            </Surface>

            <Surface style={styles.studyModeCard} elevation={2}>
              <IconButton icon="check-circle" size={32} iconColor="#2196F3" />
              <Text style={styles.studyModeTitle}>True/False</Text>
              <Text style={styles.studyModeCount}>
                {trueFalseCards.length} cards
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push(`/study/truefalse/${id}`)}
                style={styles.studyButton}
                disabled={trueFalseCards.length === 0}
              >
                Study
              </Button>
            </Surface>

            <Surface style={styles.studyModeCard} elevation={2}>
              <IconButton
                icon="format-list-checks"
                size={32}
                iconColor="#9C27B0"
              />
              <Text style={styles.studyModeTitle}>Multiple Choice</Text>
              <Text style={styles.studyModeCount}>
                {multipleChoiceCards.length} cards
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push(`/study/multiplechoice/${id}`)}
                style={styles.studyButton}
                disabled={multipleChoiceCards.length === 0}
              >
                Study
              </Button>
            </Surface>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => router.push(`/flashcard/create/${id}`)}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Add New Card
          </Button>
          <Button
            mode="outlined"
            icon="cards"
            onPress={() => router.push(`/category/${id}/cards`)}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            textColor="white"
          >
            View All Cards
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Category</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this category? This action cannot
              be undone and will delete all associated flashcards.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleDelete} textColor="red">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    opacity: 0.95,
  },
  editButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    opacity: 0.9,
  },
  studyModes: {
    gap: 16,
  },
  studyModeCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  studyModeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    color: "#333",
  },
  studyModeCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 16,
  },
  studyButton: {
    width: "100%",
    borderRadius: 12,
  },
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    height: 56,
    borderRadius: 12,
    borderColor: "rgba(255,255,255,0.3)",
  },
  actionButtonContent: {
    height: 56,
  },
});
