import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  List,
  Switch,
  Button,
  Portal,
  Dialog,
  TextInput,
  HelperText,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase/supabaseClient";
import { usePremium } from "../../hooks/usePremium";
import * as Linking from "expo-linking";

interface Settings {
  darkMode: boolean;
  notifications: boolean;
  textToSpeech: boolean;
  autoPlayAudio: boolean;
  cardFlipAnimation: boolean;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { isPremium } = usePremium();
  const [settings, setSettings] = useState<Settings>({
    darkMode: false,
    notifications: true,
    textToSpeech: true,
    autoPlayAudio: false,
    cardFlipAnimation: true,
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggleSetting = async (key: keyof Settings) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const newValue = !settings[key];
      const { error: updateError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          [key]: newValue,
        });

      if (updateError) throw updateError;

      setSettings((prev) => ({
        ...prev,
        [key]: newValue,
      }));
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to update setting"
      );
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setShowPasswordDialog(false);
      Alert.alert("Success", "Password updated successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error: deleteError } = await supabase.auth.signOut();
              if (deleteError) throw deleteError;

              router.replace("/auth/sign-in");
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Failed to delete account"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>

        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={settings.darkMode}
                onValueChange={() => handleToggleSetting("darkMode")}
              />
            )}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Study</List.Subheader>
          <List.Item
            title="Text-to-Speech"
            description={!isPremium ? "Premium feature" : undefined}
            left={(props) => <List.Icon {...props} icon="text-to-speech" />}
            right={() => (
              <Switch
                value={settings.textToSpeech && isPremium}
                onValueChange={() => handleToggleSetting("textToSpeech")}
                disabled={!isPremium}
              />
            )}
          />
          <List.Item
            title="Auto-Play Audio"
            left={(props) => <List.Icon {...props} icon="play-circle" />}
            right={() => (
              <Switch
                value={settings.autoPlayAudio}
                onValueChange={() => handleToggleSetting("autoPlayAudio")}
              />
            )}
          />
          <List.Item
            title="Card Flip Animation"
            left={(props) => <List.Icon {...props} icon="rotate-3d" />}
            right={() => (
              <Switch
                value={settings.cardFlipAnimation}
                onValueChange={() => handleToggleSetting("cardFlipAnimation")}
              />
            )}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Change Password"
            left={(props) => <List.Icon {...props} icon="key" />}
            onPress={() => setShowPasswordDialog(true)}
          />
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={() => Linking.openURL("https://yourapp.com/privacy")}
          />
          <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => Linking.openURL("https://yourapp.com/terms")}
          />
        </List.Section>

        <View style={styles.dangerZone}>
          <Text variant="titleMedium" style={styles.dangerTitle}>
            Danger Zone
          </Text>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={[styles.deleteButton, { borderColor: theme.colors.error }]}
            onPress={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showPasswordDialog}
          onDismiss={() => setShowPasswordDialog(false)}
        >
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
            />
            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading}
            >
              Update
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  dangerZone: {
    marginTop: 32,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#FFF1F0",
  },
  dangerTitle: {
    color: "#FF4D4F",
    marginBottom: 16,
  },
  deleteButton: {
    borderWidth: 2,
  },
});
