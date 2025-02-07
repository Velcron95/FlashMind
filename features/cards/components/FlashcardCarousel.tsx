import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import PagerView from "react-native-pager-view";
import { CardFactory } from "./CardFactory";
import type { Flashcard } from "../types/cards";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface FlashcardCarouselProps {
  flashcards: Flashcard[];
  onMenuPress: (id: string) => void;
  menuVisible: string | null;
  onDelete: (id: string) => void;
}

export const FlashcardCarousel: React.FC<FlashcardCarouselProps> = ({
  flashcards,
  onMenuPress,
  menuVisible,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      {flashcards.length > 0 ? (
        <PagerView style={styles.pagerView} initialPage={0}>
          {flashcards.map((card) => (
            <View key={card.id} style={styles.pageContainer}>
              <CardFactory
                card={card}
                isFlipped={false}
                onFlip={() => {}}
                onSwipe={() => {}}
              />
            </View>
          ))}
        </PagerView>
      ) : (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge">No cards found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
