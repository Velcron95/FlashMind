export interface StoreCategory {
  id: string;
  name: string;
  description: string;
  token_cost: number;
  preview_cards: {
    classic?: { term: string; definition: string }[];
    true_false?: { statement: string; correct_answer: boolean }[];
    multiple_choice?: {
      question: string;
      options: string[];
      correct_answer: string;
    }[];
  };
  category_type: string;
  difficulty_level: string;
  created_at: string;
  updated_at: string;
}

export interface PurchasedCategory {
  id: string;
  user_id: string;
  store_category_id: string;
  transaction_id: string;
  is_active: boolean;
  purchase_date: string;
}
