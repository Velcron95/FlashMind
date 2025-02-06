import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, IconButton } from "react-native-paper";
import { useAIChat } from "../hooks/useAIChat";
import { PremiumFeature } from "../../premium/components/PremiumFeature";
import { router } from "expo-router";

export function AIChatInterface() {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useAIChat();

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input.trim());
    setInput("");
  };

  return (
    <PremiumFeature
      featureName="AI Chat Assistant"
      onUpgradePress={() => router.push("/(app)/premium/subscribe")}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView style={styles.messagesContainer}>
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                👋 Hi! I'm your AI assistant. I can help you create flashcard
                categories and generate study materials. What would you like to
                learn about?
              </Text>
            </View>
          )}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.message,
                message.role === "user" ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.message, styles.aiMessage]}>
              <Text style={styles.messageText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask AI to create a category..."
            mode="flat"
            style={styles.input}
            disabled={isLoading}
            right={
              <TextInput.Icon
                icon="send"
                disabled={isLoading || !input.trim()}
                onPress={handleSend}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </PremiumFeature>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-end",
  },
  aiMessage: {
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "white",
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  welcomeContainer: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    marginBottom: 16,
  },
  welcomeText: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
  },
});
