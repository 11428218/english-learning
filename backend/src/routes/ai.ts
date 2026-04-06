import { Router } from 'express';
import {
	corpusStatus,
	generateExamples,
	generatePractice,
	saveExample,
	trainCorpus,
} from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * AI-Powered Content Generation Routes (Authenticated)
 */

// POST /ai/generate-examples - Generate example sentences for a word
router.post('/generate-examples', authMiddleware, generateExamples);

// POST /ai/generate-practice - Generate practice exercise from local corpus
router.post('/generate-practice', authMiddleware, generatePractice);

// POST /ai/train-corpus - Crawl web pages and train local corpus
router.post('/train-corpus', authMiddleware, trainCorpus);

// GET /ai/corpus-status - Get local corpus summary
router.get('/corpus-status', authMiddleware, corpusStatus);

// POST /ai/save-example - Save generated example to database
router.post('/save-example', authMiddleware, saveExample);

export default router;
