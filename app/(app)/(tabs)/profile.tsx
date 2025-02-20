import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Text, Button, IconButton, Portal, Dialog } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { authStorage } from "@/lib/utils/authStorage";
import { router } from "expo-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Add type for auth context
interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  session: {
    user: AuthUser | null;
  } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export default function ProfileScreen() {
  const auth = useAuth() as AuthContextType;
  const user = auth.session?.user; // Correctly access user from session
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setAvatarUrl(profile.avatar_url);
      }

      const { data: tokenData } = await supabase
        .from("user_tokens")
        .select("token_balance")
        .eq("user_id", user.id)
        .single();

      if (tokenData) {
        setTokenBalance(tokenData.token_balance);
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

  // Add permission check for image picker
  const checkImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to change your profile picture."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      if (!user?.id) return;

      const hasPermission = await checkImagePermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        const fileExt = uri.substring(uri.lastIndexOf(".") + 1);
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        if (!base64) {
          throw new Error("Failed to get image data");
        }

        // Convert base64 to blob
        const base64Data = base64.includes("base64,")
          ? base64
          : `data:image/${fileExt};base64,${base64}`;

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from("avatars")
          .upload(fileName, decode(base64Data), {
            contentType: `image/${fileExt}`,
            cacheControl: "3600",
            upsert: true,
          });

        if (error) throw error;

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
          .eq("id", user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        Alert.alert("Success", "Profile picture updated!");
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
      if (!user?.id || !displayName.trim()) {
        Alert.alert("Error", "Please enter a valid name");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setIsEditingName(false);
      Alert.alert("Success", "Name updated successfully!");
    } catch (error) {
      console.error("Error updating name:", error);
      Alert.alert("Error", "Failed to update name. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await authStorage.clearSession();
      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarContainer}
            activeOpacity={0.7} // Add this for better touch feedback
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>
                  {email.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editOverlay}>
              <IconButton icon="camera" size={24} iconColor="white" />
            </View>
          </TouchableOpacity>

          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.nameInput}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={updateDisplayName}
              />
              <IconButton
                icon="check"
                size={24}
                iconColor="white"
                onPress={updateDisplayName}
                style={styles.checkButton}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditingName(true)}
              style={styles.nameContainer}
            >
              <Text style={styles.displayName}>
                {displayName || "Add your name"}
              </Text>
              <IconButton
                icon="pencil"
                size={20}
                iconColor="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          )}

          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <IconButton icon="star" size={32} iconColor="#FFD700" />
            <Text style={styles.statValue}>{tokenBalance}</Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(app)/store/categories")}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.buttonGradient}
            >
              <IconButton icon="store" size={24} iconColor="white" />
              <Text style={styles.buttonText}>Visit Store</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.buttonGradient}
            >
              <IconButton icon="logout" size={24} iconColor="white" />
              <Text style={styles.buttonText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() =>
              Alert.alert(
                "Delete Account",
                "This action cannot be undone. Are you sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => setDeleteDialogVisible(true),
                  },
                ]
              )
            }
          >
            <LinearGradient
              colors={["rgba(255,59,48,0.2)", "rgba(255,59,48,0.1)"]}
              style={styles.buttonGradient}
            >
              <IconButton icon="delete" size={24} iconColor="#FF3B30" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.deleteInput}
              placeholder="Type DELETE to confirm"
              autoCapitalize="characters"
              onChangeText={(text) => {
                if (text === "DELETE") {
                  setDeleteDialogVisible(false);
                  // Handle delete account
                }
              }}
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
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
    width: 120,
    height: 120,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    fontSize: 48,
    color: "white",
    fontWeight: "bold",
  },
  editOverlay: {
    position: "absolute",
    right: -8,
    bottom: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 24,
    padding: 4,
    zIndex: 1, // Add this to ensure the overlay is clickable
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  nameEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
  },
  nameInput: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 200,
    textAlign: "center",
  },
  displayName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  email: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
  },
  statsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    padding: 10,
  },
  statValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  buttonContainer: {
    padding: 20,
    gap: 16,
  },
  button: {
    borderRadius: 15,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  deleteButton: {
    marginTop: 20,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  deleteInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  checkButton: {
    margin: 0,
  },
});

function decode(base64: string): Uint8Array {
  const base64Str = base64.includes("base64,")
    ? base64.split("base64,")[1]
    : base64;
  const binaryStr = atob(base64Str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
