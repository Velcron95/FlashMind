import React from "react";
import { StyleSheet, Animated, PanResponder } from "react-native";
import { Surface, Text } from "react-native-paper";
import type { ClassicCard as ClassicCardType } from "../types/cards";

interface ClassicCardProps {
  card: ClassicCardType;
  onFlip?: () => void;
  onSwipe?: (direction: "left" | "right") => void;
  isFlipped?: boolean;
}

export const ClassicCard: React.FC<ClassicCardProps> = ({
  card,
  onFlip,
  onSwipe,
  isFlipped,
}) => {
  const position = new Animated.ValueXY();
  const SWIPE_THRESHOLD = 120;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
        const direction = gesture.dx > 0 ? "right" : "left";
        Animated.timing(position, {
          toValue: { x: gesture.dx * 2, y: gesture.dy },
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          onSwipe?.(direction);
        });
      } else {
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const animatedStyle = {
    transform: position.getTranslateTransform(),
  };

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      {...panResponder.panHandlers}
    >
      <Surface style={styles.card} onTouchEnd={onFlip}>
        <Text style={styles.text}>
          {isFlipped ? card.definition : card.term}
        </Text>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  text: {
    fontSize: 20,
    textAlign: "center",
  },
});
