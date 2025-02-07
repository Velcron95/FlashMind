export type CardType = "classic" | "true_false" | "multiple_choice";

export interface BaseCard {
  id: string;
  category_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_reviewed: string | null;
  times_reviewed: number;
  is_learned: boolean;
  card_type: CardType;
}

export interface ClassicCard extends BaseCard {
  card_type: "classic";
  term: string;
  definition: string;
}

export interface TrueFalseCard extends BaseCard {
  card_type: "true_false";
  statement: string;
  correct_answer: string;
}

export interface MultipleChoiceCard extends BaseCard {
  card_type: "multiple_choice";
  question: string;
  options: string[];
  correct_answer: string;
}

export type Flashcard = ClassicCard | TrueFalseCard | MultipleChoiceCard;

export type CreateFlashcardData = {
  category_id: string;
  user_id: string;
  is_learned: boolean;
  times_reviewed: number;
  last_reviewed: null;
} & (
  | {
      card_type: "classic";
      term: string;
      definition: string;
    }
  | {
      card_type: "true_false";
      statement: string;
      correct_answer: string;
    }
  | {
      card_type: "multiple_choice";
      question: string;
      options: string[];
      correct_answer: string;
    }
);
