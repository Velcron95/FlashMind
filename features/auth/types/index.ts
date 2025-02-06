export interface User {
  id: string;
  email: string;
  isPremium: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}
