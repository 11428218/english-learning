import { Router } from 'express';
import {
  getAllWords,
  getWord,
  createWord,
  updateWord,
  deleteWord,
  addWordToUser,
} from '../controllers/wordController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Word Management Routes
 */

// GET /words - Get all words with optional filters
router.get('/', getAllWords);

// POST /words - Create new word (authenticated)
router.post('/', authMiddleware, createWord);

// GET /words/:id - Get specific word
router.get('/:id', getWord);

// PUT /words/:id - Update word (authenticated)
router.put('/:id', authMiddleware, updateWord);

// DELETE /words/:id - Delete word (authenticated)
router.delete('/:id', authMiddleware, deleteWord);

// POST /words/add - Add word to user's list (authenticated)
router.post('/user/add', authMiddleware, addWordToUser);

export default router;
