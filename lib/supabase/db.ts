import { supabase } from "./supabaseClient";
import type { Database } from "../../types/database";
import type {
  ClassicCard,
  TrueFalseCard,
  MultipleChoiceCard,
  CardType,
  Flashcard,
} from "@/features/cards/types/cards";

type CreateFlashcardData = Omit<Flashcard, "id" | "created_at" | "updated_at">;

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

    async create(cardData: CreateFlashcardData) {
      console.log("[DB] Creating flashcard:", {
        type: cardData.card_type,
        data: cardData,
      });

      try {
        const { data, error } = await supabase
          .from("flashcards")
          .insert(cardData)
          .select()
          .single();

        if (error) {
          console.error("[DB] Error creating flashcard:", {
            error,
            cardType: cardData.card_type,
            categoryId: cardData.category_id,
          });
          throw error;
        }

        console.log("[DB] Flashcard created successfully:", {
          id: data.id,
          type: data.card_type,
        });

        return data;
      } catch (err) {
        console.error("[DB] Unexpected error in create flashcard:", err);
        throw err;
      }
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
      category: Database["public"]["Tables"]["categories"]["Insert"],
      flashcards?: Array<{ term: string; definition: string }>
    ) {
      const { data: newCategory, error: categoryError } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();

      if (categoryError) throw categoryError;

      // If flashcards are provided, create them
      if (flashcards && flashcards.length > 0) {
        const { error: flashcardsError } = await supabase
          .from("flashcards")
          .insert(
            flashcards.map((card) => ({
              category_id: newCategory.id,
              user_id: category.user_id,
              card_type: "classic",
              term: card.term,
              definition: card.definition,
            }))
          );

        if (flashcardsError) throw flashcardsError;
      }

      return newCategory;
    },

    async delete(categoryId: string) {
      try {
        // First delete all flashcards in this category
        const { error: flashcardsError } = await supabase
          .from("flashcards")
          .delete()
          .eq("category_id", categoryId);

        if (flashcardsError) {
          console.error("Error deleting flashcards:", flashcardsError);
          throw flashcardsError;
        }

        // Then delete the study sessions for this category
        const { error: sessionsError } = await supabase
          .from("study_sessions")
          .delete()
          .eq("category_id", categoryId);

        if (sessionsError) {
          console.error("Error deleting study sessions:", sessionsError);
          throw sessionsError;
        }

        // Finally delete the category itself
        const { error: categoryError } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryId);

        if (categoryError) {
          console.error("Error deleting category:", categoryError);
          throw categoryError;
        }

        return true;
      } catch (error) {
        console.error("Error in category deletion:", error);
        throw error;
      }
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
