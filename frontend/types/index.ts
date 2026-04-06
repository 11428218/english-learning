export interface User {
  id: number;
  email: string;
}

export interface Word {
  id: number;
  word: string;
  definition: string;
  part_of_speech: string;
  domain: 'general' | 'business' | 'electrical' | 'toeic';
  difficulty_level: number;
  created_at: string;
}

export interface Example {
  id: number;
  word_id: number;
  sentence: string;
  type: 'daily' | 'business' | 'technical';
  created_at: string;
}

export interface UserWord {
  id: number;
  user_id: number;
  word_id: number;
  next_review_date: string | null;
  review_interval: number;
  ease_factor: number;
  correct_streak: number;
  total_reviews: number;
  times_correct: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewWord extends Word {
  user_word_id: number;
  current_streak: number;
  review_interval: number;
  ease_factor: number;
  examples: Example[];
}

export interface ReviewResponse {
  words: ReviewWord[];
  count: number;
}

export interface Stats {
  total_words: number;
  due_today: number;
  total_reviews: number;
  times_correct: number;
  avg_ease_factor: number;
  accuracy: number;
}
