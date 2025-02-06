import { supabase } from "@/lib/supabase/supabaseClient";
import { SUBSCRIPTION_PLANS } from "../constants/pricing";

interface SubscriptionStatus {
  isActive: boolean;
  plan: keyof typeof SUBSCRIPTION_PLANS | null;
  expiresAt: Date | null;
}

export class SubscriptionService {
  static async getSubscriptionStatus(
    userId: string
  ): Promise<SubscriptionStatus> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return {
        isActive: false,
        plan: null,
        expiresAt: null,
      };
    }

    return {
      isActive: data.status === "active",
      plan: data.plan_id,
      expiresAt: new Date(data.expires_at),
    };
  }

  static async createSubscription(
    userId: string,
    planId: keyof typeof SUBSCRIPTION_PLANS
  ) {
    // Implement Stripe subscription creation
    // Update subscription in database
  }

  static async cancelSubscription(userId: string) {
    // Implement Stripe subscription cancellation
    // Update subscription in database
  }

  static async verifyStudent(userId: string, studentEmail: string) {
    // Implement student verification logic
  }
}
