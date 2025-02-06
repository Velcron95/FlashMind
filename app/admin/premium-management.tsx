import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Switch, Button, ActivityIndicator } from "react-native-paper";
import { supabase } from "@/lib/supabase/supabaseClient";
import { PremiumManagementService } from "@/features/premium/services/premiumManagementService";

interface UserProfile {
  id: string;
  email: string;
  is_premium: boolean;
}

export default function PremiumManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, is_premium")
        .order("email");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const testTogglePremium = async (userId: string) => {
    try {
      console.log("[Test] Starting premium toggle test");
      const currentStatus = await PremiumManagementService.getUserPremiumStatus(
        userId
      );
      console.log("[Test] Current status:", currentStatus);

      const result = await PremiumManagementService.setUserPremiumStatus(
        userId,
        !currentStatus
      );
      console.log("[Test] Toggle result:", result);

      // Refresh the users list after toggle
      await fetchUsers();
    } catch (error) {
      console.error("[Test] Toggle failed:", error);
    }
  };

  const togglePremium = async (userId: string, newStatus: boolean) => {
    try {
      await PremiumManagementService.setUserPremiumStatus(userId, newStatus);
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error toggling premium status:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Premium User Management</Text>
      {users.map((user) => (
        <View key={user.id} style={styles.userRow}>
          <View style={styles.userInfo}>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.status}>
              Status: {user.is_premium ? "Premium" : "Free"}
            </Text>
          </View>
          <View style={styles.controls}>
            <Switch
              value={user.is_premium}
              onValueChange={(newValue) => togglePremium(user.id, newValue)}
            />
            <Button
              mode="contained"
              onPress={() => testTogglePremium(user.id)}
              style={styles.testButton}
            >
              Test Toggle
            </Button>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userInfo: {
    flex: 1,
  },
  email: {
    fontSize: 16,
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: "#666",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  testButton: {
    marginLeft: 8,
  },
});
