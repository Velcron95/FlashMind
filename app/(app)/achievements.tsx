import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, useTheme, ProgressBar } from "react-native-paper";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Icon.glyphMap;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_card",
    title: "First Steps",
    description: "Create your first flashcard",
    icon: "card-text",
    progress: 1,
    maxProgress: 1,
    unlocked: true,
  },
  {
    id: "card_master",
    title: "Card Master",
    description: "Create 100 flashcards",
    icon: "cards",
    progress: 45,
    maxProgress: 100,
    unlocked: false,
  },
  {
    id: "study_streak",
    title: "Consistent Learner",
    description: "Maintain a 7-day study streak",
    icon: "fire",
    progress: 3,
    maxProgress: 7,
    unlocked: false,
  },
  {
    id: "perfect_session",
    title: "Perfect Session",
    description: "Complete a study session with 100% accuracy",
    icon: "star",
    progress: 1,
    maxProgress: 1,
    unlocked: true,
  },
  {
    id: "category_organizer",
    title: "Organizer",
    description: "Create 5 different categories",
    icon: "folder",
    progress: 2,
    maxProgress: 5,
    unlocked: false,
  },
  {
    id: "sharing_is_caring",
    title: "Sharing is Caring",
    description: "Share a flashcard set with another user",
    icon: "share-variant",
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
];

export default function AchievementsScreen() {
  const theme = useTheme();

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Achievements
      </Text>

      <View style={styles.grid}>
        {ACHIEVEMENTS.map((achievement) => (
          <Card
            key={achievement.id}
            style={[
              styles.card,
              {
                opacity: achievement.unlocked ? 1 : 0.7,
              },
            ]}
          >
            <Card.Content>
              <View style={styles.iconContainer}>
                <Icon
                  name={achievement.icon}
                  size={32}
                  color={
                    achievement.unlocked
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                />
              </View>
              <Text
                variant="titleMedium"
                style={[
                  styles.achievementTitle,
                  { color: theme.colors.primary },
                ]}
              >
                {achievement.title}
              </Text>
              <Text variant="bodySmall" style={styles.description}>
                {achievement.description}
              </Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={achievement.progress / achievement.maxProgress}
                  color={
                    achievement.unlocked
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={styles.progressText}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: "center",
    marginVertical: 16,
  },
  grid: {
    padding: 8,
  },
  card: {
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  achievementTitle: {
    textAlign: "center",
    marginBottom: 4,
  },
  description: {
    textAlign: "center",
    marginBottom: 12,
    opacity: 0.7,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    textAlign: "center",
    marginTop: 4,
    opacity: 0.7,
  },
});
