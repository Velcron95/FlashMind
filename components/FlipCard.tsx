import React, { useState } from "react";
import { StyleSheet, Animated, TouchableWithoutFeedback } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";

interface FlipCardProps {
  front: string;
  back: string;
}

export default function FlipCard({ front, back }: FlipCardProps) {
  const theme = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const flipCard = () => {
    Animated.spring(animation, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <TouchableWithoutFeedback onPress={flipCard}>
      <Animated.View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            frontAnimatedStyle,
            { backgroundColor: theme.colors.elevation.level3 },
          ]}
        >
          <Text variant="headlineMedium" style={styles.text}>
            {front}
          </Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            backAnimatedStyle,
            { backgroundColor: theme.colors.elevation.level3 },
          ]}
        >
          <Text variant="bodyLarge" style={styles.text}>
            {back}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    position: "absolute",
    backfaceVisibility: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    elevation: 5,
  },
  cardBack: {
    transform: [{ rotateY: "180deg" }],
  },
  text: {
    textAlign: "center",
  },
});
