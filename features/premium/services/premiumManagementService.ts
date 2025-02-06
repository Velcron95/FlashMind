import { supabase } from "@/lib/supabase/supabaseClient";
import { Alert } from "react-native";

interface UserProfile {
  id: string;
  email: string;
  is_premium: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export class PremiumManagementService {
  static async setUserPremiumStatus(userId: string, isPremium: boolean) {
    try {
      console.log(
        `[PremiumService] Attempting to ${
          isPremium ? "enable" : "disable"
        } premium for user:`,
        userId
      );

      // First verify if the caller is an admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isAdmin = await this.isUserAdmin(user.id);
      if (!isAdmin) throw new Error("Not authorized to change premium status");

      // First get the user's current profile to preserve email and check current status
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("email, is_premium")
        .eq("id", userId)
        .single();

      console.log(
        "[PremiumService] Current premium status:",
        existingProfile?.is_premium
      );
      console.log("[PremiumService] Setting premium to:", isPremium);

      // Update premium status while preserving email
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: existingProfile?.email,
            is_premium: isPremium,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        console.error("[PremiumService] Update failed:", error);
        throw new Error(`Failed to update premium status: ${error.message}`);
      }

      console.log(
        "[PremiumService] Update successful. New status:",
        data.is_premium
      );
      return data;
    } catch (error) {
      console.error("[PremiumService] Error:", error);
      throw error;
    }
  }

  static async getUserPremiumStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .single();

      if (error) {
        throw new Error(`Failed to get premium status: ${error.message}`);
      }

      return data?.is_premium ?? false;
    } catch (error) {
      console.error("Error checking premium status:", error);
      return false;
    }
  }

  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      console.log("[PremiumService] Checking admin status for:", userId);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin") // Only select what we need
        .eq("id", userId)
        .single();

      // Log everything for debugging
      console.log("[PremiumService] Profile:", profile);
      console.log("[PremiumService] Error:", profileError);

      if (profileError) {
        console.log("[PremiumService] Error checking admin status");
        return false;
      }

      const isAdmin = profile?.is_admin ?? false;
      console.log("[PremiumService] Is admin:", isAdmin);
      return isAdmin;
    } catch (error) {
      console.error("[PremiumService] Error:", error);
      return false;
    }
  }
}
