import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Text, Button, IconButton, Portal, Dialog } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { authStorage } from "@/lib/utils/authStorage";
import { router } from "expo-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumManagementService } from "@/features/premium/services/premiumManagementService";
import * as ImagePicker from "expo-image-picker";

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      if (user) {
        setEmail(user.email || "");
        const premiumStatus =
          await PremiumManagementService.getUserPremiumStatus(user.id);
        setIsPremium(premiumStatus);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setDisplayName(profile.display_name || "");
          setAvatarUrl(profile.avatar_url);
        }
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await authStorage.clear();
      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) return;

      await Promise.all([
        supabase.from("flashcards").delete().eq("user_id", user.id),
        supabase.from("categories").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("id", user.id),
      ]);

      await supabase.auth.admin.deleteUser(user.id);
      await supabase.auth.signOut();
      await authStorage.clear();

      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert(
        "Error",
        "Failed to delete account. Please try again or contact support."
      );
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        const fileExt = uri.substring(uri.lastIndexOf(".") + 1);
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

        // Create FormData instead of Blob
        const formData = new FormData();
        formData.append("file", {
          uri,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from("avatars")
          .upload(fileName, formData, {
            contentType: `image/${fileExt}`,
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          console.error("Upload error:", error);
          throw error;
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user?.id);

        if (updateError) {
          console.error("Profile update error:", updateError);
          throw updateError;
        }

        setAvatarUrl(publicUrl);
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(
        "Error",
        "Failed to update profile picture. Please try again."
      );
    }
  };

  const updateDisplayName = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user?.id);

      if (error) throw error;
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
      Alert.alert("Error", "Failed to update display name");
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
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <IconButton
                icon="account-circle"
                size={80}
                iconColor="white"
                style={styles.avatar}
              />
            )}
            <View style={styles.editOverlay}>
              <IconButton icon="camera" size={20} iconColor="white" />
            </View>
          </TouchableOpacity>

          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.nameInput}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <IconButton
                icon="check"
                size={20}
                iconColor="white"
                onPress={updateDisplayName}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingName(true)}>
              <Text style={styles.displayName}>
                {displayName || "Add your name"}
              </Text>
            </TouchableOpacity>
          )}

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

        <View style={styles.buttonContainer}>
          {!isPremium && (
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
            onPress={handleLogout}
            style={styles.upgradeButton}
            buttonColor="rgba(255,255,255,0.15)"
            textColor="white"
            labelStyle={styles.buttonLabel}
          >
            Logout
          </Button>

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
  avatarContainer: {
    position: "relative",
    marginVertical: 16,
  },
  avatar: {
    margin: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  editOverlay: {
    position: "absolute",
    right: -8,
    bottom: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 4,
  },
  nameEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  nameInput: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 150,
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
  displayName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
