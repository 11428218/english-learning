import { Router } from 'express';
import {
  getTodaysReviews,
  submitAnswer,
  getWeakWords,
  getStats,
  getReviewHistory,
} from '../controllers/reviewController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Review & Spaced Repetition Routes (All authenticated)
 */

// GET /review/today - Get words to review today
router.get('/today', authMiddleware, getTodaysReviews);

// POST /review/answer - Submit review answer
router.post('/answer', authMiddleware, submitAnswer);

// GET /review/weak - Get weak words
router.get('/weak', authMiddleware, getWeakWords);

// GET /review/stats - Get user statistics
router.get('/stats', authMiddleware, getStats);

// GET /review/history - Get daily progress and recent review records
router.get('/history', authMiddleware, getReviewHistory);

export default router;
