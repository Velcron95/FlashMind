import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import {
  Text,
  FAB,
  useTheme,
  ActivityIndicator,
  Card,
  IconButton,
  Chip,
  SegmentedButtons,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { adjustColor } from "@/lib/utils/colors";
import { db } from "@/lib/supabase/db";
import { supabase } from "@/lib/supabase/supabaseClient";
import * as Haptics from "expo-haptics";
import { useUser } from "@/hooks/useUser";
import { useStoreCategoriesStore } from "@/stores/storeCategoriesStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import type { Category } from "@/types/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const SPACING = 12;
const CARD_WIDTH = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

/**
 * CategoryBrowserScreen - Main category management screen
 * Route: /(tabs)/categories
 *
 * Features:
 * - Grid view of all user's categories
 * - Create new categories
 * - Edit/delete existing categories
 * - Navigate to category details
 * - Store integration for purchasing categories
 * - Real-time updates via Supabase
 */
export default function CategoryBrowserScreen() {
  const theme = useTheme();
  const { user } = useUser();
  const { categories, loading, error, fetchCategories } = useCategoriesStore();
  const { categories: storeCategories, loading: storeLoading } =
    useStoreCategoriesStore();
  const [activeTab, setActiveTab] = useState("owned");
  const { studyMode } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;

    console.log("[Categories] Setting up and fetching initial data");
    fetchCategories();

    const subscription = supabase
      .channel(`categories-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log("[Categories] Change detected, fetching categories");
          await fetchCategories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchCategories]);

  const handleDelete = useCallback(
    async (category: Category) => {
      Alert.alert(
        "Delete Category",
        "Are you sure you want to delete this category? This will also delete all flashcards and study history associated with this category.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await db.categories.delete(category.id);
                await fetchCategories();
              } catch (error) {
                console.error("[Categories] Error deleting category:", error);
                Alert.alert(
                  "Error",
                  "Failed to delete category. Please try again."
                );
              }
            },
          },
        ]
      );
    },
    [fetchCategories]
  );

  const handleRefresh = useCallback(async () => {
    console.log("[Categories] Manual refresh triggered");
    await fetchCategories();
  }, [fetchCategories]);

  const handleCategorySelect = (categoryId: string) => {
    try {
      // Navigate to the category view screen
      router.push(`/category/${categoryId}`); // Simplified path
    } catch (error) {
      console.error("[Categories] Navigation error:", error);
      Alert.alert("Error", "Failed to open category. Please try again.");
    }
  };

  if (loading && !categories.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text variant="headlineMedium" style={styles.title}>
          Categories
        </Text>

        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              {
                value: "owned",
                label: "My Categories",
                icon: "folder",
                style: styles.tabButton,
              },
              {
                value: "store",
                label: "Store",
                icon: "store",
                style: styles.tabButton,
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
      </View>

      {activeTab === "owned" ? (
        <FlatList
          data={categories}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor="white"
            />
          }
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
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
                    () => {
                      console.log("Haptics not available");
                    }
                  );
                  handleDelete(item);
                }}
                delayLongPress={300}
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
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No categories yet</Text>
              <Text style={styles.emptySubtext}>
                Create a category to get started
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.storeContainer}>
          <Text style={styles.comingSoon}>Store Coming Soon!</Text>
        </View>
      )}

      {activeTab === "owned" && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push("/category/create")}
          label="Add Category"
          color="white"
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
  },
  header: {
    padding: 16,
    gap: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 34,
    marginBottom: 8,
  },
  tabContainer: {
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  tabButton: {
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
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
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    margin: 16,
  },
  storeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoon: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
