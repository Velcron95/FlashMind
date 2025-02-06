import { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase/supabaseClient";
import type { StudySession, Category } from "../../types";

interface SessionWithCategory extends StudySession {
  category: Category;
}

export default function StudyHistoryScreen() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<SessionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("study_sessions")
        .select(
          `
          *,
          category:categories(*)
        `
        )
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching study history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions();
  }, []);

  const renderSession = ({ item }: { item: SessionWithCategory }) => {
    const accuracy =
      item.cards_reviewed > 0
        ? ((item.correct_answers / item.cards_reviewed) * 100).toFixed(0)
        : "0";

    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium">{item.category.name}</Text>
          <View style={styles.stats}>
            <Text variant="bodyMedium">Cards: {item.cards_reviewed}</Text>
            <Text variant="bodyMedium">Accuracy: {accuracy}%</Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
            {new Date(item.started_at).toLocaleDateString()}{" "}
            {new Date(item.started_at).toLocaleTimeString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Study History
      </Text>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text variant="titleMedium">No study sessions yet</Text>
              <Text variant="bodyMedium">
                Start studying to see your history!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
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
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
});
