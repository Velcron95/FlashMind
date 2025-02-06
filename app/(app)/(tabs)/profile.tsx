import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Button,
  useTheme,
  IconButton,
  Surface,
} from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { authStorage } from "@/lib/utils/authStorage";
import { router } from "expo-router";

interface UserStats {
  streakCount: number;
  totalCards: number;
  cardsLearned: number;
  categoriesCreated: number;
}

export default function ProfileScreen() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    streakCount: 0,
    totalCards: 0,
    cardsLearned: 0,
    categoriesCreated: 0,
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Fetch user data
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");

        // Fetch user statistics
        const { data: flashcards } = await supabase
          .from("flashcards")
          .select("*")
          .eq("user_id", user.id);

        const { data: categories } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id);

        const { data: learnedCards } = await supabase
          .from("flashcards")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_learned", true);

        setStats({
          streakCount: 0, // TODO: Implement streak tracking
          totalCards: flashcards?.length || 0,
          cardsLearned: learnedCards?.length || 0,
          categoriesCreated: categories?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const StatCard = ({
    icon,
    title,
    value,
  }: {
    icon: string;
    title: string;
    value: number;
  }) => (
    <LinearGradient
      colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <IconButton icon={icon} size={24} iconColor="white" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <IconButton
            icon="account-circle"
            size={80}
            iconColor="white"
            style={styles.avatar}
          />
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.planBadge}>Free Plan</Text>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <StatCard icon="fire" title="Day Streak" value={stats.streakCount} />
          <StatCard
            icon="card-text"
            title="Total Cards"
            value={stats.totalCards}
          />
          <StatCard
            icon="check-circle"
            title="Learned"
            value={stats.cardsLearned}
          />
          <StatCard
            icon="folder"
            title="Categories"
            value={stats.categoriesCreated}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => {
              /* TODO: Implement upgrade */
            }}
            style={styles.upgradeButton}
            buttonColor="rgba(255,255,255,0.15)"
            textColor="white"
            labelStyle={styles.buttonLabel}
          >
            Upgrade to Premium
          </Button>

          <Button
            mode="contained"
            onPress={async () => {
              try {
                await supabase.auth.signOut();
                await authStorage.clear();
                router.replace("/auth/sign-in");
              } catch (error) {
                console.error("Error signing out:", error);
              }
            }}
            style={[styles.upgradeButton, styles.logoutButton]}
            buttonColor="rgba(255,59,48,0.15)"
            textColor="#FF3B30"
            labelStyle={styles.buttonLabel}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  profileCard: {
    padding: 24,
    borderRadius: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  avatar: {
    margin: 8,
  },
  email: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  planBadge: {
    color: "white",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  statValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statTitle: {
    color: "white",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  upgradeButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoutButton: {
    borderColor: "rgba(255,59,48,0.3)",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
