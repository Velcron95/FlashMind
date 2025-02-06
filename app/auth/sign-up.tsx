import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
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
} from "react-native-paper";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";

export default function SignUpScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setLoading(false);
    setShowPassword(false);
  }, []);

  const validateForm = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password.trim() !== confirmPassword.trim()) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: { email: email.trim() },
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("No user data returned");

      router.push({
        pathname: "/auth/verify-email",
        params: { email: email.trim() },
      });
    } catch (e) {
      console.error("Sign up error:", e);
      setError(e instanceof Error ? e.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignIn = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    router.push("/auth/sign-in");
  }, []);

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
  });

  return (
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
                Sign up.
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Create your account
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
                  <TextInput.Icon icon="email" color="rgba(255,255,255,0.9)" />
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

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                mode="flat"
                style={styles.input}
                disabled={loading}
                left={
                  <TextInput.Icon
                    icon="lock-check"
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
                onPress={handleSignUp}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                loading={loading}
                disabled={loading}
                buttonColor="rgba(255,255,255,0.15)"
                textColor="white"
              >
                Create Account
              </Button>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Button
                  mode="text"
                  compact
                  onPress={navigateToSignIn}
                  textColor="white"
                  labelStyle={styles.linkText}
                >
                  Login
                </Button>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
