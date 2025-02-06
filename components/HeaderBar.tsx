import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Link } from "expo-router";
import { PremiumManagementService } from "@/features/premium/services/premiumManagementService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { authStorage } from "@/lib/utils/authStorage";

export default function HeaderBar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("[HeaderBar] Current user:", user?.id);

      if (user) {
        setUserEmail(user.email || null);
        // Add debug logs for admin check
        const isAdmin = await PremiumManagementService.isUserAdmin(user.id);
        console.log("[HeaderBar] Admin check result:", isAdmin);
        setIsAdmin(isAdmin);
      }
    } catch (error) {
      console.error("[HeaderBar] Error fetching user:", error);
      setUserEmail(null);
      setIsAdmin(false);
    }
  };

  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      // Only clear auth-related data, not everything
      await authStorage.clear(); // This is our custom auth storage
      router.replace("/auth/sign-in");
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  return (
    <LinearGradient
      colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>FlashMind</Text>
        <View style={styles.userSection}>
          <Text style={styles.email} numberOfLines={1}>
            {userEmail || "Loading..."}
          </Text>
          <IconButton
            icon="account-circle"
            iconColor="white"
            size={24}
            onPress={clearSession}
          />
        </View>
        {/* Only show admin icon if user is actually an admin */}
        {isAdmin && (
          <Link href="/admin/premium-management" asChild>
            <IconButton
              icon="shield-crown"
              size={24}
              iconColor="white" // Make sure icon is visible
              onPress={() => {}}
            />
          </Link>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 48, // Adjust for status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingLeft: 12,
  },
  email: {
    color: "white",
    fontSize: 14,
    maxWidth: 150,
  },
});
