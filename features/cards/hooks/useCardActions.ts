import { useState } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { Flashcard } from "../types/cards";

export const useCardActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCard = async (id: string) => {
    try {
      setLoading(true);
      await supabase.from("flashcards").delete().eq("id", id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete card");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async (id: string, data: Partial<Flashcard>) => {
    try {
      setLoading(true);
      await supabase.from("flashcards").update(data).eq("id", id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update card");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    deleteCard,
    updateCard,
  };
};
