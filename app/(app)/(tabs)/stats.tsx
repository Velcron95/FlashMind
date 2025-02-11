import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Modal } from "react-native";
import { Text, Card, IconButton, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useFocusEffect } from "@react-navigation/native";

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
  progress: number;
  goal: number;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  completed?: boolean;
}

// Expanded achievements array
const achievements: Achievement[] = [
  // Study Dedication
  {
    id: "first_study",
    title: "First Steps",
    description: "Complete your first study session",
    progress: 0,
    goal: 1,
    icon: "school",
    tier: "bronze",
  },
  {
    id: "cards_studied_bronze",
    title: "Card Novice",
    description: "Study 100 flashcards",
    progress: 0,
    goal: 100,
    icon: "cards",
    tier: "bronze",
  },
  {
    id: "cards_studied_silver",
    title: "Card Expert",
    description: "Study 500 flashcards",
    progress: 0,
    goal: 500,
    icon: "cards",
    tier: "silver",
  },
  {
    id: "cards_studied_gold",
    title: "Card Master",
    description: "Study 1000 flashcards",
    progress: 0,
    goal: 1000,
    icon: "cards",
    tier: "gold",
  },

  // Streaks
  {
    id: "streak_bronze",
    title: "Consistent Learner",
    description: "Maintain a 7-day study streak",
    progress: 0,
    goal: 7,
    icon: "fire",
    tier: "bronze",
  },
  {
    id: "streak_silver",
    title: "Dedicated Scholar",
    description: "Maintain a 30-day study streak",
    progress: 0,
    goal: 30,
    icon: "fire",
    tier: "silver",
  },
  {
    id: "streak_gold",
    title: "Learning Legend",
    description: "Maintain a 100-day study streak",
    progress: 0,
    goal: 100,
    icon: "fire",
    tier: "gold",
  },

  // Accuracy
  {
    id: "accuracy_bronze",
    title: "Sharp Mind",
    description: "Achieve 80% accuracy in a session",
    progress: 0,
    goal: 80,
    icon: "target",
    tier: "bronze",
  },
  {
    id: "accuracy_silver",
    title: "Memory Master",
    description: "Achieve 90% accuracy in a session",
    progress: 0,
    goal: 90,
    icon: "target",
    tier: "silver",
  },
  {
    id: "accuracy_gold",
    title: "Perfect Scholar",
    description: "Achieve 100% accuracy in a session",
    progress: 0,
    goal: 100,
    icon: "target",
    tier: "gold",
  },

  // Session Completion
  {
    id: "sessions_bronze",
    title: "Study Enthusiast",
    description: "Complete 10 study sessions",
    progress: 0,
    goal: 10,
    icon: "book-open-variant",
    tier: "bronze",
  },
  {
    id: "sessions_silver",
    title: "Study Pro",
    description: "Complete 50 study sessions",
    progress: 0,
    goal: 50,
    icon: "book-open-variant",
    tier: "silver",
  },
  {
    id: "sessions_gold",
    title: "Study Champion",
    description: "Complete 100 study sessions",
    progress: 0,
    goal: 100,
    icon: "book-open-variant",
    tier: "gold",
  },
];

// Add helper function to get tier color
const getTierColor = (tier: Achievement["tier"]) => {
  switch (tier) {
    case "bronze":
      return "#CD7F32";
    case "silver":
      return "#C0C0C0";
    case "gold":
      return "#FFD700";
    default:
      return "#4CAF50";
  }
};

export default function StatsScreen() {
  // Move hooks inside component
  const [completedAchievements, setCompletedAchievements] = useState<string[]>(
    []
  );
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] =
    useState<Achievement | null>(null);

  const [stats, setStats] = useState<DetailedStats>({
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      },
    ],
  });

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    fetchWeeklyProgress();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
      fetchRecentActivity();
      fetchWeeklyProgress();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch total cards
      const { data: cards } = await supabase
        .from("flashcards")
        .select("id")
        .eq("user_id", user.id);

      console.log("Total cards:", cards?.length);

      // Fetch all study sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
        return;
      }

      console.log("Study sessions:", sessions);

      if (sessions) {
        // Log each calculation
        const totalTime = sessions.reduce(
          (acc, session) => acc + (session.duration || 0),
          0
        );
        console.log("Total time:", totalTime);

        const totalCorrect = sessions.reduce(
          (acc, session) => acc + (session.correct_answers || 0),
          0
        );
        console.log("Total correct:", totalCorrect);

        const totalAnswers = sessions.reduce(
          (acc, session) =>
            acc +
            ((session.correct_answers || 0) + (session.incorrect_answers || 0)),
          0
        );
        console.log("Total answers:", totalAnswers);

        // Log mode stats calculation
        const modeStats = sessions.reduce((acc, session) => {
          if (session.study_mode) {
            acc[session.study_mode] = (acc[session.study_mode] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        console.log("Mode stats:", modeStats);

        const cardsStudied = sessions.reduce(
          (acc, session) => acc + (session.cards_reviewed || 0),
          0
        );
        console.log("Cards studied:", cardsStudied);

        const currentStreak = calculateStreak(sessions);
        console.log("Current streak:", currentStreak);

        const accuracy =
          totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

        setStats({
          totalCards: cards?.length || 0,
          totalStudyTime: Math.round(totalTime / 60),
          averageAccuracy: Math.round(accuracy),
          streak: currentStreak,
          totalSessions: sessions.length,
          cardsStudied,
          bestStreak: Math.max(currentStreak, stats.bestStreak),
          studyModeStats: {
            classic: modeStats.classic || 0,
            truefalse: modeStats.truefalse || 0,
            multiple_choice: modeStats.multiple_choice || 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: activities, error } = await supabase
        .from("study_sessions")
        .select(
          `
          id,
          category_id,
          category:category_id (
            name
          ),
          study_mode,
          accuracy,
          cards_reviewed,
          created_at
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }

      if (activities) {
        setRecentActivity(
          activities.map((activity: any) => ({
            id: activity.id,
            category_name: activity.category?.name || "Unknown Category",
            study_mode: formatStudyMode(activity.study_mode),
            accuracy: Number((activity.accuracy || 0).toFixed(1)),
            cards_studied: activity.cards_reviewed || 0,
            created_at: activity.created_at,
          }))
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

        setWeeklyData({
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              data: dailyStats,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            },
          ],
        });
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

  const formatStudyMode = (mode: string): string => {
    switch (mode) {
      case "classic":
        return "Classic Review";
      case "truefalse":
        return "True/False";
      case "multiple_choice":
        return "Multiple Choice";
      default:
        return mode;
    }
  };

  const getStudyModeIcon = (mode: string): string => {
    switch (mode) {
      case "classic":
        return "cards";
      case "truefalse":
        return "check-circle";
      case "multiple_choice":
        return "format-list-checks";
      default:
        return "school";
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

  // Move updateAchievements function inside
  const updateAchievements = (stats: DetailedStats) => {
    const updatedAchievements = achievements.map((achievement) => {
      let progress = 0;

      switch (achievement.id) {
        case "first_study":
          progress = stats.totalSessions > 0 ? 1 : 0;
          break;
        case "cards_studied_bronze":
        case "cards_studied_silver":
        case "cards_studied_gold":
          progress = stats.cardsStudied;
          break;
        case "streak_bronze":
        case "streak_silver":
        case "streak_gold":
          progress = stats.streak;
          break;
        case "accuracy_bronze":
        case "accuracy_silver":
        case "accuracy_gold":
          progress = stats.averageAccuracy;
          break;
        case "sessions_bronze":
        case "sessions_silver":
        case "sessions_gold":
          progress = stats.totalSessions;
          break;
      }

      const updatedAchievement = { ...achievement, progress };

      // Check if achievement was just completed
      if (
        progress >= achievement.goal &&
        !completedAchievements.includes(achievement.id)
      ) {
        setCompletedAchievements((prev) => [...prev, achievement.id]);
        setCurrentAchievement(updatedAchievement);
        setShowAchievementModal(true);
      }

      return updatedAchievement;
    });

    return updatedAchievements;
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

  // Move achievement modal component inside
  const AchievementModal = () => (
    <Modal
      visible={showAchievementModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAchievementModal(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
          style={styles.modalContent}
        >
          <IconButton
            icon={currentAchievement?.icon || "trophy"}
            size={48}
            iconColor={getTierColor(currentAchievement?.tier || "bronze")}
          />
          <Text style={styles.modalTitle}>Achievement Unlocked!</Text>
          <Text style={styles.modalAchievementTitle}>
            {currentAchievement?.title}
          </Text>
          <Text style={styles.modalDescription}>
            {currentAchievement?.description}
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowAchievementModal(false)}
            style={styles.modalButton}
          >
            Awesome!
          </Button>
        </LinearGradient>
      </View>
    </Modal>
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

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <IconButton icon="school" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats.cardsStudied}</Text>
            <Text style={styles.statLabel}>Cards Studied</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <IconButton icon="book-open-variant" size={28} iconColor="white" />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Study Sessions</Text>
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
                        (stats.studyModeStats.classic / stats.totalSessions) *
                        100
                      }%`,
                      backgroundColor: "#4CAF50",
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionLabel}>Classic</Text>
              <Text style={styles.distributionValue}>
                {Math.round(
                  (stats.studyModeStats.classic / stats.totalSessions) * 100
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
                        (stats.studyModeStats.truefalse / stats.totalSessions) *
                        100
                      }%`,
                      backgroundColor: "#2196F3",
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionLabel}>True/False</Text>
              <Text style={styles.distributionValue}>
                {Math.round(
                  (stats.studyModeStats.truefalse / stats.totalSessions) * 100
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
                        (stats.studyModeStats.multiple_choice /
                          stats.totalSessions) *
                        100
                      }%`,
                      backgroundColor: "#9C27B0",
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionLabel}>Multiple Choice</Text>
              <Text style={styles.distributionValue}>
                {Math.round(
                  (stats.studyModeStats.multiple_choice / stats.totalSessions) *
                    100
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
                      {activity.cards_studied} cards
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

        {/* Add study mode breakdown */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementsCard}
          >
            {updateAchievements(stats).map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View style={styles.achievementHeader}>
                  <IconButton
                    icon={achievement.icon}
                    size={24}
                    iconColor={getTierColor(achievement.tier)}
                  />
                  <View style={styles.achievementTitles}>
                    <Text style={styles.achievementTitle}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(
                            (achievement.progress / achievement.goal) * 100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {achievement.progress}/{achievement.goal}
                  </Text>
                </View>
              </View>
            ))}
          </LinearGradient>
        </View>
      </ScrollView>
      <AchievementModal />
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
  achievementsContainer: {
    marginBottom: 24,
  },
  achievementsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  achievementItem: {
    marginBottom: 16,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  achievementTitles: {
    flex: 1,
    marginLeft: 8,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  achievementDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "white",
    opacity: 0.7,
    minWidth: 45,
    textAlign: "right",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "rgba(30, 30, 30, 0.9)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 8,
  },
  modalAchievementTitle: {
    fontSize: 18,
    color: "white",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    width: "100%",
  },
});
