import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  IconButton,
  Searchbar,
  Chip,
  Portal,
  Dialog,
  Button,
  HelperText,
  FAB,
  Menu,
} from "react-native-paper";
import { router } from "expo-router";
import { db } from "../../lib/supabase/db";

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  category_id?: string;
  user_id: string;
  is_learned: boolean;
  times_reviewed: number;
  last_reviewed?: string;
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function FlashcardsScreen() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(
    null
  );

  const fetchData = async () => {
    try {
      // Fetch categories
      const categoriesData = await db.categories.getAll();
      setCategories(categoriesData);

      // Fetch flashcards
      let flashcardsData;
      if (selectedCategory) {
        flashcardsData = await db.flashcards.getByCategory(selectedCategory);
      } else {
        flashcardsData = await db.flashcards.getAll();
      }

      // Apply search filter if needed
      if (searchQuery) {
        flashcardsData = flashcardsData.filter(
          (card) =>
            card.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.definition.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFlashcards(flashcardsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load flashcards"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedCategory]);

  const handleDelete = async (flashcard: Flashcard) => {
    try {
      await db.flashcards.delete(flashcard.id);
      fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete flashcard"
      );
    }
  };

  const handleToggleLearned = async (flashcard: Flashcard) => {
    try {
      await db.flashcards.update(flashcard.id, {
        is_learned: !flashcard.is_learned,
      });
      fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update flashcard"
      );
    }
  };

  const getCategoryColor = (categoryId: string | undefined): string => {
    if (!categoryId) return "#000000"; // Default color if no category
    return categories.find((c) => c.id === categoryId)?.color || "#000000";
  };

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return "Uncategorized";
    return categories.find((c) => c.id === categoryId)?.name || "Uncategorized";
  };

  return (
    <>
      <View style={styles.container}>
        <Searchbar
          placeholder="Search flashcards"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
        >
          <Chip
            selected={!selectedCategory}
            onPress={() => setSelectedCategory(null)}
            style={styles.chip}
          >
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[styles.chip, { borderColor: category.color }]}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>

        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}

        <ScrollView style={styles.content}>
          {flashcards.map((flashcard) => (
            <Card key={flashcard.id} style={styles.card}>
              <Card.Title
                title={flashcard.term}
                subtitle={getCategoryName(flashcard.category_id)}
                right={(props) => (
                  <View style={styles.cardActions}>
                    <IconButton
                      {...props}
                      icon={
                        flashcard.is_learned ? "check-circle" : "circle-outline"
                      }
                      onPress={() => handleToggleLearned(flashcard)}
                    />
                    <IconButton
                      {...props}
                      icon="pencil"
                      onPress={() =>
                        router.push(`/flashcard/edit/${flashcard.id}`)
                      }
                    />
                    <IconButton
                      {...props}
                      icon="delete"
                      onPress={() => handleDelete(flashcard)}
                    />
                  </View>
                )}
              />
              <Card.Content>
                <Text variant="bodyLarge">{flashcard.definition}</Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      <FAB
        icon="plus"
        label="Add Flashcard"
        style={styles.fab}
        onPress={() => router.push("/(app)/flashcard/create")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  categories: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: "row",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
