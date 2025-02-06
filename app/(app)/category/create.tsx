import React from "react";
import { useLocalSearchParams } from "expo-router";
import { AICategoryCreator } from "@/features/ai/components/AICategoryCreator";
import { RegularCategoryCreator } from "../../../components/RegularCategoryCreator";
import { supabase } from "@/lib/supabase/supabaseClient";
import { router } from "expo-router";

export default function CreateCategoryScreen() {
  const { useAI } = useLocalSearchParams<{ useAI?: string }>();

  const handleCreateWithAI = async (categoryData: {
    name: string;
    description: string;
    color: string;
    flashcards: Array<{ term: string; definition: string }>;
  }) => {
    try {
      // Get user ID first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // First create the category
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .insert([
          {
            name: categoryData.name,
            description: categoryData.description,
            color: categoryData.color,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Then create all flashcards
      const { error: flashcardsError } = await supabase
        .from("flashcards")
        .insert(
          categoryData.flashcards.map((card) => ({
            category_id: category.id,
            user_id: user.id,
            term: card.term,
            definition: card.definition,
          }))
        );

      if (flashcardsError) throw flashcardsError;

      // Navigate to the new category
      router.push({
        pathname: `/(app)/category/${category.id}`,
        params: {
          animation: "slide_from_right",
        },
      });
    } catch (error) {
      console.error("Error creating category with AI:", error);
      throw error;
    }
  };

  return useAI === "true" ? (
    <AICategoryCreator onCategoryCreate={handleCreateWithAI} />
  ) : (
    <RegularCategoryCreator />
  );
}
