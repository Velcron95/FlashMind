import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  Card,
  Button,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { useStoreCategoriesStore } from "@/stores/storeCategoriesStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function StoreCategoriesScreen() {
  const theme = useTheme();
  const { categories, loading, error, purchaseCategory } =
    useStoreCategoriesStore();

  const handlePurchase = async (categoryId: string) => {
    const success = await purchaseCategory(categoryId);
    if (success) {
      // Show success message and navigate to categories
      router.push("/(app)/(tabs)/categories");
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">{item.name}</Text>
              <Text variant="bodyMedium">{item.description}</Text>
              <Text variant="labelLarge" style={styles.tokenCost}>
                {item.token_cost} tokens
              </Text>
              <View style={styles.previewCards}>
                {/* Show preview cards here */}
              </View>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => handlePurchase(item.id)}>
                Purchase
              </Button>
            </Card.Actions>
          </Card>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
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
  },
  card: {
    margin: 8,
  },
  list: {
    padding: 8,
  },
  tokenCost: {
    marginTop: 8,
    fontWeight: "bold",
  },
  previewCards: {
    marginTop: 16,
  },
});
