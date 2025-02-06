import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function HeaderBar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserEmail(user?.email || null);
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
          <IconButton icon="account-circle" iconColor="white" size={24} />
        </View>
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
