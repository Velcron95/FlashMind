import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Text, Card, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { adjustColor } from "@/lib/utils/colors";
import { supabase } from "@/lib/supabase/supabaseClient";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const SPACING = 12;
const CARD_WIDTH = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryWithCount extends Category {
  flashcardCount: number;
}

export default function SelectCategoryScreen() {
  const { mode } = useLocalSearchParams();
  const { categories, loading, fetchCategories } = useCategoriesStore();
  const [studyableCategories, setStudyableCategories] = useState<
    CategoryWithCount[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const getQueryForMode = (mode: string) => {
    switch (mode) {
      case "truefalse":
        return {
          card_type: "true_false",
        };
      case "clickanswer":
        return {
          card_type: "multiple_choice",
        };
      default:
        return {
          card_type: "classic",
        };
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        if (categories.length === 0) {
          await fetchCategories();
        }

        const { card_type } = getQueryForMode(mode as string);

        // Get categories that have cards of the correct type
        const { data: validCategoryIds } = await supabase
          .from("flashcards")
          .select("category_id")
          .eq("card_type", card_type);

        const uniqueCategoryIds = [
          ...new Set(
            validCategoryIds?.map(
              (item: { category_id: string }) => item.category_id
            )
          ),
        ];

        const enrichedCategories = await Promise.all(
          categories
            .filter((cat) => uniqueCategoryIds.includes(cat.id))
            .map(async (category) => {
              const { count } = await supabase
                .from("flashcards")
                .select("*", { count: "exact", head: true })
                .eq("category_id", category.id)
                .eq("card_type", card_type);

              return {
                ...category,
                flashcardCount: count || 0,
              };
            })
        );

        setStudyableCategories(enrichedCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [mode, categories]);

  const handleCategorySelect = (categoryId: string) => {
    // Navigate directly to the specific study mode screen
    switch (mode) {
      case "classic":
        router.push({
          pathname: "/(app)/study/classic/[categoryId]",
          params: { categoryId },
        });
        break;
      case "truefalse":
        router.push({
          pathname: "/(app)/study/truefalse/[categoryId]",
          params: { categoryId },
        });
        break;
      case "clickanswer":
        router.push({
          pathname: "/(app)/study/clickanswer/[categoryId]",
          params: { categoryId },
        });
        break;
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#FF6B6B", "#4158D0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, styles.centered]}
      >
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="white"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Select Category to Study</Text>
      </View>

      {studyableCategories.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No categories with flashcards found
          </Text>
          <Text style={styles.emptySubtext}>
            Add some flashcards to your categories first
          </Text>
        </View>
      ) : (
        <FlatList
          data={studyableCategories}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const baseColor = item.color || "#FF6B6B";
            const gradientColors = [
              baseColor,
              adjustColor(baseColor, -30),
            ] as const;

            return (
              <Card
                style={styles.card}
                onPress={() => handleCategorySelect(item.id)}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {item.flashcardCount} cards
                    </Text>
                  </View>
                </LinearGradient>
              </Card>
            );
          }}
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  list: {
    padding: SPACING,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    marginBottom: SPACING,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
  },
  cardGradient: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 24,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    letterSpacing: 0.75,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptySubtext: {
    color: "white",
    opacity: 0.7,
    marginTop: 8,
    textAlign: "center",
  },
  cardSubtitle: {
    color: "white",
    opacity: 0.8,
    marginTop: 8,
    fontSize: 16,
  },
});
