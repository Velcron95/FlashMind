import { useState } from "react";
import { useDeepseekAI } from "./useDeepseekAI";
import type { AIDefinitionImprovement } from "../types";

export const useFlashcardAI = (term: string, definition: string) => {
  const [improvements, setImprovements] =
    useState<AIDefinitionImprovement | null>(null);
  const [examples, setExamples] = useState<string[]>([]);
  const {
    improveDefinition,
    analyzeDefinition,
    getExamples,
    isLoading,
    error,
  } = useDeepseekAI();

  const improve = async () => {
    try {
      const result = await improveDefinition(term, definition);
      if (result) {
        return result.content;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const analyze = async () => {
    try {
      const result = await analyzeDefinition(term, definition);
      if (result) {
        setImprovements(result);
        return result;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const generateExamples = async () => {
    try {
      const result = await getExamples(term, definition);
      if (result) {
        setExamples(result);
        return result;
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  return {
    improve,
    analyze,
    generateExamples,
    improvements,
    examples,
    isLoading,
    error,
  };
};
