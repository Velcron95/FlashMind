export interface FlashcardAIRequest {
  term: string;
  definition: string;
}

export interface StudyPerformance {
  flashcardId: string;
  correctCount: number;
  totalAttempts: number;
  lastReviewed: Date;
}

export interface StudyPlan {
  recommendedCards: string[];
  studyInterval: number; // in hours
  difficulty: "easy" | "medium" | "hard";
  suggestedReviewTime: number; // in minutes
}

export interface AIDefinitionImprovement {
  originalDefinition: string;
  improvedDefinition: string;
  clarity: number; // 0-1 score
  suggestions: string[];
}
