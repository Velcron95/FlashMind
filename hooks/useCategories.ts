import { useEffect, useState } from "react";
import { db } from "@/lib/supabase/db";
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get categories for the current user
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCategories(data || []);
    } catch (e) {
      console.error("Error fetching categories:", e);
      setError(
        e instanceof Error ? e : new Error("Failed to fetch categories")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
