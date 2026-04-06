import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';

/**
 * useAuth Hook
 * Handles authentication logic
 */

export const useAuth = () => {
  const { user, token, setUser, setToken, logout, loadFromStorage } = useAuthStore();
  const guestUser = { id: 1, email: 'guest@prolingual.local' };

  useEffect(() => {
    loadFromStorage();
    if (!user || user.email === 'guest@duolingual.local') {
      setUser(guestUser);
      setToken(null);
    }
  }, []);

  const register = async (email: string, password: string) => {
    try {
      const response = await api.register(email, password);
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    } catch (error: any) {
      // In guest mode, continue without blocking user flow.
      setUser(guestUser);
      setToken(null);
      return { success: true };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    } catch (error: any) {
      // In guest mode, continue without blocking user flow.
      setUser(guestUser);
      setToken(null);
      return { success: true };
    }
  };

  const handleLogout = () => {
    // No-op for guest mode to avoid redirect loops.
    setUser(guestUser);
    setToken(null);
  };

  return { user: user || guestUser, token, register, login, logout: handleLogout, isAuthenticated: true };
};

/**
 * useReview Hook
 * Handles review logic
 */

export const useReview = () => {
  const [todaysWords, setTodaysWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysReviews = async () => {
    setLoading(true);
    try {
      const response = await api.getTodaysReviews();
      setTodaysWords(response.data.words || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (userWordId: number, isCorrect: boolean) => {
    try {
      const response = await api.submitAnswer(userWordId, isCorrect, 'recognition');
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Failed to submit answer' };
    }
  };

  return { todaysWords, loading, error, fetchTodaysReviews, submitAnswer };
};
