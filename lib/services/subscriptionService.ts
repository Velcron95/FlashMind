import { supabase } from "../supabase/supabaseClient";
import { Platform } from "react-native";
import * as StoreReview from "expo-store-review";
import * as InAppPurchases from "expo-in-app-purchases";

const SUBSCRIPTION_SKUS = {
  monthly: Platform.select({
    ios: "com.flashmind.premium.monthly",
    android: "flashmind_premium_monthly",
  }),
  yearly: Platform.select({
    ios: "com.flashmind.premium.yearly",
    android: "flashmind_premium_yearly",
  }),
};

export class SubscriptionService {
  private static instance: SubscriptionService;
  private isConnected = false;

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async initialize() {
    if (this.isConnected) return;

    try {
      await InAppPurchases.connectAsync();
      this.isConnected = true;
    } catch (e) {
      console.error("Failed to connect to store:", e);
    }
  }

  async getSubscriptionProducts() {
    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync([
        SUBSCRIPTION_SKUS.monthly!,
        SUBSCRIPTION_SKUS.yearly!,
      ]);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return results;
      }
      return [];
    } catch (e) {
      console.error("Error fetching products:", e);
      return [];
    }
  }

  async purchaseSubscription(sku: string) {
    try {
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(
        sku
      );

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        await this.handleSuccessfulPurchase(results[0]);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error during purchase:", e);
      return false;
    }
  }

  private async handleSuccessfulPurchase(purchase: any) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Update user's premium status
      await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", user.id);

      // Store purchase receipt for verification
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        receipt: purchase.transactionReceipt,
        platform: Platform.OS,
        product_id: purchase.productId,
        purchase_date: new Date().toISOString(),
      });

      // Request app store review after successful purchase
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch (e) {
      console.error("Error handling purchase:", e);
    }
  }

  async restorePurchases() {
    try {
      const { responseCode, results } =
        await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        for (const purchase of results) {
          await this.handleSuccessfulPurchase(purchase);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error restoring purchases:", e);
      return false;
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance();
