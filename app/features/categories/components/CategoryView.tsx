import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, ActivityIndicator, FAB, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";

interface CategoryViewProps {
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category_id: string;
  user_id: string;
}

export function CategoryView({ categoryId }: CategoryViewProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!categoryId || !user?.id) return;
      loadCategoryData();
    }, [categoryId, user?.id])
  );

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      console.log("[CategoryView] Loading category:", categoryId);

      if (!user?.id) {
        throw new Error("No user found");
      }

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .eq("user_id", user.id)
        .single();

      if (categoryError) {
        console.error("[CategoryView] Category error:", categoryError);
        throw categoryError;
      }

      console.log("[CategoryView] Category data:", categoryData);
      setCategory(categoryData);

      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", categoryId)
        .eq("user_id", user.id);

      if (flashcardsError) {
        console.error("[CategoryView] Flashcards error:", flashcardsError);
        throw flashcardsError;
      }

      console.log("[CategoryView] Flashcards count:", flashcardsData?.length);
      setFlashcards(flashcardsData || []);
    } catch (err) {
      console.error("[CategoryView] Error loading category data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load category data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (cardId: string) => {
    router.push(`/flashcard/${cardId}`);
  };

  const handleStartStudy = () => {
    router.push(`/study/classic/${categoryId}`);
  };

  const handleEditCategory = () => {
    router.push(`/category/edit/${categoryId}`);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  if (error || !category) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
        <Text style={styles.errorText}>{error || "Category not found"}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{category.name}</Text>
            <IconButton
              icon="pencil"
              iconColor="white"
              onPress={() => router.push(`/category/edit/${categoryId}`)}
            />
          </View>
          <Text style={styles.subtitle}>{flashcards.length} cards</Text>
        </View>

        {flashcards.length > 0 ? (
          <View style={styles.cardsContainer}>
            {flashcards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.card}
                onPress={() => handleCardPress(card.id)}
              >
                <Text style={styles.cardText}>{card.front}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No flashcards yet</Text>
            <Text style={styles.emptySubtext}>
              Add some flashcards to start studying
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Card"
        style={styles.fab}
        onPress={() => router.push(`/flashcard/create/${categoryId}`)}
      />

      {flashcards.length > 0 && (
        <FAB
          icon="play"
          label="Start Study"
          style={styles.studyFab}
          onPress={handleStartStudy}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
  },
  cardText: {
    color: "white",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  studyFab: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  errorText: {
    color: "white",
    textAlign: "center",
    margin: 16,
  },
});
