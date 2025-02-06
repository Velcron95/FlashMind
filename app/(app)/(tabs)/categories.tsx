import React, { useCallback } from "react";
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

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const SPACING = 12;
const CARD_WIDTH = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export default function CategoriesScreen() {
  const theme = useTheme();
  const { categories, loading, error, refetch } = useCategories();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: "rgba(255,255,255,0.15)" }]}
        onPress={() => router.push("/(app)/category/create")}
        label="Add Category"
        color="white"
      />
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
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
