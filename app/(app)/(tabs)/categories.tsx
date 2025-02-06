import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Text,
  FAB,
  useTheme,
  ActivityIndicator,
  Card,
  IconButton,
} from "react-native-paper";
import { router } from "expo-router";
import { useCategories, type Category } from "@/hooks/useCategories";
import { LinearGradient } from "expo-linear-gradient";
import { adjustColor } from "@/lib/utils/colors";
import { AICategoryAssistant } from "@/features/ai/components/AICategoryAssistant";
import { supabase } from "@/lib/supabase/supabaseClient";
import { AICategoryCreator } from "@/features/ai/components/AICategoryCreator";
import { useUser } from "../../../hooks/useUser";
import { PremiumStatus } from "@/components/PremiumStatus";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const SPACING = 12;
const CARD_WIDTH = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export default function CategoriesScreen() {
  const theme = useTheme();
  const { categories, loading, error, refetch } = useCategories();
  const { user, isPremium, loading: userLoading } = useUser();
  const [canAccessAI, setCanAccessAI] = useState(false);

  // Add function to refresh premium status
  const refreshPremiumStatus = useCallback(async () => {
    console.log("[Categories] Refreshing premium status");
    // Force a re-render by toggling state
    setCanAccessAI(false);
    // Small delay to ensure state updates
    await new Promise((resolve) => setTimeout(resolve, 100));
    setCanAccessAI(Boolean(isPremium));
  }, [isPremium]);

  useEffect(() => {
    console.log("[Categories] Premium status changed:", isPremium);
    setCanAccessAI(Boolean(isPremium));
  }, [isPremium]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreateWithAI = async (categoryData: {
    name: string;
    description: string;
    color: string;
    flashcards: Array<{ term: string; definition: string }>;
  }) => {
    try {
      // Get user ID first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // First create the category
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .insert([
          {
            name: categoryData.name,
            description: categoryData.description,
            color: categoryData.color,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Then create all flashcards
      const { error: flashcardsError } = await supabase
        .from("flashcards")
        .insert(
          categoryData.flashcards.map((card) => ({
            category_id: category.id,
            user_id: user.id,
            term: card.term,
            definition: card.definition,
          }))
        );

      if (flashcardsError) throw flashcardsError;

      // Refresh the categories list
      await refetch();

      // Navigate to the new category
      router.push({
        pathname: `/(app)/category/${category.id}`,
        params: {
          animation: "slide_from_right",
        },
      });
    } catch (error) {
      console.error("Error creating category with AI:", error);
      throw error;
    }
  };

  const handleAICreate = async () => {
    console.log(
      "[Categories] Handling AI create. Premium status:",
      canAccessAI
    );

    // Refresh premium status before checking
    await refreshPremiumStatus();

    if (user && canAccessAI) {
      console.log("[Categories] Routing to AI chat");
      router.push({
        pathname: "/(app)/ai-chat",
        params: {
          animation: "slide_from_bottom",
        },
      });
    } else {
      console.log("[Categories] Routing to subscription");
      router.push("/(app)/premium/subscribe");
    }
  };

  if (loading && !categories.length) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="bodyLarge" style={styles.errorText}>
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <PremiumStatus />
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Browse all
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="white" // Make the refresh indicator white
          />
        }
        renderItem={({ item }) => {
          console.log("Rendering category:", item);
          const baseColor = item.color || "#FF6B6B";
          const gradientColors = [
            baseColor,
            adjustColor(baseColor, -30),
          ] as const;

          return (
            <Card
              style={styles.card}
              onPress={() => {
                router.push({
                  pathname: `/(app)/category/${item.id}`,
                  params: {
                    animation: "slide_from_right",
                  },
                });
              }}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name || "Unnamed Category"}
                  </Text>
                </View>
              </LinearGradient>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No categories yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Create a category to get started
            </Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <FAB
          icon="robot"
          style={[
            styles.fab,
            styles.aiFab,
            { backgroundColor: "rgba(255,255,255,0.15)" },
          ]}
          onPress={async () => {
            console.log("[Categories] FAB pressed. Current status:", {
              user: Boolean(user),
              premium: canAccessAI,
              loading: userLoading,
            });
            await handleAICreate();
          }}
          label="AI Create"
          color="white"
          disabled={userLoading}
        />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          onPress={() => router.push("/(app)/category/create")}
          label="Add Category"
          color="white"
        />
      </View>
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
  title: {
    color: "white",
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    paddingHorizontal: 16,
  },
  fabContainer: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    bottom: 16,
    left: 16,
    right: 16,
  },
  fab: {
    borderRadius: 28,
  },
  aiFab: {
    backgroundColor: "rgba(147, 51, 234, 0.3)", // Slight purple tint for AI button
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: "center",
    color: "white",
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    margin: 16,
  },
});
