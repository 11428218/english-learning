/**
 * TypeScript type definitions for the application
 */

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Word {
  id: number;
  word: string;
  definition: string;
  part_of_speech: string;
  domain: 'general' | 'business' | 'electrical' | 'toeic';
  difficulty_level: number;
  created_at: Date;
}

export interface Example {
  id: number;
  word_id: number;
  sentence: string;
  type: 'daily' | 'business' | 'technical';
  created_at: Date;
}

export interface UserWord {
  id: number;
  user_id: number;
  word_id: number;
  next_review_date: Date | null;
  review_interval: number;
  ease_factor: number;
  correct_streak: number;
  total_reviews: number;
  times_correct: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewHistory {
  id: number;
  user_id: number;
  word_id: number;
  is_correct: boolean;
  review_type: string;
  created_at: Date;
}

export interface DecodedToken {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

export interface ReviewResponse {
  words: ReviewWord[];
  count: number;
}

export interface ReviewWord extends Word {
  user_word_id: number;
  current_streak: number;
  review_interval: number;
  ease_factor: number;
  examples: Example[];
}

export interface AnswerRequest {
  user_word_id: number;
  is_correct: boolean;
  review_type: string;
}

export interface GenerateExamplesRequest {
  word: string;
  domain: 'general' | 'business' | 'electrical' | 'toeic';
}
