import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Text, Card, IconButton, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useFocusEffect } from "@react-navigation/native";
import { areDatesConsecutive, isToday } from "@/utils/dateUtils";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 16;
const CARD_WIDTH = width - CARD_MARGIN * 2;

interface DashboardStats {
  totalCards: number;
  totalCategories: number;
  cardsStudiedToday: number;
  studyStreak: number;
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  gradient: [string, string];
  onPress: () => void;
}

interface StatCardProps {
  value: number;
  label: string;
  icon: string;
  gradient: [string, string];
}

export default function DashboardScreen() {
  const { user, loading } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalCards: 0,
    totalCategories: 0,
    cardsStudiedToday: 0,
    studyStreak: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadDashboardStats();
      }
    }, [user?.id])
  );

  const loadDashboardStats = async () => {
    if (!user?.id) return;

    try {
      // Get total cards
      const { count: totalCards } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get total categories
      const { count: totalCategories } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get cards studied today - Update this query to use cards_reviewed
      const today = new Date().toISOString().split("T")[0];
      const { data: todaySessions } = await supabase
        .from("study_sessions")
        .select("cards_reviewed")
        .eq("user_id", user.id)
        .gte("created_at", today);

      // Calculate total cards studied today
      const cardsStudiedToday =
        todaySessions?.reduce(
          (sum, session) => sum + (session.cards_reviewed || 0),
          0
        ) || 0;

      // Get the user's profile and last study session
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_count, last_study_date")
        .eq("id", user.id)
        .single();

      const { data: lastSession } = await supabase
        .from("study_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let currentStreak = profile?.streak_count || 0;

      if (lastSession && profile?.last_study_date) {
        const lastStudyDate = new Date(profile.last_study_date);
        const todayDate = new Date();

        // If last study was today, keep current streak
        if (isToday(lastStudyDate)) {
          currentStreak = profile.streak_count;
        }
        // If last study was yesterday, increment streak
        else if (areDatesConsecutive(todayDate, lastStudyDate)) {
          currentStreak = (profile.streak_count || 0) + 1;
          // Update the streak in the database
          await supabase
            .from("profiles")
            .update({
              streak_count: currentStreak,
              last_study_date: todayDate.toISOString(),
              updated_at: todayDate.toISOString(),
            })
            .eq("id", user.id);
        }
        // If more than a day has passed, reset streak
        else {
          currentStreak = 0;
          await supabase
            .from("profiles")
            .update({
              streak_count: 0,
              updated_at: todayDate.toISOString(),
            })
            .eq("id", user.id);
        }
      }

      setStats({
        totalCards: totalCards || 0,
        totalCategories: totalCategories || 0,
        cardsStudiedToday,
        studyStreak: currentStreak,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };

  const QuickActionCard: React.FC<QuickActionCardProps> = ({
    title,
    description,
    icon,
    gradient,
    onPress,
  }) => (
    <Card style={styles.actionCard} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <IconButton icon={icon} iconColor="white" size={32} />
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </LinearGradient>
    </Card>
  );

  const StatCard: React.FC<StatCardProps> = ({
    value,
    label,
    icon,
    gradient,
  }) => (
    <Card style={styles.statCard}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      >
        <IconButton icon={icon} iconColor="white" size={24} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please sign in to continue</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome back
            {user.email ? `, ${user.email.split("@")[0]}` : ""}!
          </Text>
          <Text style={styles.subtitle}>Here's your learning overview</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              value={stats.totalCards}
              label="Total Cards"
              icon="cards"
              gradient={["#FF6B6B", "#FF8E53"]}
            />
            <StatCard
              value={stats.totalCategories}
              label="Categories"
              icon="folder"
              gradient={["#4158D0", "#C850C0"]}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              value={stats.cardsStudiedToday}
              label="Studied Today"
              icon="school"
              gradient={["#00B4DB", "#0083B0"]}
            />
            <StatCard
              value={stats.studyStreak}
              label="Day Streak"
              icon="fire"
              gradient={["#FF416C", "#FF4B2B"]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <QuickActionCard
          title="Study Now"
          description="Choose a study mode and start learning"
          icon="book-open-variant"
          gradient={["#4CAF50", "#2196F3"]}
          onPress={() => router.push("/(app)/(tabs)/study")}
        />

        <QuickActionCard
          title="Create Cards"
          description="Add new flashcards to your collection"
          icon="plus-circle"
          gradient={["#9C27B0", "#673AB7"]}
          onPress={() => router.push("/(app)/(tabs)/categories")}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "white",
    opacity: 0.8,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "white",
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
    marginLeft: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});
