import type { Flashcard } from "../types";

interface SpacedRepetitionData {
  next_review: string | null;
  review_count: number;
  difficulty_level: number;
}

function hasSpacedRepetitionData(
  flashcard: any
): flashcard is Flashcard & SpacedRepetitionData {
  return (
    "next_review" in flashcard &&
    "review_count" in flashcard &&
    "difficulty_level" in flashcard
  );
}

// SuperMemo 2 algorithm implementation
export function calculateNextReview(
  difficulty: number,
  previousInterval: number,
  consecutiveCorrect: number
): number {
  // Difficulty factor (from 1.3 to 2.5)
  const difficultyFactor = 1.3 + (difficulty - 1) * 0.3;

  if (consecutiveCorrect === 0) {
    // If incorrect, review in 1 day
    return 1;
  } else if (consecutiveCorrect === 1) {
    // First correct answer: 1 day
    return 1;
  } else if (consecutiveCorrect === 2) {
    // Second correct answer: 6 days
    return 6;
  } else {
    // Calculate next interval using the formula:
    // interval = previous_interval * difficulty_factor
    return Math.round(previousInterval * difficultyFactor);
  }
}

export function calculateDifficulty(
  oldDifficulty: number,
  performance: number // 0-5 scale
): number {
  // Update difficulty based on performance
  const newDifficulty =
    oldDifficulty +
    (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));

  // Keep difficulty between 1.3 and 2.5
  return Math.min(Math.max(1.3, newDifficulty), 2.5);
}

export function shouldReview(nextReview: string | null): boolean {
  if (!nextReview) return true;

  const now = new Date();
  const reviewDate = new Date(nextReview);
  return now >= reviewDate;
}

export function getDueCount(flashcards: Flashcard[]): number {
  return flashcards.filter((card) => {
    if (!hasSpacedRepetitionData(card)) return true;
    return shouldReview(card.next_review);
  }).length;
}
