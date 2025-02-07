import React from "react";
import { useLocalSearchParams } from "expo-router";
import { AICategoryCreator } from "@/features/ai/components/AICategoryCreator";
import { RegularCategoryCreator } from "../../../components/RegularCategoryCreator";
import { supabase } from "@/lib/supabase/supabaseClient";
import { router } from "expo-router";
import { db } from "@/lib/supabase/db";

interface CategoryData {
  name: string;
  description: string;
  color: string;
  flashcards?: Array<{ term: string; definition: string }>;
}

export default function CreateCategoryScreen() {
  const { useAI } = useLocalSearchParams<{ useAI?: string }>();

  const handleCreateWithAI = async (categoryData: {
    name: string;
    description: string; // We'll ignore this field when creating
    color: string;
    flashcards: Array<{ term: string; definition: string }>;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const category = await db.categories.create(
        {
          name: categoryData.name,
          color: categoryData.color,
          user_id: user.id,
        },
        categoryData.flashcards
      );

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
