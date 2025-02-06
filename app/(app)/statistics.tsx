import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Dimensions } from "react-native";
import {
  Text,
  Card,
  useTheme,
  ActivityIndicator,
  ProgressBar,
} from "react-native-paper";
import { supabase } from "../../lib/supabase/supabaseClient";
import {
  statisticsService,
  StudyStats,
} from "../../lib/services/statisticsService";
import { LineChart } from "react-native-chart-kit";

export default function StatisticsScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log("Starting to load stats...");

      const authResponse = await supabase.auth.getUser();
      console.log("Auth response:", JSON.stringify(authResponse, null, 2));

      const {
        data: { user },
      } = authResponse;
      if (!user) {
        console.log("No user found");
        return;
      }

      console.log("User ID:", user.id);
      const userStats = await statisticsService.getUserStats(user.id);
      console.log("Stats loaded:", JSON.stringify(userStats, null, 2));

      setStats(userStats);
    } catch (e) {
      console.error("Error loading stats:", e);
      Alert.alert(
        "Error",
        "Failed to load statistics: " +
          (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text>No statistics available</Text>
      </View>
    );
  }

  const chartData = {
    labels: stats.weeklyActivity.map((day) =>
      new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })
    ),
    datasets: [
      {
        data: stats.weeklyActivity.map((day) => day.accuracy),
        color: () => theme.colors.primary,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Study Statistics
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="bodyLarge">{stats.totalCards}</Text>
              <Text variant="bodySmall">Total Cards</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="bodyLarge">{stats.cardsLearned}</Text>
              <Text variant="bodySmall">Cards Learned</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="bodyLarge">{stats.streakDays}</Text>
              <Text variant="bodySmall">Day Streak</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Weekly Accuracy</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Category Progress</Text>
          {Object.entries(stats.categoryProgress).map(([id, progress]) => (
            <View key={id} style={styles.categoryProgress}>
              <Text variant="bodyMedium">
                {progress.cardsLearned}/{progress.totalCards} Cards Learned
              </Text>
              <ProgressBar
                progress={progress.cardsLearned / progress.totalCards}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryProgress: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
