import axios, { AxiosInstance } from 'axios';

/**
 * API Client
 * Centralized HTTP client for all API requests
 */

const CONFIGURED_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const FALLBACK_BASE_URLS = ['http://localhost:5000', 'http://localhost:5001', 'http://localhost:5002'];

const CANDIDATE_BASE_URLS = CONFIGURED_BASE_URL
  ? [CONFIGURED_BASE_URL, ...FALLBACK_BASE_URLS.filter((url) => url !== CONFIGURED_BASE_URL)]
  : FALLBACK_BASE_URLS;

let activeBaseUrl = CANDIDATE_BASE_URLS[0];

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: activeBaseUrl,
      timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 12000),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      config.baseURL = activeBaseUrl;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error?.config as any;
        if (!config) {
          return Promise.reject(error);
        }

        config.__retryCount = config.__retryCount || 0;

        const isNetworkError = !error.response;
        const hasNotRetried = !config.__baseUrlRetried;
        if (isNetworkError && hasNotRetried) {
          const currentIndex = CANDIDATE_BASE_URLS.indexOf(activeBaseUrl);
          const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 1;
          const nextBase = CANDIDATE_BASE_URLS[nextIndex];

          if (nextBase) {
            activeBaseUrl = nextBase;
            config.__baseUrlRetried = true;
            config.baseURL = nextBase;
            return this.client.request(config);
          }
        }

        const status = error?.response?.status;
        const shouldRetry5xx = status >= 500 && status < 600;
        if (shouldRetry5xx && config.__retryCount < 2) {
          config.__retryCount += 1;
          await new Promise((resolve) => setTimeout(resolve, 250 * config.__retryCount));
          return this.client.request(config);
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  register(email: string, password: string) {
    return this.client.post('/auth/register', { email, password });
  }

  login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  // Words endpoints
  getAllWords(domain?: string, difficulty?: number, limit = 100, offset = 0) {
    return this.client.get('/words', { params: { domain, difficulty, limit, offset } });
  }

  getWord(id: number) {
    return this.client.get(`/words/${id}`);
  }

  createWord(data: any) {
    return this.client.post('/words', data);
  }

  addWordToUser(wordId: number) {
    return this.client.post('/words/user/add', { wordId });
  }

  // Review endpoints
  getTodaysReviews(params?: {
    domain?: 'general' | 'business' | 'electrical' | 'toeic';
    minDifficulty?: number;
    maxDifficulty?: number;
    order?: 'difficulty_asc' | 'random';
    limit?: number;
  }) {
    return this.client.get('/review/today', { params });
  }

  submitAnswer(userWordId: number, isCorrect: boolean, reviewType: string) {
    return this.client.post('/review/answer', {
      user_word_id: userWordId,
      is_correct: isCorrect,
      review_type: reviewType,
    });
  }

  getWeakWords(limit?: number) {
    return this.client.get('/review/weak', { params: { limit } });
  }

  getStats() {
    return this.client.get('/review/stats');
  }

  getReviewHistory(days = 14, limit = 20) {
    return this.client.get('/review/history', { params: { days, limit } });
  }

  getSystemHealth() {
    return this.client.get('/health/details');
  }

  // AI endpoints
  generateExamples(word: string, domain: string) {
    return this.client.post('/ai/generate-examples', { word, domain });
  }

  generatePractice(word: string, sentence: string, exerciseType: 'fill_blank' | 'translation' | 'rewriting') {
    return this.client.post('/ai/generate-practice', {
      word,
      sentence,
      exercise_type: exerciseType,
    });
  }

  trainCorpus(topic: string, domain: string, urls?: string[], maxPages?: number) {
    return this.client.post('/ai/train-corpus', {
      topic,
      domain,
      urls,
      max_pages: maxPages,
    });
  }

  getCorpusStatus() {
    return this.client.get('/ai/corpus-status');
  }

  saveExample(wordId: number, sentence: string, type: string) {
    return this.client.post('/ai/save-example', {
      word_id: wordId,
      sentence,
      type,
    });
  }
}

export default new APIClient();
