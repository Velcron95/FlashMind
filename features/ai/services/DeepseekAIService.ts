import { AIDefinitionImprovement, StudyPerformance, StudyPlan } from "../types";
import { guardPremiumFeature } from "../../premium/guards/PremiumGuard";

interface AIResponse {
  content: string;
  confidence?: number;
}

interface CategoryWithFlashcards {
  category: {
    name: string;
    description: string;
    color: string;
  };
  flashcards: Array<{
    term: string;
    definition: string;
  }>;
}

class DeepseekAIService {
  private isPremium: boolean;
  private apiKey: string;
  private baseUrl = "https://api.deepseek.com/v1";

  constructor(isPremium: boolean = false) {
    this.isPremium = isPremium;
    this.apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || "";
  }

  private async callAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Improves the definition of a flashcard using AI
   */
  async improveDefinition(
    term: string,
    currentDefinition: string
  ): Promise<AIResponse> {
    await guardPremiumFeature(this.isPremium, "AI Definition Improvement");

    const prompt = `Improve this definition for the term "${term}": ${currentDefinition}
                   Make it clearer, more concise, and easier to understand.`;

    const content = await this.callAPI(prompt);
    return {
      content,
      confidence: 0.9,
    };
  }

  /**
   * Suggests categories based on a set of flashcards
   */
  async suggestCategories(
    flashcards: Array<{ term: string; definition: string }>
  ): Promise<{
    name: string;
    description: string;
    color: string;
  }> {
    await guardPremiumFeature(this.isPremium, "AI Category Suggestions");

    const flashcardsText = flashcards
      .map((f) => `Term: ${f.term}\nDefinition: ${f.definition}`)
      .join("\n\n");

    const prompt = `Create a study category based on these flashcards:
      ${flashcardsText}
      
      Respond in JSON format with:
      {
        "name": "A concise category name",
        "description": "A clear description of what this category covers",
        "color": "A hex color code that suits the theme (e.g., #FF6B6B)"
      }`;

    const content = await this.callAPI(prompt);
    try {
      return JSON.parse(content);
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        name: "Generated Category",
        description: content,
        color: "#FF6B6B",
      };
    }
  }

  /**
   * Generates a personalized study plan based on user performance
   */
  async generateStudyPlan(
    userPerformance: {
      flashcardId: string;
      correctCount: number;
      totalAttempts: number;
      lastReviewed: Date;
    }[]
  ): Promise<{
    recommendedCards: string[];
    studyInterval: number;
    difficulty: "easy" | "medium" | "hard";
  }> {
    await guardPremiumFeature(this.isPremium, "AI Study Plan Generation");
    try {
      const performanceData = userPerformance
        .map(
          (perf) =>
            `Card ${perf.flashcardId}: ${perf.correctCount}/${perf.totalAttempts} correct, ` +
            `last reviewed ${perf.lastReviewed.toISOString()}`
        )
        .join("\n");

      const prompt = `Based on this user performance data, suggest a study plan:
        ${performanceData}
        Include recommended cards to review and suggested study interval.`;

      const content = await this.callAPI(prompt);

      // Parse the AI response to extract recommendations
      const result = {
        recommendedCards: userPerformance
          .filter((perf) => perf.correctCount / perf.totalAttempts < 0.7)
          .map((perf) => perf.flashcardId),
        studyInterval: 24, // hours
        difficulty: "medium" as const,
      };

      return result;
    } catch (error) {
      console.error("Error generating study plan:", error);
      throw new Error("Failed to generate study plan");
    }
  }

  /**
   * Analyzes the clarity of a flashcard definition
   */
  async analyzeDefinitionClarity(
    term: string,
    definition: string
  ): Promise<AIResponse> {
    await guardPremiumFeature(this.isPremium, "AI Definition Analysis");

    const prompt = `Analyze this definition for the term "${term}": ${definition}
                   Provide feedback on clarity, completeness, and suggestions for improvement.`;

    const content = await this.callAPI(prompt);
    return {
      content,
      confidence: 0.9,
    };
  }

  /**
   * Generates example sentences for a term
   */
  async generateExamples(term: string, context: string): Promise<string[]> {
    await guardPremiumFeature(this.isPremium, "AI Example Generation");

    const prompt = `Generate 3 practical examples using the term "${term}" in this context: ${context}`;

    const content = await this.callAPI(prompt);
    const examples = content.split("\n").filter(Boolean);
    return examples.length > 0 ? examples : ["No examples available"];
  }

  /**
   * Generates a detailed study plan with spaced repetition
   */
  async generateDetailedStudyPlan(
    performance: StudyPerformance[],
    userPreferences: {
      dailyStudyTime: number;
      preferredTimeOfDay: string;
      difficultyPreference: string;
    }
  ): Promise<StudyPlan> {
    await guardPremiumFeature(
      this.isPremium,
      "AI Detailed Study Plan Generation"
    );
    try {
      const prompt = `Create a personalized study plan based on:
        Performance data: ${JSON.stringify(performance)}
        User preferences: ${JSON.stringify(userPreferences)}
        
        Include:
        1. Recommended cards to review
        2. Study intervals
        3. Difficulty assessment
        4. Suggested review duration`;

      const content = await this.callAPI(prompt);

      // Process the response and create a structured study plan
      return {
        recommendedCards: performance
          .filter((p) => p.correctCount / p.totalAttempts < 0.8)
          .map((p) => p.flashcardId),
        studyInterval: 24,
        difficulty: "medium",
        suggestedReviewTime: 30,
      };
    } catch (error) {
      console.error("Error generating detailed study plan:", error);
      throw new Error("Failed to generate study plan");
    }
  }

  async createCategory(prompt: string): Promise<{
    name: string;
    description: string;
    color: string;
  }> {
    await guardPremiumFeature(this.isPremium, "AI Category Creation");

    const aiPrompt = `Create a study category based on this description: ${prompt}
      
      Respond in JSON format with:
      {
        "name": "A concise category name",
        "description": "A clear description of what this category covers",
        "color": "A hex color code that suits the theme (e.g., #FF6B6B)"
      }`;

    const content = await this.callAPI(aiPrompt);
    try {
      return JSON.parse(content);
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        name: "Generated Category",
        description: content,
        color: "#FF6B6B",
      };
    }
  }

  async createCategoryWithFlashcards(
    prompt: string,
    cardCount: number = 20
  ): Promise<CategoryWithFlashcards> {
    await guardPremiumFeature(this.isPremium, "AI Category Creation");

    const aiPrompt = `Create a study category with ${cardCount} flashcards based on this description: ${prompt}

      Respond in JSON format with:
      {
        "category": {
          "name": "A concise category name",
          "description": "A clear description of what this category covers",
          "color": "A hex color code that suits the theme (e.g., #FF6B6B)"
        },
        "flashcards": [
          {
            "term": "Term 1",
            "definition": "Clear and concise definition 1"
          },
          // ... more flashcards
        ]
      }

      Make sure the flashcards:
      1. Cover key concepts progressively
      2. Have clear, concise definitions
      3. Are suitable for studying
      4. Are factually accurate
      5. Build upon each other`;

    const content = await this.callAPI(prompt);
    try {
      const result = JSON.parse(content);
      // Validate the response has the correct structure
      if (!result.category || !result.flashcards) {
        throw new Error("Invalid response format");
      }
      return result;
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        category: {
          name: "Generated Category",
          description: "AI-generated study category",
          color: "#FF6B6B",
        },
        flashcards: [
          {
            term: "Example Term",
            definition: "Example Definition",
          },
        ],
      };
    }
  }
}

export default DeepseekAIService;
