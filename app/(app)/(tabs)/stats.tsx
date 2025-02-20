import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import {
  Text,
  IconButton,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@/hooks/useUser";
import { areDatesConsecutive, isToday } from "@/utils/dateUtils";

interface StudyStats {
  totalCards: number;
  totalStudyTime: number;
  averageAccuracy: number;
  streak: number;
  cardsStudied: number;
}

interface RecentActivity {
  id: string;
  category_name: string;
  study_mode: string;
  accuracy: number;
  cards_studied: number;
  created_at: string;
  duration: number;
}

interface WeeklyData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity: number) => string;
  }[];
}

interface Category {
  name: string;
}

interface StudySession {
  id: string;
  user_id: string;
  category_id: string;
  started_at: string;
  duration: number;
  cards_reviewed: number;
  correct_answers: number;
  incorrect_answers: number;
  created_at: string;
  updated_at: string;
}

interface DetailedStats extends StudyStats {
  totalSessions: number;
  bestStreak: number;
  studyModeStats: {
    classic: number;
    truefalse: number;
    multiple_choice: number;
  };
}

// Update ActivityResponse interface
interface ActivityResponse {
  id: string;
  category_id: string;
  category: {
    name: string;
  };
  study_mode: string;
  accuracy: number;
  cards_reviewed: number;
  created_at: string;
}

interface StudySessionWithCategory {
  id: string;
  study_mode: string;
  accuracy: number;
  cards_reviewed: number;
  created_at: string;
  duration: number;
  category: {
    name: string;
  };
}

// First, add an interface for the session data we get from Supabase
interface SessionWithCategory {
  id: string;
  study_mode: string;
  accuracy: number;
  cards_reviewed: number;
  correct_answers: number;
  incorrect_answers: number;
  duration: number;
  created_at: string;
  category: {
    name: string;
  };
}

export default function StatsScreen() {
  const { user } = useUser();
  const theme = useTheme();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  // Add state for detailed stats and recent activity
  const [detailedStats, setDetailedStats] = useState<DetailedStats>({
    totalCards: 0,
    totalStudyTime: 0,
    averageAccuracy: 0,
    streak: 0,
    cardsStudied: 0,
    totalSessions: 0,
    bestStreak: 0,
    studyModeStats: {
      classic: 0,
      truefalse: 0,
      multiple_choice: 0,
    },
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Add utility functions
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getStudyModeIcon = (mode: string): string => {
    switch (mode) {
      case "classic":
        return "cards";
      case "truefalse":
        return "check-circle";
      case "multiple_choice":
        return "format-list-bulleted";
      default:
        return "book";
    }
  };

  const getStudyModeColor = (mode: string): string => {
    switch (mode) {
      case "classic":
        return "#4CAF50";
      case "truefalse":
        return "#2196F3";
      case "multiple_choice":
        return "#9C27B0";
      default:
        return "#FFC107";
    }
  };

  // Add fetchRecentActivity function
  const fetchRecentActivity = async () => {
    if (!user?.id || !isMounted.current) return;

    try {
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select(
          `
          id,
          study_mode,
          accuracy,
          cards_reviewed,
          created_at,
          duration,
          category:categories!inner(name)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (sessions && isMounted.current) {
        setRecentActivity(
          (sessions as unknown as StudySessionWithCategory[]).map(
            (session) => ({
              id: session.id,
              category_name: session.category?.name || "Unknown",
              study_mode: session.study_mode,
              accuracy: session.accuracy,
              cards_studied: session.cards_reviewed,
              created_at: session.created_at,
              duration: session.duration,
            })
          )
        );
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  // Add useFocusEffect to refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Set loading state before fetching
      fetchStats();
    }, [])
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update the fetchStats function to check isMounted
  const fetchStats = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);

      // Get the user's last study session
      const { data: lastSession } = await supabase
        .from("study_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get the user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_count, last_study_date")
        .eq("id", user.id)
        .single();

      let currentStreak = profile?.streak_count || 0;

      if (lastSession && profile?.last_study_date) {
        const lastStudyDate = new Date(profile.last_study_date);
        const today = new Date();

        // If last study was today, keep current streak
        if (isToday(lastStudyDate)) {
          currentStreak = profile.streak_count;
        }
        // If last study was yesterday, increment streak
        else if (areDatesConsecutive(today, lastStudyDate)) {
          currentStreak = (profile.streak_count || 0) + 1;
          // Update the streak in the database
          await supabase
            .from("profiles")
            .update({
              streak_count: currentStreak,
              last_study_date: today.toISOString(),
              updated_at: today.toISOString(),
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
              updated_at: today.toISOString(),
            })
            .eq("id", user.id);
        }
      }

      // Get total cards
      const { data: flashcards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id);

      // Get study sessions for stats
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select(
          `
          id,
          study_mode,
          accuracy,
          cards_reviewed,
          correct_answers,
          incorrect_answers,
          duration,
          created_at,
          category:categories!inner(name)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sessions && isMounted.current) {
        const typedSessions = sessions as unknown as SessionWithCategory[];

        // Calculate study mode stats
        const modeStats = {
          classic: 0,
          truefalse: 0,
          multiple_choice: 0,
        };

        typedSessions.forEach((session) => {
          if (session.study_mode in modeStats) {
            modeStats[session.study_mode as keyof typeof modeStats]++;
          }
        });

        // Calculate total study time and average accuracy
        const totalStudyTime = typedSessions.reduce(
          (sum, session) => sum + (session.duration || 0),
          0
        );
        const totalAccuracy = typedSessions.reduce(
          (sum, session) => sum + (session.accuracy || 0),
          0
        );
        const averageAccuracy =
          typedSessions.length > 0 ? totalAccuracy / typedSessions.length : 0;

        // Update stats with the current streak
        const statsData = {
          totalCards: flashcards?.length || 0,
          totalStudyTime,
          averageAccuracy,
          streak: currentStreak,
          cardsStudied: typedSessions.reduce(
            (sum, session) => sum + session.cards_reviewed,
            0
          ),
        };

        setStats(statsData);
        setDetailedStats({
          ...statsData,
          totalSessions: typedSessions.length,
          bestStreak: currentStreak,
          studyModeStats: modeStats,
        });

        // Get recent activity (last 5 sessions)
        const recentSessions = typedSessions.slice(0, 5).map((session) => ({
          id: session.id,
          category_name: session.category.name || "Unknown",
          study_mode: session.study_mode,
          accuracy: session.accuracy || 0,
          cards_studied: session.cards_reviewed,
          created_at: session.created_at,
          duration: session.duration || 0,
        }));

        // Update recent activity
        setRecentActivity(recentSessions);
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Statistics</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.statCard}
          >
            <IconButton icon="cards" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats?.totalCards || 0}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.statCard}
          >
            <IconButton icon="fire" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats?.streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.statCard}
          >
            <IconButton icon="check-circle" size={28} iconColor="white" />
            <Text style={styles.statValue}>
              {stats?.averageAccuracy.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.statCard}
          >
            <IconButton icon="clock-outline" size={28} iconColor="white" />
            <Text style={styles.statValue}>
              {Math.round((stats?.totalStudyTime || 0) / 60)}m
            </Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </LinearGradient>
        </View>

        {/* Study Distribution */}
        <View style={[styles.studyDistribution, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Study Time by Mode</Text>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.distributionCard}
          >
            {/* Distribution bars for each study mode */}
            {Object.entries(detailedStats.studyModeStats).map(
              ([mode, count]) => (
                <View key={mode} style={styles.distributionItem}>
                  <View style={styles.distributionBar}>
                    <View
                      style={[
                        styles.distributionFill,
                        {
                          width: `${
                            (count / detailedStats.totalSessions || 0) * 100
                          }%`,
                          backgroundColor: getStudyModeColor(mode),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionLabel}>
                    {mode.charAt(0).toUpperCase() +
                      mode.slice(1).replace("_", " ")}
                  </Text>
                  <Text style={styles.distributionValue}>
                    {Math.round(
                      (count / detailedStats.totalSessions || 0) * 100
                    )}
                    %
                  </Text>
                </View>
              )
            )}
          </LinearGradient>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.activityCard}
          >
            {recentActivity.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <View style={styles.activityItem}>
                  <IconButton
                    icon={getStudyModeIcon(activity.study_mode)}
                    size={24}
                    iconColor={getStudyModeColor(activity.study_mode)}
                  />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      {activity.category_name}
                    </Text>
                    <Text style={styles.activitySubtitle}>
                      {activity.study_mode} • {activity.accuracy}% Accuracy •{" "}
                      {activity.cards_studied} cards •{" "}
                      {formatDuration(activity.duration)}
                    </Text>
                  </View>
                </View>
                {index < recentActivity.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "white",
    opacity: 0.7,
  },
  errorText: {
    color: "white",
    fontSize: 16,
  },
  studyDistribution: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  distributionCard: {
    borderRadius: 16,
    padding: 16,
  },
  distributionItem: {
    marginBottom: 16,
  },
  distributionBar: {
    height: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    overflow: "hidden",
  },
  distributionFill: {
    height: "100%",
    borderRadius: 10,
  },
  distributionLabel: {
    fontSize: 14,
    color: "white",
    opacity: 0.7,
    marginTop: 4,
  },
  distributionValue: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  activityContent: {
    flex: 1,
    marginLeft: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  activitySubtitle: {
    fontSize: 14,
    color: "white",
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 16,
  },
});
