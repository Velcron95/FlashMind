import React from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  withTiming,
  SharedValue,
} from "react-native-reanimated";

interface FlipCardProps {
  isFlipped: SharedValue<boolean>;
  cardStyle?: StyleProp<ViewStyle>;
  direction?: "x" | "y";
  duration?: number;
  RegularContent: React.ReactNode;
  FlippedContent: React.ReactNode;
  onPress?: () => void;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  isFlipped,
  cardStyle,
  direction = "y",
  duration = 500,
  RegularContent,
  FlippedContent,
  onPress,
}) => {
  const isDirectionX = direction === "x";

  const regularCardAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180]);
    const rotateValue = withTiming(`${spinValue}deg`, { duration });

    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
    };
  });

  const flippedCardAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360]);
    const rotateValue = withTiming(`${spinValue}deg`, { duration });

    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateY: withTiming(isFlipped.value ? "180deg" : "0deg", {
          duration: 300,
        }),
      },
    ],
    backfaceVisibility: "hidden",
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateY: withTiming(isFlipped.value ? "360deg" : "180deg", {
          duration: 300,
        }),
      },
    ],
    backfaceVisibility: "hidden",
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, cardStyle]}
    >
      <Animated.View style={[styles.card, frontAnimatedStyle]}>
        {RegularContent}
      </Animated.View>
      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        {FlippedContent}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    perspective: "1000px",
  },
  card: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backfaceVisibility: "hidden",
  },
  regularCard: {
    zIndex: 1,
  },
  flippedCard: {
    transform: [{ rotateY: "180deg" }],
  },
  cardBack: {
    transform: [{ rotateY: "180deg" }],
  },
});
