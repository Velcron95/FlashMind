import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Portal,
  Modal,
  Text,
  Button,
  List,
  useTheme,
  Card,
} from "react-native-paper";
import { usePremium } from "../hooks/usePremium";

interface PremiumFeature {
  icon: string;
  title: string;
  description: string;
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: "brain",
    title: "AI-Powered Learning",
    description: "Smart study intervals and personalized learning paths",
  },
  {
    icon: "chart-line",
    title: "Advanced Analytics",
    description: "Detailed insights into your learning progress",
  },
  {
    icon: "robot",
    title: "AI Suggestions",
    description: "Get AI-powered improvements for your flashcards",
  },
  {
    icon: "sync",
    title: "Cross-Device Sync",
    description: "Access your flashcards on all your devices",
  },
  {
    icon: "share-variant",
    title: "Unlimited Sharing",
    description: "Share and collaborate with other learners",
  },
  {
    icon: "advertisement",
    title: "Ad-Free Experience",
    description: "Study without interruptions",
  },
];

interface PremiumModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function PremiumModal({
  visible,
  onDismiss,
}: PremiumModalProps) {
  const theme = useTheme();
  const { isPremium, isLoading, error, upgradeToPremium } = usePremium();

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium();
      onDismiss();
    } catch (err) {
      // Error handling is managed in the usePremium hook
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Text variant="headlineMedium" style={styles.title}>
            Upgrade to Premium
          </Text>

          <Card style={styles.priceCard}>
            <Card.Content>
              <Text variant="headlineLarge" style={styles.price}>
                $4.99
              </Text>
              <Text variant="titleMedium" style={styles.period}>
                per month
              </Text>
            </Card.Content>
          </Card>

          <Text variant="titleLarge" style={styles.featuresTitle}>
            Premium Features
          </Text>

          {PREMIUM_FEATURES.map((feature) => (
            <List.Item
              key={feature.title}
              title={feature.title}
              description={feature.description}
              left={(props) => <List.Icon {...props} icon={feature.icon} />}
              style={styles.feature}
            />
          ))}

          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleUpgrade}
              loading={isLoading}
              disabled={isLoading || isPremium}
              style={styles.button}
            >
              {isPremium ? "Already Premium" : "Upgrade Now"}
            </Button>
            <Button
              mode="outlined"
              onPress={onDismiss}
              disabled={isLoading}
              style={styles.button}
            >
              Maybe Later
            </Button>
          </View>

          {error && (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <Text style={styles.terms}>
            By upgrading, you agree to our Terms of Service and Privacy Policy.
            Subscription will auto-renew unless canceled.
          </Text>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 28,
    maxHeight: "80%",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  priceCard: {
    marginBottom: 24,
  },
  price: {
    textAlign: "center",
    fontWeight: "bold",
  },
  period: {
    textAlign: "center",
    opacity: 0.7,
  },
  featuresTitle: {
    marginBottom: 16,
  },
  feature: {
    paddingVertical: 8,
  },
  actions: {
    marginTop: 24,
  },
  button: {
    marginBottom: 8,
  },
  error: {
    textAlign: "center",
    marginTop: 8,
  },
  terms: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 16,
  },
});
