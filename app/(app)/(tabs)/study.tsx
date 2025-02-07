import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  useTheme,
  MD3Theme,
  Surface,
  Card,
  IconButton,
} from "react-native-paper";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function StudyScreen() {
  const theme = useTheme<MD3Theme>();

  const studyModes = [
    {
      title: "Classic Review",
      description: "Review flashcards with swipe gestures",
      icon: "cards-outline",
      color: theme.colors.primary,
    },
    {
      title: "Quiz Mode",
      description: "Test yourself with multiple choice questions",
      icon: "head-question-outline",
      color: theme.colors.secondary,
      premium: true,
    },
    {
      title: "Spaced Repetition",
      description: "Study with scientifically proven intervals",
      icon: "clock-outline",
      color: theme.colors.tertiary,
      premium: true,
    },
  ];

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Study
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Choose how you want to study your flashcards
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.modesContainer}>
          {studyModes.map((mode) => (
            <Card
              key={mode.title}
              style={[styles.modeCard]}
              onPress={() => {
                if (mode.title === "Classic Review") {
                  router.push("/(app)/(tabs)/categories");
                } else {
                  router.push("/(app)/premium/subscribe");
                }
              }}
            >
              <LinearGradient
                colors={[mode.color, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.modeContent}>
                  <View style={styles.modeHeader}>
                    <View style={styles.modeTitleContainer}>
                      <IconButton
                        icon={mode.icon}
                        size={24}
                        iconColor="white"
                      />
                      <Text variant="titleMedium" style={styles.modeTitle}>
                        {mode.title}
                      </Text>
                    </View>
                    {mode.premium && (
                      <Surface
                        style={[
                          styles.premiumBadge,
                          { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                        ]}
                      >
                        <Text style={styles.premiumText}>PRO</Text>
                      </Surface>
                    )}
                  </View>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </View>
              </LinearGradient>
            </Card>
          ))}
        </View>

        <View style={styles.statsSection}>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Study Statistics
          </Text>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <IconButton icon="cards" size={28} iconColor="white" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Cards Studied</Text>
            </LinearGradient>

            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <IconButton icon="fire" size={28} iconColor="white" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Study Streak</Text>
            </LinearGradient>

            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <IconButton icon="check-circle" size={28} iconColor="white" />
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "white",
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  modesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    overflow: "hidden",
    borderRadius: 16,
    elevation: 4,
  },
  cardGradient: {
    width: "100%",
  },
  modeContent: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  modeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modeTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modeTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  modeDescription: {
    color: "white",
    opacity: 0.7,
    marginLeft: 40,
    fontSize: 13,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  premiumText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  statsSection: {
    gap: 8,
  },
  statsTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "white",
    opacity: 0.7,
    textAlign: "center",
  },
});
