import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase/supabaseClient";

export default function ConfirmScreen() {
  const { token, type, email } = useLocalSearchParams();

  useEffect(() => {
    async function handleEmailConfirmation() {
      if (type === "email_confirmation" && token && email) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token: token as string,
            type: "email",
            email: email as string,
          });

          if (error) throw error;

          // Redirect to sign in with success message
          router.replace({
            pathname: "/auth/sign-in",
            params: {
              message: "Email confirmed successfully! Please sign in.",
            },
          });
        } catch (error) {
          console.error("Error confirming email:", error);
          router.replace({
            pathname: "/auth/sign-in",
            params: {
              error: "Failed to confirm email. Please try signing up again.",
            },
          });
        }
      }
    }

    handleEmailConfirmation();
  }, [token, type, email]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Confirming your email...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  text: {
    marginTop: 16,
  },
});
