import type { CardType } from "@/features/cards/types/cards";

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_login: string;
  streak_count: number;
  settings: any;
}

export interface Profile {
  id: string;
  email: string;
  streak_count: number;
  last_study_date: string | null;
  token_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  category_id: string;
  card_type: CardType;
  term: string | null;
  definition: string | null;
  statement: string | null;
  question: string | null;
  options: string[] | null;
  correct_answer: string | null;
  is_learned: boolean;
  times_reviewed: number;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
  difficulty_level: number;
}

export interface StudySession {
  id: string;
  user_id: string;
  category_id: string;
  cards_studied: number;
  correct_answers: number;
  study_duration: number;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Category, "id" | "user_id">>;
      };
      flashcards: {
        Row: Flashcard;
        Insert: Omit<Flashcard, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Flashcard, "id" | "user_id">>;
      };
      study_sessions: {
        Row: StudySession;
        Insert: Omit<StudySession, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<StudySession, "id" | "user_id">>;
      };
    };
  };
}
