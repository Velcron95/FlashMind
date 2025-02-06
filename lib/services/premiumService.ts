import { supabase } from "../supabase/supabaseClient";

class PremiumService {
  async isPremium(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data?.is_premium || false;
    } catch (error) {
      console.error("Error checking premium status:", error);
      return false;
    }
  }

  async upgradeToPremium(userId: string): Promise<boolean> {
    try {
      // TODO: Implement actual payment processing
      const { error } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error upgrading to premium:", error);
      return false;
    }
  }
}

export const premiumService = new PremiumService();
