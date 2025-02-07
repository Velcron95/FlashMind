import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Surface, useTheme, Button } from "react-native-paper";
import { router } from "expo-router";
import { CardFactory } from "./CardFactory";
import type { Flashcard } from "../types/cards";

interface CardCategoryProps {
  categoryId: string;
  categoryName: string;
  cards: Flashcard[];
  onStudy?: () => void;
}

export const CardCategory: React.FC<CardCategoryProps> = ({
  categoryId,
  categoryName,
  cards,
  onStudy,
}) => {
  const theme = useTheme();

  const handleCreateCard = () => {
    router.push(`/flashcard/create/${categoryId}`);
  };

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <Text variant="titleLarge">{categoryName}</Text>
        <Text variant="bodyMedium">
          {cards.length} card{cards.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.cardList}>
          {cards.map((card) => (
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

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={onStudy}
          style={styles.button}
          icon="school"
        >
          Study
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
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cardList: {
    flexDirection: "row",
    padding: 16,
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
