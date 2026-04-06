import { create } from 'zustand';

/**
 * Auth Store
 * Global state management for authentication
 */

interface AuthState {
  user: { id: number; email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: { id: number; email: string } | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
    })),
  setToken: (token) =>
    set({
      token,
    }),
  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        set({
          token,
          user: JSON.parse(user),
          isAuthenticated: true,
        });
      }
    }
  },
}));

/**
 * Learning Store
 * Global state for words and review data
 */

interface Word {
  id: number;
  word: string;
  definition: string;
  part_of_speech: string;
  domain: string;
  difficulty_level: number;
  examples: any[];
}

interface ReviewState {
  words: Word[];
  currentWord: Word | null;
  todaysCount: number;
  stats: any;
  weakWords: Word[];
  setWords: (words: Word[]) => void;
  setCurrentWord: (word: Word | null) => void;
  setTodaysCount: (count: number) => void;
  setStats: (stats: any) => void;
  setWeakWords: (words: Word[]) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  words: [],
  currentWord: null,
  todaysCount: 0,
  stats: null,
  weakWords: [],
  setWords: (words) => set({ words }),
  setCurrentWord: (word) => set({ currentWord: word }),
  setTodaysCount: (count) => set({ todaysCount: count }),
  setStats: (stats) => set({ stats }),
  setWeakWords: (words) => set({ weakWords: words }),
}));

interface UiState {
  languageMode: 'en' | 'zh';
  setLanguageMode: (mode: 'en' | 'zh') => void;
  loadUiFromStorage: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  languageMode: 'zh',
  setLanguageMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('languageMode', mode);
    }
    set({ languageMode: mode });
  },
  loadUiFromStorage: () => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('languageMode');
      if (savedMode === 'en' || savedMode === 'zh') {
        set({ languageMode: savedMode });
      } else if (savedMode === 'bilingual') {
        // Migrate old setting to Chinese-only mode for beginner-friendly default.
        set({ languageMode: 'zh' });
      }
    }
  },
}));
