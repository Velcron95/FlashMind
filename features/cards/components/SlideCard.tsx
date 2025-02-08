import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  SharedValue,
  runOnJS,
  Easing,
  EasingFunction,
  withSequence,
  WithTimingConfig,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface SlideCardProps {
  slideX: SharedValue<number>;
  children: React.ReactNode;
  style?: any;
}

export const SlideCard: React.FC<SlideCardProps> = ({
  slideX,
  children,
  style,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export const slideNextCard = (
  slideX: SharedValue<number>,
  onComplete: () => void,
  onFlipReset: () => void,
  isFlipped: boolean,
  config: WithTimingConfig
) => {
  "worklet";
  slideX.value = withSequence(
    withTiming(-Dimensions.get("window").width, config),
    withTiming(0, config, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
        if (isFlipped) {
          runOnJS(onFlipReset)();
        }
      }
    })
  );
};

export const slidePreviousCard = (
  slideX: SharedValue<number>,
  onComplete: () => void,
  onFlipReset: () => void,
  isFlipped: boolean,
  config: WithTimingConfig
) => {
  "worklet";
  slideX.value = withSequence(
    withTiming(Dimensions.get("window").width, config),
    withTiming(0, config, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
        if (isFlipped) {
          runOnJS(onFlipReset)();
        }
      }
    })
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
});
