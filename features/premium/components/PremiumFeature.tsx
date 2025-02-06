import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useUser } from "@/hooks/useUser";

interface PremiumFeatureProps {
  children: React.ReactNode;
  featureName: string;
  onUpgradePress?: () => void;
}

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  featureName,
  onUpgradePress,
}) => {
  const { isPremium, loading } = useUser();

  // Show loading state or nothing while checking premium status
  if (loading) {
    return null;
  }

  // If user is premium, show the actual feature
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premium Feature</Text>
      <Text style={styles.description}>
        {featureName} is available exclusively to premium users.
      </Text>
      <Pressable style={styles.button} onPress={onUpgradePress}>
        <Text style={styles.buttonText}>Upgrade to Premium</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    marginBottom: 16,
    color: "#6c757d",
  },
  button: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
