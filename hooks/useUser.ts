import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { Profile } from "@/types/database";

export function useUser() {
  const { session } = useAuth();
  const [user, setUser] = useState(session?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(session?.user ?? null);
  }, [session]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, email, streak_count, last_study_date, token_balance, created_at, updated_at"
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("[useUser] Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Set up realtime subscription
    console.log(
      "[useUser] Setting up realtime subscription for user:",
      user.id
    );
    const subscription = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("[useUser] Profile data:", payload.new);
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      console.log("[useUser] Cleaning up realtime subscription");
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    user,
    profile,
    loading,
  };
}
