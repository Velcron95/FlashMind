import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, useTheme, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { supabase } from "@/lib/supabase/supabaseClient";

// Add interfaces from stats.tsx
interface DashboardStats {
  cardsStudied: number;
  accuracy: number;
  streak: number;
  recentAchievements: Achievement[];
}

// Add at the top with other interfaces
interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  completed?: boolean;
}

// Add before the DashboardScreen component
const calculateStreak = (sessions: any[]) => {
  if (!sessions.length) return 0;

  // Sort sessions by date, newest first
  const sortedSessions = sessions
    .map((s) => s.created_at)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Check if studied today
  const isToday = (date: string) => {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };

  // Check if dates are consecutive
  const isConsecutiveDay = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  if (!isToday(sortedSessions[0])) return 0;

  let currentStreak = 1;
  let prevDate = new Date(sortedSessions[0]);

  // Group sessions by day to avoid counting multiple sessions per day
  const uniqueDays = [
    ...new Set(
      sortedSessions.map((date) => new Date(date).toISOString().split("T")[0])
    ),
  ];

  // Count consecutive days
  for (let i = 1; i < uniqueDays.length; i++) {
    const currentDate = new Date(uniqueDays[i]);
    if (isConsecutiveDay(currentDate.toISOString(), prevDate.toISOString())) {
      currentStreak++;
      prevDate = currentDate;
    } else {
      break;
    }
  }

  return currentStreak;
};

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    cardsStudied: 0,
    accuracy: 0,
    streak: 0,
    recentAchievements: [],
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .gte(
          "created_at",
          new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
        );

      if (sessions) {
        const totalCards = sessions.reduce(
          (acc, session) => acc + (session.cards_reviewed || 0),
          0
        );
        const totalCorrect = sessions.reduce(
          (acc, session) => acc + (session.correct_answers || 0),
          0
        );
        const totalAnswers = sessions.reduce(
          (acc, session) =>
            acc +
            ((session.correct_answers || 0) + (session.incorrect_answers || 0)),
          0
        );

        setStats({
          cardsStudied: totalCards,
          accuracy:
            totalAnswers > 0
              ? Math.round((totalCorrect / totalAnswers) * 100)
              : 0,
          streak: calculateStreak(sessions),
          recentAchievements: [], // We'll populate this next
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

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
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.statsCard}
          >
            <Text style={styles.statsTitle}>Today's Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IconButton icon="cards" size={28} iconColor="white" />
                <Text style={styles.statValue}>{stats.cardsStudied}</Text>
                <Text style={styles.statLabel}>Cards Studied</Text>
              </View>
              <View style={styles.statItem}>
                <IconButton icon="target" size={28} iconColor="white" />
                <Text style={styles.statValue}>{stats.accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <IconButton icon="fire" size={28} iconColor="white" />
                <Text style={styles.statValue}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
              style={[styles.actionButton, styles.actionGradient]}
            >
              <Button
                mode="contained"
                onPress={() => router.push("/categories/create")}
                icon="plus"
                style={styles.transparentButton}
                labelStyle={styles.buttonLabel}
              >
                New Category
              </Button>
            </LinearGradient>
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
              style={[styles.actionButton, styles.actionGradient]}
            >
              <Button
                mode="contained"
                onPress={() => router.push("/study")}
                icon="play"
                style={styles.transparentButton}
                labelStyle={styles.buttonLabel}
              >
                Start Studying
              </Button>
            </LinearGradient>
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.achievementsCard}
          >
            {/* We'll add achievements here */}
          </LinearGradient>
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
  actionGradient: {
    borderRadius: 12,
    overflow: "hidden",
  },
  transparentButton: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  buttonLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  achievementsContainer: {
    marginBottom: 24,
  },
  achievementsCard: {
    padding: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 16,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
