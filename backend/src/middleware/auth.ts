import pool from '../db/pool';
import * as jwt from 'jsonwebtoken';
import { DecodedToken } from '../types';

/**
 * Middleware for JWT authentication
 * Validates token and adds userId to request
 */
let cachedGuestUserId: number | null = null;

const ensureGuestUserId = async (): Promise<number> => {
  if (cachedGuestUserId) {
    return cachedGuestUserId;
  }

  const guestEmail = process.env.DEMO_USER_EMAIL || 'guest@prolingual.local';
  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email)
     DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [guestEmail, 'guest-mode-no-login']
  );

  cachedGuestUserId = result.rows[0].id;
  return result.rows[0].id;
};

export const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as DecodedToken;

        req.userId = decoded.userId;
        return next();
      } catch {
        // Fall back to guest mode when token is invalid.
      }
    }

    req.userId = await ensureGuestUserId();
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resolve user context' });
  }
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};
