import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, useTheme, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../features/auth/hooks/useAuth";

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {/* Welcome Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.email?.split("@")[0]}
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleMedium">Today's Progress</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium">0</Text>
                  <Text variant="bodySmall">Cards Studied</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium">0%</Text>
                  <Text variant="bodySmall">Accuracy</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium">0</Text>
                  <Text variant="bodySmall">Streak Days</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => router.push("/categories/create")}
              style={styles.actionButton}
              icon="plus"
            >
              New Category
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push("/study")}
              style={styles.actionButton}
              icon="play"
            >
              Start Studying
            </Button>
          </View>
        </View>

        {/* Recent Categories */}
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Recent Categories</Text>
          {/* Add your recent categories list here */}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  dateText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  recentContainer: {
    marginBottom: 24,
  },
});
