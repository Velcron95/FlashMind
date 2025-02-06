import { supabase } from "./supabaseClient";
import type { Database } from "../../types/database";

export const db = {
  flashcards: {
    async getAll() {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    async getByCategory(categoryId: string) {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    async create(
      flashcard: Database["public"]["Tables"]["flashcards"]["Insert"]
    ) {
      const { data, error } = await supabase
        .from("flashcards")
        .insert(flashcard)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(
      id: string,
      updates: Database["public"]["Tables"]["flashcards"]["Update"]
    ) {
      const { data, error } = await supabase
        .from("flashcards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase.from("flashcards").delete().eq("id", id);

      if (error) throw error;
    },
  },

  categories: {
    async getAll() {
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
      return data || [];
    },

    async create(
      category: Database["public"]["Tables"]["categories"]["Insert"]
    ) {
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;
    },

    async update(
      id: string,
      updates: Database["public"]["Tables"]["categories"]["Update"]
    ) {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },
};
