import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, IconButton, Card } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const studyMode = {
  id: "classic",
  title: "Basic Cards Review",
  description:
    "Review your basic flashcards. Tap to flip, swipe right for next card",
  icon: "cards-outline",
  color: "#FF6B6B",
};

export default function StudyModeScreen() {
  const { categoryId } = useLocalSearchParams();

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

      <View style={styles.content}>
        <Card
          style={styles.modeCard}
          onPress={() =>
            router.push({
              pathname: "/study/classic/[categoryId]",
              params: { categoryId },
            })
          }
        >
          <LinearGradient
            colors={[studyMode.color, "#4158D0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <IconButton
                    icon={studyMode.icon}
                    iconColor="white"
                    size={28}
                  />
                  <Text style={styles.modeTitle}>{studyMode.title}</Text>
                </View>
              </View>
              <Text style={styles.modeDescription}>
                {studyMode.description}
              </Text>
            </View>
          </LinearGradient>
        </Card>
      </View>
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
  cardGradient: {
    width: "100%",
  },
  cardContent: {
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  modeDescription: {
    fontSize: 14,
    color: "white",
    opacity: 0.8,
    marginLeft: 36,
  },
});
