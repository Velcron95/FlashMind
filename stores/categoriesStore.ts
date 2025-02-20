import { create } from "zustand";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { Category } from "@/types/database";

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
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
      set({ categories: data || [], loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
    }
  },

  addCategory: (category: Category) => {
    set((state) => ({
      categories: [category, ...state.categories],
    }));
  },

  updateCategory: async (id: string, data: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, ...data } : c
        ),
      }));
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
}));

export default useCategoriesStore;
