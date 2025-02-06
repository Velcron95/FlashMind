import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase/supabaseClient";
import * as StoreReview from "expo-store-review";

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setIsPremium(data?.is_premium || false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check premium status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // TODO: Implement actual payment processing
      // This is a placeholder that simulates successful upgrade
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setIsPremium(true);

      // Request app store review after successful upgrade
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      }

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upgrade to premium"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isPremium,
    isLoading,
    error,
    upgradeToPremium,
    checkPremiumStatus,
  };
}
