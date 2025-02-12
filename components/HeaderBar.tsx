import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Text, IconButton, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useUser } from "@/features/user/context/UserContext";

export default function HeaderBar() {
  const { userData, isLoading } = useUser();
  const router = useRouter();

  return (
    <LinearGradient
      colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Pressable onPress={() => router.push("/(app)/(tabs)/dashboard")}>
          <Text style={styles.title}>FlashMind</Text>
        </Pressable>
        <View style={styles.userSection}>
          {isLoading ? (
            <ActivityIndicator size={24} color="white" style={styles.loader} />
          ) : (
            <>
              <Text style={styles.email} numberOfLines={1}>
                {userData.email || "Loading..."}
              </Text>
              {userData.avatar_url ? (
                <Pressable onPress={() => router.push("/(app)/profile")}>
                  <Image
                    source={{ uri: userData.avatar_url }}
                    style={styles.avatar}
                  />
                </Pressable>
              ) : (
                <IconButton
                  icon="account-circle"
                  iconColor="white"
                  size={24}
                  onPress={() => router.push("/(app)/profile")}
                />
              )}
            </>
          )}
        </View>
        {userData.isAdmin && (
          <Link href="/admin/premium-management" asChild>
            <IconButton
              icon="shield-crown"
              size={24}
              iconColor="white"
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
    paddingTop: 32,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
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
  loader: {
    marginHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
