import { create } from "zustand";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { Category } from "@/types/database";

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

type SetState = (
  partial:
    | CategoriesState
    | Partial<CategoriesState>
    | ((state: CategoriesState) => CategoriesState | Partial<CategoriesState>),
  replace?: boolean
) => void;

type GetState = () => CategoriesState;

export const useCategoriesStore = create<CategoriesState>(
  (set: SetState, get: GetState) => ({
    categories: [],
    loading: false,
    error: null,

    fetchCategories: async () => {
      try {
        set({ loading: true, error: null });
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
        set({ categories: data || [] });
      } catch (e) {
        set({
          error:
            e instanceof Error ? e : new Error("Failed to fetch categories"),
        });
      } finally {
        set({ loading: false });
      }
    },

    addCategory: (category: Category) => {
      set((state: CategoriesState) => ({
        categories: [category, ...state.categories],
      }));
    },

    deleteCategory: (id: string) => {
      set((state: CategoriesState) => ({
        categories: state.categories.filter((c: Category) => c.id !== id),
      }));
    },
  })
);
