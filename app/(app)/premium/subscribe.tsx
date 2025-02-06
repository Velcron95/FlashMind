import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button } from "react-native-paper";
import { useSubscription } from "../../../features/premium/hooks/useSubscription";
import {
  SUBSCRIPTION_PLANS,
  PlanId,
} from "../../../features/premium/constants/pricing";

type PlanDetails = (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];

export default function SubscribeScreen() {
  const { subscription, subscribe, isLoading } = useSubscription();

  const handleSubscribe = async (planId: PlanId) => {
    try {
      await subscribe(planId);
      // Navigate to success screen or show success message
    } catch (error) {
      // Handle error
    }
  };

  const renderPlanCard = (id: PlanId, plan: PlanDetails) => (
    <Card key={id} style={styles.planCard}>
      <Card.Content>
        <Text variant="titleLarge">{plan.name}</Text>
        <Text variant="headlineMedium" style={styles.price}>
          ${plan.price}
          <Text variant="bodySmall">/{plan.period}</Text>
        </Text>
        {"savings" in plan && (
          <Text variant="bodyMedium" style={styles.savings}>
            Save {plan.savings}
          </Text>
        )}
        {plan.features.map((feature, index) => (
          <Text key={index} variant="bodyMedium" style={styles.feature}>
            • {feature}
          </Text>
        ))}
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => handleSubscribe(id)}
          loading={isLoading}
          style={styles.button}
        >
          Choose {plan.name}
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Upgrade to Premium
      </Text>

      {(Object.entries(SUBSCRIPTION_PLANS) as [PlanId, PlanDetails][]).map(
        ([id, plan]) => renderPlanCard(id, plan)
      )}
    </ScrollView>
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
  planCard: {
    marginBottom: 16,
  },
  price: {
    marginVertical: 8,
  },
  savings: {
    color: "green",
    marginBottom: 8,
  },
  feature: {
    marginVertical: 4,
  },
  button: {
    width: "100%",
    marginTop: 8,
  },
});
