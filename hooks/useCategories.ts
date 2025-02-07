import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at?: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCategories(data || []);
      return data || [];
    } catch (e) {
      setError(
        e instanceof Error ? e : new Error("Failed to fetch categories")
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchWithRetry = async () => {
      try {
        await fetchCategories();
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchWithRetry, 1000 * retryCount);
        }
      }
    };

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      return supabase
        .channel(`categories-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "categories",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            if (isMounted) {
              await fetchWithRetry();
            }
          }
        )
        .subscribe();
    };

    fetchWithRetry();
    const subscription = setupSubscription();

    return () => {
      isMounted = false;
      subscription.then((sub) => sub?.unsubscribe());
    };
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
