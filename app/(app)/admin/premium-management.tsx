import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, Switch } from "react-native-paper";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { PremiumManagementService } from "../../../features/premium/services/premiumManagementService";
import { SUBSCRIPTION_PLANS } from "../../../features/premium/constants/pricing";

export default function PremiumManagementScreen() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadPremiumStatus();
    }
  }, [user]);

  const loadPremiumStatus = async () => {
    if (!user) return;
    try {
      const status = await PremiumManagementService.getUserPremiumStatus(
        user.id
      );
      setIsPremium(status);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading premium status:", error);
    }
  };

  const togglePremiumStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await PremiumManagementService.setUserPremiumStatus(user.id, !isPremium);
      setIsPremium(!isPremium);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error toggling premium status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Content>
          <Text variant="titleLarge">Premium Status Management</Text>

          <View style={styles.infoContainer}>
            <Text variant="bodyMedium">User ID: {user?.id}</Text>
            <Text variant="bodyMedium">Email: {user?.email}</Text>
            {lastUpdated && (
              <Text variant="bodySmall">
                Last Updated: {lastUpdated.toLocaleString()}
              </Text>
            )}
          </View>

          <View style={styles.switchContainer}>
            <View>
              <Text variant="bodyLarge">Premium Status</Text>
              <Text variant="bodySmall" style={styles.statusText}>
                {isPremium ? "Premium Active" : "Free Tier"}
              </Text>
            </View>
            <Switch
              value={isPremium}
              onValueChange={togglePremiumStatus}
              disabled={isLoading}
            />
          </View>

          <Text variant="bodySmall" style={styles.warning}>
            ⚠️ This screen is for development purposes only
          </Text>
        </Card.Content>
      </Card>

      {isPremium && (
        <Card style={styles.featuresCard}>
          <Card.Content>
            <Text variant="titleMedium">Active Premium Features</Text>
            <View style={styles.featuresList}>
              {SUBSCRIPTION_PLANS.MONTHLY.features.map(
                (feature: string, index: number) => (
                  <Text key={index} variant="bodySmall" style={styles.feature}>
                    ✓ {feature}
                  </Text>
                )
              )}
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    marginVertical: 12,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusText: {
    marginTop: 4,
    color: "#666",
  },
  warning: {
    color: "orange",
    marginTop: 16,
  },
  featuresCard: {
    marginTop: 16,
  },
  featuresList: {
    marginTop: 8,
  },
  feature: {
    marginVertical: 4,
    color: "#4CAF50",
  },
});
