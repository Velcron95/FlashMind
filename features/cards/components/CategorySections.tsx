import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Surface, useTheme, Button, Divider } from "react-native-paper";
import { router } from "expo-router";
import { CardFactory } from "./CardFactory";
import type { Flashcard, CardType } from "../types/cards";

interface CategorySectionsProps {
  categoryId: string;
  categoryName: string;
  cards: Flashcard[];
  onStudy?: () => void;
}

export const CategorySections: React.FC<CategorySectionsProps> = ({
  categoryId,
  categoryName,
  cards,
  onStudy,
}) => {
  const theme = useTheme();

  const cardsByType: Record<CardType, Flashcard[]> = {
    classic: cards.filter((card) => card.card_type === "classic"),
    true_false: cards.filter((card) => card.card_type === "true_false"),
    multiple_choice: cards.filter(
      (card) => card.card_type === "multiple_choice"
    ),
  };

  const handleCreateCard = () => {
    router.push(`/flashcard/create/${categoryId}`);
  };

  const renderSection = (type: CardType, title: string) => {
    const sectionCards = cardsByType[type];
    if (sectionCards.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {title}
          </Text>
          <Text variant="bodySmall">
            {sectionCards.length} card{sectionCards.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.cardList}>
            {sectionCards.map((card) => (
              <View key={card.id} style={styles.cardWrapper}>
                <CardFactory
                  card={card}
                  onFlip={() => {}}
                  onSwipe={() => {}}
                  isFlipped={false}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <Text variant="headlineMedium">{categoryName}</Text>
        <Text variant="bodyLarge">
          {cards.length} card{cards.length !== 1 ? "s" : ""} total
        </Text>
      </View>

      <ScrollView>
        {renderSection("classic", "Classic Cards")}
        {cardsByType.classic.length > 0 && <Divider />}
        {renderSection("true_false", "True/False Cards")}
        {cardsByType.true_false.length > 0 && <Divider />}
        {renderSection("multiple_choice", "Multiple Choice Cards")}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={onStudy}
          style={styles.button}
          icon="school"
        >
          Study All
        </Button>
        <Button
          mode="outlined"
          onPress={handleCreateCard}
          style={styles.button}
          icon="plus"
        >
          Add Card
        </Button>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  section: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  cardList: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
  },
  cardWrapper: {
    width: 300,
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    flex: 1,
  },
});
