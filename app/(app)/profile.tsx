import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Button,
  Avatar,
  Surface,
  ActivityIndicator,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";
import { router } from "expo-router";
import { authStorage } from "@/lib/utils/authStorage";
import type { Category } from "@/types/database";
import type { Flashcard } from "@/features/cards/types/cards";

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    categories: 0,
    cards: 0,
    learned: 0,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      setUserEmail(user.email || null);

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id);

      if (categoriesError) throw categoriesError;

      // Fetch all flashcards
      const { data: flashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id);

      if (flashcardsError) throw flashcardsError;

      setStats({
        categories: categories?.length || 0,
        cards: flashcards?.length || 0,
        learned: flashcards?.filter((card) => card.is_learned).length || 0,
      });
    } catch (error) {
      console.error("[Profile] Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      await authStorage.clear();
      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("[Profile] Error signing out:", error);
    }
  };

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Surface style={styles.profileCard}>
        <Avatar.Icon
          size={80}
          icon="account"
          style={styles.avatar}
          color="white"
        />
        <Text variant="headlineSmall" style={styles.email}>
          {userEmail || "Loading..."}
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loading} color="white" />
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={styles.statNumber}>
                {stats.categories}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Categories
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={styles.statNumber}>
                {stats.cards}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Cards
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={styles.statNumber}>
                {stats.learned}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Learned
              </Text>
            </View>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          buttonColor="rgba(255, 255, 255, 0.2)"
          textColor="white"
          icon="logout"
        >
          Sign Out
        </Button>
      </Surface>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatar: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 16,
  },
  email: {
    color: "white",
    textAlign: "center",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "white",
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  signOutButton: {
    width: "100%",
  },
  loading: {
    marginVertical: 24,
  },
});
