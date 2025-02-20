import { create } from "zustand";
import { supabase } from "@/lib/supabase/supabaseClient";

interface StoreCategory {
  id: string;
  name: string;
  description: string;
  preview_cards: any[];
  cards: {
    classic: Array<{ term: string; definition: string }>;
    true_false: Array<{ statement: string; correct_answer: boolean }>;
    multiple_choice: Array<{
      question: string;
      options: string[];
      correct_answer: string;
    }>;
  };
  token_cost: number;
  category_type: string;
  difficulty_level: string;
  created_at: string;
  updated_at: string;
}

interface StoreCategoriesState {
  categories: StoreCategory[];
  loading: boolean;
  error: Error | null;
  fetchCategories: () => Promise<void>;
  purchaseCategory: (categoryId: string) => Promise<boolean>;
}

export const useStoreCategoriesStore = create<StoreCategoriesState>(
  (set, get) => ({
    categories: [],
    loading: false,
    error: null,

    fetchCategories: async () => {
      try {
        set({ loading: true, error: null });

        const { data, error } = await supabase
          .from("store_categories")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        set({ categories: data || [] });
      } catch (e) {
        set({
          error:
            e instanceof Error
              ? e
              : new Error("Failed to fetch store categories"),
        });
      } finally {
        set({ loading: false });
      }
    },

    purchaseCategory: async (categoryId: string) => {
      try {
        set({ loading: true, error: null });

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // 1. Get user's token balance
        const { data: tokenData, error: tokenError } = await supabase
          .from("user_tokens")
          .select("token_balance")
          .eq("user_id", user.id)
          .single();

        if (tokenError) throw tokenError;

        // 2. Get category cost
        const category = get().categories.find((c) => c.id === categoryId);
        if (!category) throw new Error("Category not found");

        if (tokenData.token_balance < category.token_cost) {
          throw new Error("Insufficient tokens");
        }

        // 3. Create transaction
        const { data: transaction, error: transactionError } = await supabase
          .from("token_transactions")
          .insert({
            user_id: user.id,
            amount: -category.token_cost,
            transaction_type: "spend",
            description: `Purchase of category: ${category.name}`,
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // 4. Update token balance
        const { error: updateError } = await supabase
          .from("user_tokens")
          .update({
            token_balance: tokenData.token_balance - category.token_cost,
            last_updated: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        // 5. Create purchased category record
        const { error: purchaseError } = await supabase
          .from("purchased_categories")
          .insert({
            user_id: user.id,
            store_category_id: categoryId,
            transaction_id: transaction.id,
            is_active: true,
          });

        if (purchaseError) throw purchaseError;

        return true;
      } catch (e) {
        set({
          error:
            e instanceof Error ? e : new Error("Failed to purchase category"),
        });
        return false;
      } finally {
        set({ loading: false });
      }
    },
  })
);
