import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Modal } from "react-native";
import { Text, Card, IconButton, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@/features/user/context/UserContext";

interface StudyStats {
  totalCards: number;
  totalStudyTime: number;
  averageAccuracy: number;
  streak: number;
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
  cardsStudied: number;
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

// Update Achievement interface
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

// Expanded achievements array
const achievements: Achievement[] = [
  {
    id: "FIRST_STUDY",
    title: "First Steps",
    description: "Complete your first study session",
    progress: 0,
    maxProgress: 1,
    icon: "school",
    unlocked: false,
  },
  {
    id: "CARD_COLLECTOR",
    title: "Card Collector",
    description: "Create 100 flashcards",
    progress: 0,
    maxProgress: 100,
    icon: "cards",
    unlocked: false,
  },
  {
    id: "LEARNING_STREAK",
    title: "Consistent Learner",
    description: "Maintain a 3-day study streak",
    progress: 0,
    maxProgress: 3,
    icon: "fire",
    unlocked: false,
  },
  {
    id: "MASTER_LEARNER",
    title: "Master Learner",
    description: "Mark 50 cards as learned",
    progress: 0,
    maxProgress: 50,
    icon: "star",
    unlocked: false,
  },
  {
    id: "FIRST_CATEGORY",
    title: "Getting Started",
    description: "Create your first category",
    progress: 0,
    maxProgress: 1,
    icon: "folder",
    unlocked: false,
  },
];

// Update the interface to match the actual data structure
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

export default function StatsScreen() {
  // Add mounted ref to prevent state updates after unmount
  const isMounted = useRef(true);

  const [stats, setStats] = useState<StudyStats>({
    totalCards: 0,
    totalStudyTime: 0,
    averageAccuracy: 0,
    streak: 0,
  });

  // Add studyModeStats to prevent undefined access
  const [detailedStats, setDetailedStats] = useState<DetailedStats>({
    totalCards: 0,
    totalStudyTime: 0,
    averageAccuracy: 0,
    streak: 0,
    totalSessions: 0,
    cardsStudied: 0,
    bestStreak: 0,
    studyModeStats: {
      classic: 0,
      truefalse: 0,
      multiple_choice: 0,
    },
  });

  // Add state for recent activity
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const { userData } = useUser();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStats = async () => {
    try {
      if (!userData.id || !isMounted.current) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get total cards from flashcards table
      const { data: flashcards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id);

      // Get study sessions for other stats
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!sessions) return;

      // Calculate streak
      let currentStreak = 0;
      let bestStreak = 0;

      // Get unique dates of study sessions
      const studyDates = [
        ...new Set(
          sessions.map(
            (session) =>
              new Date(session.created_at).toISOString().split("T")[0]
          )
        ),
      ]
        .sort()
        .reverse();

      // Calculate current streak
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // Check if studied today or yesterday to start streak
      if (studyDates[0] === today || studyDates[0] === yesterday) {
        currentStreak = 1;

        // Check consecutive days
        for (let i = 1; i < studyDates.length; i++) {
          const currentDate = new Date(studyDates[i]);
          const previousDate = new Date(studyDates[i - 1]);
          const dayDifference = Math.floor(
            (previousDate.getTime() - currentDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (dayDifference === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Update best streak if current is higher
      bestStreak = Math.max(
        currentStreak,
        sessions.reduce((max, session) => Math.max(max, session.streak || 0), 0)
      );

      // Calculate study stats
      const cardsStudied = sessions.reduce(
        (sum, session) => sum + (session.cards_reviewed || 0),
        0
      );

      const totalTime = sessions.reduce(
        (sum, session) => sum + (session.duration || 0),
        0
      );

      const averageAccuracy = sessions.length
        ? sessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) /
          sessions.length
        : 0;

      // Update stats state
      if (isMounted.current) {
        setStats({
          totalCards: flashcards?.length || 0,
          totalStudyTime: Math.floor(totalTime / 60),
          averageAccuracy: Math.round(averageAccuracy),
          streak: currentStreak,
        });
      }

      // Get study sessions for mode stats
      const { data: modeSessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id);

      if (modeSessions && isMounted.current) {
        // Calculate study mode stats
        const modeStats = modeSessions.reduce(
          (acc, session) => {
            const mode = session.study_mode as keyof typeof acc;
            if (mode) {
              acc[mode]++;
            }
            return acc;
          },
          { classic: 0, truefalse: 0, multiple_choice: 0 }
        );

        setDetailedStats((prev) => ({
          ...prev,
          totalSessions: modeSessions.length,
          studyModeStats: modeStats,
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Add utility functions at the top of the file
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

  // Update the fetchRecentActivity function
  const fetchRecentActivity = async () => {
    if (!userData.id || !isMounted.current) return;

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
        .eq("user_id", userData.id)
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

  const fetchWeeklyProgress = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days of study sessions
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at");

      if (sessions) {
        // Group sessions by day and calculate average accuracy
        const dailyStats = Array(7)
          .fill(0)
          .map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dayStr = date.toISOString().split("T")[0];

            const daysSessions = sessions.filter((s) =>
              s.created_at.startsWith(dayStr)
            );

            if (daysSessions.length === 0) return 0;

            const totalAccuracy = daysSessions.reduce(
              (acc, session) => acc + session.accuracy,
              0
            );
            return Math.round(totalAccuracy / daysSessions.length);
          });

        // ... rest of the fetchWeeklyProgress code ...
      }
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
    }
  };

  const calculateStreak = (sessions: StudySession[]) => {
    if (!sessions.length) return 0;

    // Sort sessions by date, newest first
    const sortedSessions = sessions
      .map((s) => s.created_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Check if studied today
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

  const processWeeklyData = (sessions: StudySession[]) => {
    return Array(7)
      .fill(0)
      .map((_, i) => {
        const daySessions = sessions.filter(
          (s) => new Date(s.created_at).getDay() === i
        );
        if (daySessions.length === 0) return 0;

        const dayCorrect = daySessions.reduce(
          (acc, s) => acc + (s.correct_answers || 0),
          0
        );
        const dayTotal = daySessions.reduce(
          (acc, s) =>
            acc + ((s.correct_answers || 0) + (s.incorrect_answers || 0)),
          0
        );

        return dayTotal > 0 ? Math.round((dayCorrect / dayTotal) * 100) : 0;
      });
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const isToday = (date: string) => {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };

  const isConsecutiveDay = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  // Use useFocusEffect instead of useEffect for tab navigation
  useFocusEffect(
    useCallback(() => {
      if (isMounted.current) {
        fetchStats();
        fetchRecentActivity();
        fetchWeeklyProgress();
      }

      return () => {
        // Cleanup any subscriptions or pending state updates
      };
    }, [userData.id])
  );

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Statistics</Text>

        {/* Overview Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <IconButton icon="cards" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats.totalCards}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <IconButton icon="clock-outline" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats.totalStudyTime}m</Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <IconButton icon="check-circle" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats.averageAccuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <IconButton icon="fire" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>
        </View>

        {/* Study Time Distribution */}
        <View style={styles.studyDistribution}>
          <Text style={styles.sectionTitle}>Study Time by Mode</Text>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.distributionCard}
          >
            <View style={styles.distributionItem}>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${
                        (detailedStats.studyModeStats.classic /
                          detailedStats.totalSessions || 0) * 100
                      }%`,
                      backgroundColor: "#4CAF50",
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionLabel}>Classic</Text>
              <Text style={styles.distributionValue}>
                {Math.round(
                  (detailedStats.studyModeStats.classic /
                    detailedStats.totalSessions || 0) * 100
                )}
                %
              </Text>
            </View>

            <View style={styles.distributionItem}>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${
                        (detailedStats.studyModeStats.truefalse /
                          detailedStats.totalSessions || 0) * 100
                      }%`,
                      backgroundColor: "#2196F3",
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionLabel}>True/False</Text>
              <Text style={styles.distributionValue}>
                {Math.round(
                  (detailedStats.studyModeStats.truefalse /
                    detailedStats.totalSessions || 0) * 100
                )}
                %
              </Text>
            </View>

            <View style={styles.distributionItem}>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${
                        (detailedStats.studyModeStats.multiple_choice /
                          detailedStats.totalSessions || 0) * 100
                      }%`,
                      backgroundColor: "#9C27B0",
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionLabel}>Multiple Choice</Text>
              <Text style={styles.distributionValue}>
                {Math.round(
                  (detailedStats.studyModeStats.multiple_choice /
                    detailedStats.totalSessions || 0) * 100
                )}
                %
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activityCard}
          >
            {recentActivity.map((activity: RecentActivity, index: number) => (
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
                  <Text style={styles.activityTime}>
                    {formatTimeAgo(activity.created_at)}
                  </Text>
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
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 40,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
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
  studyDistribution: {
    marginBottom: 24,
  },
  distributionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  distributionItem: {
    marginBottom: 12,
  },
  distributionBar: {
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 4,
  },
  distributionFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#FFC107",
  },
  distributionLabel: {
    fontSize: 12,
    color: "white",
    opacity: 0.7,
    textAlign: "center",
  },
  distributionValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  recentActivity: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 16,
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
    marginLeft: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  activitySubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  activityTime: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 12,
  },
});
