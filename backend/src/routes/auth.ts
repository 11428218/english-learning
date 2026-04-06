import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

/**
 * Authentication Routes
 */

// POST /auth/register - Register new user
router.post('/register', register);

// POST /auth/login - Login user
router.post('/login', login);

export default router;
