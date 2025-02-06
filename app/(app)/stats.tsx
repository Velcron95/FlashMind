import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  ProgressBar,
  List,
  Divider,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { supabase } from "../../lib/supabase/supabaseClient";

interface CategoryStats {
  id: string;
  name: string;
  color: string;
  total: number;
  learned: number;
}

interface StudySession {
  id: string;
  started_at: string;
  ended_at: string;
  cards_reviewed: number;
  correct_answers: number;
  category_name?: string;
}

export default function StatsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalCards: 0,
    learnedCards: 0,
    studyTime: 0,
    streak: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Fetch category stats
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select(
          `
          id,
          name,
          color,
          flashcards (
            id,
            is_learned
          )
        `
        )
        .eq("user_id", user.id);

      if (categoriesError) throw categoriesError;

      const processedStats = categories?.map((category) => ({
        id: category.id,
        name: category.name,
        color: category.color,
        total: category.flashcards?.length || 0,
        learned:
          category.flashcards?.filter((f: any) => f.is_learned).length || 0,
      }));

      setCategoryStats(processedStats || []);

      // Fetch recent study sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("study_sessions")
        .select(
          `
          *,
          categories (name)
        `
        )
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(5);

      if (sessionsError) throw sessionsError;

      setRecentSessions(
        sessions?.map((session) => ({
          ...session,
          category_name: session.categories?.name,
        })) || []
      );

      // Calculate total stats
      const totalCards =
        processedStats?.reduce((sum, cat) => sum + cat.total, 0) || 0;
      const learnedCards =
        processedStats?.reduce((sum, cat) => sum + cat.learned, 0) || 0;
      const studyTime =
        sessions?.reduce(
          (sum, session) =>
            sum +
            (new Date(session.ended_at).getTime() -
              new Date(session.started_at).getTime()),
          0
        ) || 0;

      // Fetch streak
      const { data: streakData, error: streakError } = await supabase
        .from("users")
        .select("streak_count")
        .eq("id", user.id)
        .single();

      if (streakError) throw streakError;

      setTotalStats({
        totalCards,
        learnedCards,
        studyTime: Math.floor(studyTime / (1000 * 60 * 60)), // Convert to hours
        streak: streakData?.streak_count || 0,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
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

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Statistics
      </Text>

      <View style={styles.overviewCards}>
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text variant="titleMedium">Total Cards</Text>
            <Text variant="displaySmall">{totalStats.totalCards}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text variant="titleMedium">Learned</Text>
            <Text variant="displaySmall">{totalStats.learnedCards}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text variant="titleMedium">Study Time</Text>
            <Text variant="displaySmall">{totalStats.studyTime}h</Text>
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text variant="titleMedium">Streak</Text>
            <Text variant="displaySmall">{totalStats.streak}</Text>
          </Card.Content>
        </Card>
      </View>

      <Text variant="titleLarge" style={styles.sectionTitle}>
        Categories Progress
      </Text>

      {categoryStats.map((category) => (
        <View key={category.id} style={styles.categoryProgress}>
          <View style={styles.categoryHeader}>
            <Text variant="titleMedium">{category.name}</Text>
            <Text>
              {category.learned}/{category.total}
            </Text>
          </View>
          <ProgressBar
            progress={
              category.total > 0 ? category.learned / category.total : 0
            }
            color={category.color}
            style={styles.progressBar}
          />
        </View>
      ))}

      <Text variant="titleLarge" style={styles.sectionTitle}>
        Recent Study Sessions
      </Text>

      {recentSessions.map((session, index) => (
        <React.Fragment key={session.id}>
          <List.Item
            title={new Date(session.started_at).toLocaleDateString()}
            description={`${session.category_name || "All Categories"} • ${
              session.correct_answers
            }/${session.cards_reviewed} correct`}
            left={(props) => (
              <List.Icon
                {...props}
                icon="notebook"
                color={theme.colors.primary}
              />
            )}
          />
          {index < recentSessions.length - 1 && <Divider />}
        </React.Fragment>
      ))}
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
  overviewCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    minWidth: "45%",
  },
  sectionTitle: {
    marginBottom: 16,
  },
  categoryProgress: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});
