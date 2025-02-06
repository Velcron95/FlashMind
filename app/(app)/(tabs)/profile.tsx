import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, TextInput } from "react-native";
import {
  Text,
  Button,
  useTheme,
  IconButton,
  Surface,
  Portal,
  Dialog,
  Paragraph,
} from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { authStorage } from "@/lib/utils/authStorage";
import { router } from "expo-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumManagementService } from "@/features/premium/services/premiumManagementService";

interface UserStats {
  streakCount: number;
  totalCards: number;
  cardsLearned: number;
  categoriesCreated: number;
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    streakCount: 0,
    totalCards: 0,
    cardsLearned: 0,
    categoriesCreated: 0,
  });
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      if (user) {
        setEmail(user.email || "");

        // Check premium status
        const premiumStatus =
          await PremiumManagementService.getUserPremiumStatus(user.id);
        setIsPremium(premiumStatus);
        console.log("[Profile] Premium status:", premiumStatus);

        // Fetch other stats...
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
      console.error("Error refreshing profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [user])
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

  const showDeleteConfirmation = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account?\n\nThis will:\n• Delete all your flashcards\n• Delete all your categories\n• Remove all your data\n• Cancel any premium features\n\nThis action cannot be undone and no refunds will be provided.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, I understand",
          style: "destructive",
          onPress: showFinalWarning,
        },
      ]
    );
  };

  const showFinalWarning = () => {
    Alert.alert(
      "Final Warning",
      "Are you absolutely sure?\n\nThis will permanently delete your account and all associated data.\n\nType DELETE to confirm.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Type DELETE",
          style: "destructive",
          onPress: () => setDeleteDialogVisible(true),
        },
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      if (!user) return;

      // Delete all user data
      await Promise.all([
        // Delete flashcards
        supabase.from("flashcards").delete().eq("user_id", user.id),
        // Delete categories
        supabase.from("categories").delete().eq("user_id", user.id),
        // Delete profile
        supabase.from("profiles").delete().eq("id", user.id),
      ]);

      // Delete auth user and sign out
      await supabase.auth.admin.deleteUser(user.id);
      await supabase.auth.signOut();
      await authStorage.clear();

      // Navigate to sign in
      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert(
        "Error",
        "Failed to delete account. Please try again or contact support."
      );
    }
  };

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
          {isPremium ? (
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBadge}
            >
              <Text style={styles.premiumText}>Premium User</Text>
              <View style={styles.glow} />
            </LinearGradient>
          ) : (
            <View style={styles.freePlan}>
              <Text style={styles.freePlanText}>Free Plan</Text>
            </View>
          )}
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
          {isPremium ? (
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
              style={styles.upgradeButton}
              buttonColor="rgba(255,255,255,0.15)"
              textColor="white"
              labelStyle={styles.buttonLabel}
            >
              Logout
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => router.push("/premium/subscribe")}
              style={styles.upgradeButton}
              buttonColor="rgba(255,255,255,0.15)"
              textColor="white"
              labelStyle={styles.buttonLabel}
            >
              Upgrade to Premium
            </Button>
          )}

          <Button
            mode="contained"
            onPress={showDeleteConfirmation}
            style={[styles.upgradeButton, styles.deleteButton]}
            buttonColor="rgba(255,59,48,0.15)"
            textColor="#FF3B30"
            labelStyle={styles.buttonLabel}
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Type DELETE to confirm</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.deleteInput}
              onChangeText={(text) => {
                if (text.toUpperCase() === "DELETE") {
                  setDeleteDialogVisible(false);
                  deleteAccount();
                }
              }}
              placeholder="Type DELETE in all caps"
              autoCapitalize="characters"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  premiumBadge: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  premiumText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 8,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  freePlan: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  freePlanText: {
    color: "#666",
    fontSize: 16,
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
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  deleteButton: {
    marginTop: 24,
    borderColor: "rgba(255,59,48,0.3)",
  },
  deleteInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
  },
});
