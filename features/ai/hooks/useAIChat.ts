import { useState, useCallback } from "react";
import { useDeepseekAI } from "./useDeepseekAI";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface CategorySuggestion {
  name: string;
  description: string;
  color: string;
  flashcards: Array<{ term: string; definition: string }>;
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { createCategoryWithFlashcards } = useDeepseekAI();
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Get AI response
      const result = await createCategoryWithFlashcards(content);

      if (result) {
        const responseContent = `I've created a category "${result.category.name}" with ${result.flashcards.length} flashcards!\n\nDescription: ${result.category.description}\n\nWould you like me to create this category for you? Just let me know!`;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    suggestion,
  };
}
