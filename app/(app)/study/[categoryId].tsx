import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, IconButton, Card } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const studyModes = [
  {
    id: "classic",
    title: "Basic Cards Review",
    description:
      "Review your basic flashcards. Tap to flip, swipe right for next card",
    icon: "cards-outline",
    color: "#FF6B6B",
  },
  {
    id: "truefalse",
    title: "True/False Quiz",
    description:
      "Test your knowledge with true/false questions. Get instant feedback on your answers",
    icon: "check-circle-outline",
    color: "#4CAF50",
  },
  // Add more study modes here
];

const StudyModeCard = ({ mode, onPress }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        <Card style={styles.modeCard}>
          <LinearGradient
            colors={[mode.color, "#4158D0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <IconButton icon={mode.icon} iconColor="white" size={28} />
                  <Text style={styles.modeTitle}>{mode.title}</Text>
                </View>
              </View>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </View>
          </LinearGradient>
        </Card>
      </Animated.View>
    </Pressable>
  );
};

export default function StudyModeScreen() {
  const { categoryId } = useLocalSearchParams();

  const handleModeSelect = (modeId: string) => {
    router.push({
      pathname: `/study/${modeId}/[categoryId]`,
      params: { categoryId },
    });
  };

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="white"
          onPress={() => router.back()}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Study Mode
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {studyModes.map((mode) => (
          <StudyModeCard
            key={mode.id}
            mode={mode}
            onPress={() => handleModeSelect(mode.id)}
          />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 24,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    flex: 1,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  modeCard: {
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
  },
  modeDescription: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
    marginLeft: 36,
    lineHeight: 22,
  },
});
