export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
  created_at: string;
  is_public: boolean;
}

export interface Flashcard {
  id: string;
  term: string;
  definition: string;
  category_id: string;
  user_id: string;
  created_at: string;
  last_reviewed?: string;
  review_count?: number;
  confidence_level?: number;
}
