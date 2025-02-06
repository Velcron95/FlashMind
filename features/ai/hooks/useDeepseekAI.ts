import { useState } from "react";
import DeepseekAIService from "../services/DeepseekAIService";
import { useSubscription } from "../../premium/hooks/useSubscription";

export const useDeepseekAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscription } = useSubscription();

  // Create service instance with premium status
  const aiService = new DeepseekAIService(subscription?.isActive ?? false);

  const handleAIError = (err: any) => {
    setError(err instanceof Error ? err.message : "An error occurred");
    setIsLoading(false);
  };

  const improveDefinition = async (term: string, currentDefinition: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiService.improveDefinition(term, currentDefinition);
      return result;
    } catch (err) {
      handleAIError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDefinition = async (term: string, definition: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiService.analyzeDefinitionClarity(term, definition);
      return result;
    } catch (err) {
      handleAIError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getExamples = async (term: string, context: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiService.generateExamples(term, context);
      return result;
    } catch (err) {
      handleAIError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiService.createCategory(prompt);
      return result;
    } catch (err) {
      handleAIError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCategoryWithFlashcards = async (
    prompt: string,
    cardCount?: number
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiService.createCategoryWithFlashcards(
        prompt,
        cardCount
      );
      return result;
    } catch (err) {
      handleAIError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    improveDefinition,
    analyzeDefinition,
    getExamples,
    createCategory,
    createCategoryWithFlashcards,
    isLoading,
    error,
  };
};
