import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  useTheme,
  Surface,
  Portal,
  Modal,
  Checkbox,
} from "react-native-paper";
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import ResetPasswordModal from "../../components/ResetPasswordModal";
import { authStorage } from "@/lib/utils/authStorage";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    borderRadius: 28,
    padding: 32,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerContainer: {
    marginBottom: 36,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    height: 56,
  },
  inputContent: {
    paddingVertical: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "transparent",
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    transform: [{ translateY: -200 }],
  },
  modalContent: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#4158D0",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },
  modalButtons: {
    marginTop: 24,
    gap: 12,
  },
  successText: {
    color: "#4ECDC4",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
  },
  checkboxLabel: {
    color: "rgba(255,255,255,0.7)",
    marginLeft: 8,
    fontSize: 14,
  },
});

export default function SignInScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  // Reset states when screen is focused
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
    setShowPassword(false);
  }, []);

  const handleSignIn = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      // Save persist state if "keep me logged in" is checked
      if (keepLoggedIn) {
        await authStorage.setPersist(true);
      } else {
        await authStorage.setPersist(false);
      }

      router.replace("/(app)");
    } catch (e) {
      console.error("Error signing in:", e);
      setError(e instanceof Error ? e.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = useCallback(() => {
    setEmail("");
    setPassword("");
    setError(null);
    router.push("/auth/sign-up");
  }, []);

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim(),
        {
          redirectTo: window.location.origin + "/auth/update-password",
        }
      );

      if (error) throw error;

      setResetSuccess(true);
    } catch (e) {
      console.error("Error resetting password:", e);
      setResetError(
        e instanceof Error ? e.message : "Failed to send reset email"
      );
    } finally {
      setResetLoading(false);
    }
  };

  // Memoize handlers
  const handleEmailChange = useCallback((text: string) => {
    setResetEmail(text);
  }, []);

  const handleModalDismiss = useCallback(() => {
    setResetPasswordVisible(false);
    setResetError(null);
    setResetSuccess(false);
  }, []);

  return (
    <>
      <LinearGradient
        colors={["#FF6B6B", "#4158D0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.headerContainer}>
                <Text variant="displaySmall" style={styles.title}>
                  Login.
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                  Welcome Back
                </Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="flat"
                  style={styles.input}
                  disabled={loading}
                  left={
                    <TextInput.Icon
                      icon="email"
                      color="rgba(255,255,255,0.9)"
                    />
                  }
                  textColor="white"
                  theme={{
                    colors: {
                      onSurfaceVariant: "rgba(255,255,255,0.9)",
                      placeholder: "rgba(255,255,255,0.5)",
                    },
                  }}
                  contentStyle={styles.inputContent}
                  underlineColor="rgba(255,255,255,0.2)"
                  activeUnderlineColor="white"
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  mode="flat"
                  style={styles.input}
                  disabled={loading}
                  left={
                    <TextInput.Icon icon="lock" color="rgba(255,255,255,0.9)" />
                  }
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                      color="rgba(255,255,255,0.9)"
                    />
                  }
                  textColor="white"
                  theme={{
                    colors: {
                      onSurfaceVariant: "rgba(255,255,255,0.9)",
                      placeholder: "rgba(255,255,255,0.5)",
                    },
                  }}
                  contentStyle={styles.inputContent}
                  underlineColor="rgba(255,255,255,0.2)"
                  activeUnderlineColor="white"
                />

                <View style={styles.checkboxContainer}>
                  <Checkbox.Android
                    status={keepLoggedIn ? "checked" : "unchecked"}
                    onPress={() => setKeepLoggedIn(!keepLoggedIn)}
                    color="white"
                  />
                  <Text style={styles.checkboxLabel}>Keep me logged in</Text>
                </View>

                <Button
                  mode="text"
                  onPress={() => {
                    setResetPasswordVisible(true);
                    setResetEmail(email); // Pre-fill with current email
                  }}
                  style={styles.forgotPassword}
                  labelStyle={styles.forgotPasswordText}
                  textColor="rgba(255,255,255,0.7)"
                >
                  Forgot Password?
                </Button>

                {error && (
                  <HelperText
                    type="error"
                    visible={!!error}
                    style={styles.errorText}
                  >
                    {error}
                  </HelperText>
                )}

                <Button
                  mode="contained"
                  onPress={handleSignIn}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  loading={loading}
                  disabled={loading}
                  buttonColor="rgba(255,255,255,0.15)"
                  textColor="white"
                >
                  Login
                </Button>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>New user? </Text>
                  <Button
                    mode="text"
                    compact
                    onPress={navigateToSignUp}
                    textColor="white"
                    labelStyle={styles.linkText}
                  >
                    Sign up
                  </Button>
                </View>
              </View>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Portal>
        <ResetPasswordModal
          visible={resetPasswordVisible}
          onDismiss={handleModalDismiss}
          email={resetEmail}
          onEmailChange={handleEmailChange}
          onSubmit={handleResetPassword}
          loading={resetLoading}
          error={resetError}
          success={resetSuccess}
        />
      </Portal>
    </>
  );
}
