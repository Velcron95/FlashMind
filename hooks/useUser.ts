import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPremiumStatus = async (userId: string) => {
    try {
      // Check premium status from profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .single();

      console.log("[useUser] Profile data:", profile);
      if (error) {
        console.error("[useUser] Error fetching profile:", error);
        return false;
      }

      const newPremiumStatus = Boolean(profile?.is_premium);
      console.log("[useUser] New premium status:", newPremiumStatus);
      return newPremiumStatus;
    } catch (error) {
      console.error("[useUser] Error checking premium status:", error);
      return false;
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    console.log(
      "[useUser] Setting up realtime subscription for user:",
      user.id
    );

    const subscription = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("[useUser] Received profile change:", payload);
          const newStatus = await checkPremiumStatus(user.id);
          console.log("[useUser] Updating premium status to:", newStatus);
          setIsPremium(newStatus);
        }
      )
      .subscribe();

    return () => {
      console.log("[useUser] Cleaning up realtime subscription");
      subscription.unsubscribe();
    };
  }, [user]);

  // Initial setup and auth changes
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      // Get initial user state
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      setUser(currentUser);
      if (currentUser) {
        const isPremiumUser = await checkPremiumStatus(currentUser.id);
        console.log("[useUser] Initial premium status:", isPremiumUser);
        if (isMounted) {
          setIsPremium(isPremiumUser);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    setup();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        const isPremiumUser = await checkPremiumStatus(session.user.id);
        console.log("[useUser] Auth change premium status:", isPremiumUser);
        if (isMounted) {
          setIsPremium(isPremiumUser);
        }
      } else {
        if (isMounted) {
          setIsPremium(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isPremium,
    loading,
  };
}
