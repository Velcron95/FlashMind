import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { Link, useLocalSearchParams } from "expo-router";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/FlashMind.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Icon
          name="email-check"
          size={64}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Check Your Email
        </Text>
        <Text variant="bodyLarge" style={styles.description}>
          We've sent a verification link to{"\n"}
          <Text style={{ color: theme.colors.primary }}>{email}</Text>
        </Text>
        <Text variant="bodyMedium" style={styles.instruction}>
          Click the link in the email to verify your account. If you don't see
          it, check your spam folder.
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/auth/sign-in" asChild>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={{ color: theme.colors.onPrimary }}
          >
            Return to Sign In
          </Button>
        </Link>
        <Button
          mode="text"
          onPress={() => {
            // TODO: Implement resend verification email
          }}
          style={styles.resendButton}
        >
          Resend Verification Email
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  content: {
    alignItems: "center",
    marginTop: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: 16,
  },
  instruction: {
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: 32,
  },
  actions: {
    marginBottom: 32,
  },
  button: {
    marginBottom: 8,
  },
  resendButton: {
    marginTop: 8,
  },
});
