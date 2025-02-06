import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  FAB,
  useTheme,
  IconButton,
  Menu,
  Searchbar,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";
import type { Category, Flashcard } from "../../../lib/types";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch category details
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      // Fetch flashcards
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", id)
        .order("created_at", { ascending: false });

      if (flashcardsError) throw flashcardsError;
      setFlashcards(flashcardsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const handleDeleteFlashcard = async (flashcardId: string) => {
    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", flashcardId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }
  };

  const filteredFlashcards = flashcards.filter(
    (card) =>
      card.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !category) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderLeftColor: category.color }]}>
        <Text variant="headlineMedium" style={styles.title}>
          {category.name}
        </Text>
        {category.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {category.description}
          </Text>
        )}
        <Button
          mode="contained-tonal"
          onPress={() => router.push(`/(app)/category/edit/${id}`)}
          style={styles.editButton}
        >
          Edit Category
        </Button>
      </View>

      <Searchbar
        placeholder="Search flashcards"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView style={styles.content}>
        {filteredFlashcards.map((flashcard) => (
          <Card key={flashcard.id} style={styles.card}>
            <Card.Title
              title={flashcard.term}
              subtitle="Front"
              right={(props) => (
                <Menu
                  visible={menuVisible === flashcard.id}
                  onDismiss={() => setMenuVisible(null)}
                  anchor={
                    <IconButton
                      {...props}
                      icon="dots-vertical"
                      onPress={() => setMenuVisible(flashcard.id)}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(null);
                      router.push(`/(app)/flashcard/edit/${flashcard.id}`);
                    }}
                    title="Edit"
                    leadingIcon="pencil"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(null);
                      handleDeleteFlashcard(flashcard.id);
                    }}
                    title="Delete"
                    leadingIcon="delete"
                  />
                </Menu>
              )}
            />
            <Card.Content>
              <Text variant="bodyLarge">{flashcard.definition}</Text>
              <Text variant="bodySmall" style={styles.backLabel}>
                Back
              </Text>
            </Card.Content>
          </Card>
        ))}

        {filteredFlashcards.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery
                ? "No flashcards found"
                : "Create your first flashcard to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <FAB
          icon="plus"
          onPress={() => {
            router.push({
              pathname: "/(app)/flashcard/create",
              params: {
                categoryId: id,
                animation: "slide_from_right",
              },
            });
          }}
          style={styles.fab}
        />
        {flashcards.length > 0 && (
          <FAB
            icon="play"
            label="Start Study"
            style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
            onPress={() => router.push(`/(app)/study/${id}`)}
          />
        )}
      </View>
    </View>
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
  header: {
    padding: 16,
    borderLeftWidth: 4,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  title: {
    marginBottom: 8,
  },
  description: {
    opacity: 0.7,
    marginBottom: 16,
  },
  editButton: {
    alignSelf: "flex-start",
  },
  searchBar: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 8,
    marginHorizontal: 16,
  },
  backLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  fab: {
    flex: 1,
    marginHorizontal: 8,
  },
});
