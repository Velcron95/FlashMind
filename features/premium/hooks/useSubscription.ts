import { useState, useEffect } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { SubscriptionService } from "../services/subscriptionService";
import { SUBSCRIPTION_PLANS } from "../constants/pricing";

export const useSubscription = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    isActive: boolean;
    plan: keyof typeof SUBSCRIPTION_PLANS | null;
    expiresAt: Date | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const status = await SubscriptionService.getSubscriptionStatus(user.id);
      setSubscription(status);
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async (planId: keyof typeof SUBSCRIPTION_PLANS) => {
    if (!user) return;
    try {
      await SubscriptionService.createSubscription(user.id, planId);
      await loadSubscription();
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  };

  const cancel = async () => {
    if (!user) return;
    try {
      await SubscriptionService.cancelSubscription(user.id);
      await loadSubscription();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  };

  return {
    isLoading,
    subscription,
    subscribe,
    cancel,
    plans: SUBSCRIPTION_PLANS,
  };
};
