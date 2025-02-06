import React from "react";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import { Modal, Text, Button, HelperText } from "react-native-paper";

interface ResetPasswordModalProps {
  visible: boolean;
  onDismiss: () => void;
  email: string;
  onEmailChange: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  success: boolean;
}

function ResetPasswordModal({
  visible,
  onDismiss,
  email,
  onEmailChange,
  onSubmit,
  loading,
  error,
  success,
}: ResetPasswordModalProps) {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.container}
      dismissable={true}
    >
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Reset Password
        </Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your
          password.
        </Text>

        <View style={styles.inputContainer}>
          <RNTextInput
            value={email}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: "white" }]}
            editable={!loading}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.5)"
            selectionColor="white"
          />
        </View>

        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}

        {success && (
          <HelperText type="info" visible={true} style={styles.successText}>
            Check your email for reset instructions
          </HelperText>
        )}

        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={onSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
            buttonColor="rgba(255,255,255,0.15)"
            textColor="white"
          >
            Send Reset Link
          </Button>
          <Button mode="text" onPress={onDismiss} textColor="white">
            Cancel
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    transform: [{ translateY: -200 }],
  },
  content: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#B85F9A", // A color between #FF6B6B and #4158D0
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    height: 56,
    padding: 0,
  },
  buttons: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  successText: {
    color: "#4ECDC4",
  },
});

export default React.memo(ResetPasswordModal);
