import pool from '../db/pool';
import { buildTeachabilitySqlClause } from '../db/dictionaryQuality';
import { calculateNextReview } from '../services/spacedRepetition';
import { ReviewResponse, ReviewWord } from '../types';

type ReviewScope = {
  domain?: 'general' | 'business' | 'electrical' | 'toeic';
  minDifficulty?: number;
  maxDifficulty?: number;
};

const ALLOWED_DOMAINS = new Set(['general', 'business', 'electrical', 'toeic']);
const ASSIGNMENT_REFRESH_MS = Math.max(parseInt(process.env.ASSIGNMENT_REFRESH_MS || '120000', 10), 10000);
const assignmentLastRun = new Map<string, number>();

const normalizeScope = (query: any): ReviewScope => {
  const scope: ReviewScope = {};

  const domain = String(query.domain || '').toLowerCase().trim();
  if (domain && ALLOWED_DOMAINS.has(domain)) {
    scope.domain = domain as ReviewScope['domain'];
  }

  const minDifficulty = Number.parseInt(String(query.minDifficulty || ''), 10);
  const maxDifficulty = Number.parseInt(String(query.maxDifficulty || ''), 10);

  if (Number.isFinite(minDifficulty)) {
    scope.minDifficulty = Math.min(Math.max(minDifficulty, 1), 10);
  }

  if (Number.isFinite(maxDifficulty)) {
    scope.maxDifficulty = Math.min(Math.max(maxDifficulty, 1), 10);
  }

  if (
    scope.minDifficulty !== undefined &&
    scope.maxDifficulty !== undefined &&
    scope.minDifficulty > scope.maxDifficulty
  ) {
    const temp = scope.minDifficulty;
    scope.minDifficulty = scope.maxDifficulty;
    scope.maxDifficulty = temp;
  }

  return scope;
};

const buildWordScopeClause = (scope: ReviewScope, alias: string, startParamIndex: number) => {
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  let paramIndex = startParamIndex;

  if (scope.domain) {
    clauses.push(`${alias}.domain = $${paramIndex}`);
    values.push(scope.domain);
    paramIndex += 1;
  }

  if (scope.minDifficulty !== undefined) {
    clauses.push(`${alias}.difficulty_level >= $${paramIndex}`);
    values.push(scope.minDifficulty);
    paramIndex += 1;
  }

  if (scope.maxDifficulty !== undefined) {
    clauses.push(`${alias}.difficulty_level <= $${paramIndex}`);
    values.push(scope.maxDifficulty);
    paramIndex += 1;
  }

  const whereSql = clauses.length > 0 ? ` AND ${clauses.join(' AND ')}` : '';
  return { whereSql, values, nextParamIndex: paramIndex };
};

/**
 * Review Controller
 * Handles spaced repetition review system
 */

/**
 * Get words due for review today
 */
const ensureUserWordAssignments = async (userId: number, scope: ReviewScope = {}) => {
  const scopeKey = `${scope.domain || 'all'}:${scope.minDifficulty ?? 'min'}:${scope.maxDifficulty ?? 'max'}`;
  const cacheKey = `${userId}:${scopeKey}`;
  const now = Date.now();
  const lastRunAt = assignmentLastRun.get(cacheKey);
  if (lastRunAt && now - lastRunAt < ASSIGNMENT_REFRESH_MS) {
    return;
  }

  const targetPoolSize = Math.min(
    Math.max(parseInt(process.env.REVIEW_POOL_SIZE || '400', 10), 50),
    5000
  );

  const scopeForJoin = buildWordScopeClause(scope, 'w', 2);

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    WHERE uw.user_id = $1
      AND ${buildTeachabilitySqlClause('w').trim()}
    ${scopeForJoin.whereSql}
    `,
    [userId, ...scopeForJoin.values]
  );

  const assignedCount = countResult.rows[0].count;

  // If a user's unreviewed pool is heavily skewed by initial import order (e.g. mostly "a*" words),
  // clear only unreviewed assignments once and reseed with randomized words.
  if (assignedCount >= Math.floor(targetPoolSize * 0.8) && !scope.domain && scope.minDifficulty === undefined && scope.maxDifficulty === undefined) {
    const skewResult = await pool.query(
      `
      SELECT COUNT(DISTINCT LOWER(SUBSTRING(w.word FROM 1 FOR 1)))::int AS initials
      FROM user_words uw
      JOIN words w ON w.id = uw.word_id
      WHERE uw.user_id = $1
        AND uw.total_reviews = 0
      `,
      [userId]
    );

    const initials = skewResult.rows[0]?.initials ?? 0;
    if (initials > 0 && initials <= 2) {
      await pool.query(
        `DELETE FROM user_words
         WHERE user_id = $1
           AND total_reviews = 0`,
        [userId]
      );
    } else {
      assignmentLastRun.set(cacheKey, Date.now());
      return;
    }
  }

  const refreshedCountResult = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    WHERE uw.user_id = $1
      AND ${buildTeachabilitySqlClause('w').trim()}
    ${scopeForJoin.whereSql}
    `,
    [userId, ...scopeForJoin.values]
  );

  const refreshedAssignedCount = refreshedCountResult.rows[0].count;
  if (refreshedAssignedCount >= targetPoolSize) {
    assignmentLastRun.set(cacheKey, Date.now());
    return;
  }

  const needed = targetPoolSize - refreshedAssignedCount;

  const scopeForInsert = buildWordScopeClause(scope, 'w', 3);

  await pool.query(
    `INSERT INTO user_words (user_id, word_id, next_review_date)
     SELECT $1, w.id, NOW()
     FROM words w
     WHERE NOT EXISTS (
       SELECT 1 FROM user_words uw WHERE uw.user_id = $1 AND uw.word_id = w.id
     )
     AND ${buildTeachabilitySqlClause('w').trim()}
     ${scopeForInsert.whereSql}
     ORDER BY w.difficulty_level ASC, RANDOM()
     LIMIT $2
     ON CONFLICT (user_id, word_id) DO NOTHING`,
    [userId, needed, ...scopeForInsert.values]
  );

  assignmentLastRun.set(cacheKey, Date.now());
};

export const getTodaysReviews = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const scope = normalizeScope(req.query);
    const requestedOrder = String(req.query.order || 'difficulty_asc').toLowerCase();
    const orderSql = requestedOrder === 'random'
      ? 'RANDOM()'
      : 'w.difficulty_level ASC, uw.review_interval ASC, w.word ASC';
    const dueLimit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 50, 1), 200);
    await ensureUserWordAssignments(userId, scope);

    const scopeForReview = buildWordScopeClause(scope, 'w', 3);

    const result = await pool.query(
      `
      SELECT 
        w.*,
        uw.id as user_word_id,
        uw.correct_streak,
        uw.review_interval,
        uw.ease_factor,
        json_agg(
          json_build_object(
            'id', e.id,
            'word_id', e.word_id,
            'sentence', e.sentence,
            'type', e.type
          )
        ) FILTER (WHERE e.id IS NOT NULL) as examples
      FROM user_words uw
      JOIN words w ON uw.word_id = w.id
      LEFT JOIN examples e ON w.id = e.word_id
      WHERE uw.user_id = $1 
        AND (uw.next_review_date IS NULL OR uw.next_review_date <= NOW())
        AND ${buildTeachabilitySqlClause('w').trim()}
        ${scopeForReview.whereSql}
      GROUP BY w.id, uw.id
      ORDER BY ${orderSql}
      LIMIT $2
      `,
      [userId, dueLimit, ...scopeForReview.values]
    );

    const response: ReviewResponse = {
      words: result.rows,
      count: result.rows.length,
    };

    res.json(response);
  } catch (err) {
    console.error('Error getting todays reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

/**
 * Submit review answer and update spaced repetition schedule
 */
export const submitAnswer = async (req: any, res: any) => {
  try {
    const { user_word_id, is_correct, review_type } = req.body;
    const userId = req.userId;

    if (user_word_id === undefined || is_correct === undefined) {
      return res.status(400).json({ error: 'user_word_id and is_correct required' });
    }

    // Get current user_word data
    const userWordResult = await pool.query(
      `SELECT * FROM user_words WHERE id = $1 AND user_id = $2`,
      [user_word_id, userId]
    );

    if (userWordResult.rows.length === 0) {
      return res.status(404).json({ error: 'User word not found' });
    }

    const userWord = userWordResult.rows[0];

    // Calculate next review date
    const quality = is_correct ? 5 : 1; // 5 = perfect, 1 = wrong
    const {
      nextReviewDate,
      newInterval,
      newEaseFactor,
      newStreak,
    } = calculateNextReview(
      userWord.ease_factor,
      userWord.review_interval,
      quality
    );

    // Update user_words table
    const updateResult = await pool.query(
      `UPDATE user_words
       SET next_review_date = $2,
           review_interval = $3,
           ease_factor = $4,
           correct_streak = $5,
           total_reviews = total_reviews + 1,
           times_correct = times_correct + $6,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        user_word_id,
        nextReviewDate,
        newInterval,
        newEaseFactor,
        newStreak,
        is_correct ? 1 : 0,
      ]
    );

    // Record in review history
    await pool.query(
      `INSERT INTO review_history (user_id, word_id, is_correct, review_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, userWord.word_id, is_correct, review_type || 'recognition']
    );

    res.json({
      success: true,
      userWord: updateResult.rows[0],
      nextReviewDate,
      newInterval,
    });
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

/**
 * Get user's weak words (frequently incorrect)
 */
export const getWeakWords = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 100);
    await ensureUserWordAssignments(userId);

    const result = await pool.query(
      `
      SELECT 
        w.*,
        uw.id as user_word_id,
        uw.ease_factor,
        uw.correct_streak,
        uw.total_reviews,
        uw.times_correct,
        json_agg(
          json_build_object(
            'id', e.id,
            'sentence', e.sentence,
            'type', e.type
          )
        ) FILTER (WHERE e.id IS NOT NULL) as examples
      FROM user_words uw
      JOIN words w ON uw.word_id = w.id
      LEFT JOIN examples e ON w.id = e.word_id
      WHERE uw.user_id = $1
        AND uw.total_reviews > 0
        AND ${buildTeachabilitySqlClause('w').trim()}
      GROUP BY w.id, uw.id
      ORDER BY uw.ease_factor ASC, 
               CAST(uw.times_correct AS FLOAT) / uw.total_reviews ASC,
               uw.correct_streak ASC
      LIMIT $2
      `,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting weak words:', err);
    res.status(500).json({ error: 'Failed to fetch weak words' });
  }
};

/**
 * Get user's learning statistics
 */
export const getStats = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    await ensureUserWordAssignments(userId);

    const statsResult = await pool.query(
      `
      SELECT 
        COUNT(DISTINCT uw.id) as total_words,
        COUNT(DISTINCT CASE WHEN uw.next_review_date IS NULL OR uw.next_review_date <= NOW() THEN uw.id END) as due_today,
        SUM(uw.total_reviews) as total_reviews,
        SUM(uw.times_correct) as times_correct,
        AVG(uw.ease_factor) as avg_ease_factor
      FROM user_words uw
      JOIN words w ON w.id = uw.word_id
      WHERE uw.user_id = $1
        AND ${buildTeachabilitySqlClause('w').trim()}
      `,
      [userId]
    );

    const historyResult = await pool.query(
      `
      SELECT 
        CAST(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as accuracy
      FROM review_history
      JOIN words w ON w.id = review_history.word_id
      WHERE user_id = $1
        AND ${buildTeachabilitySqlClause('w').trim()}
      `,
      [userId]
    );

    res.json({
      stats: statsResult.rows[0],
      accuracy: historyResult.rows[0]?.accuracy || 0,
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * Get user's review history and daily progress
 */
export const getReviewHistory = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const days = parseInt(req.query.days as string, 10) || 14;
    const limit = parseInt(req.query.limit as string, 10) || 30;

    const dailyResult = await pool.query(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS total_reviews,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct_reviews,
        ROUND(
          CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100
          END,
          2
        ) AS accuracy
      FROM review_history
      JOIN words w ON w.id = review_history.word_id
      WHERE user_id = $1
        AND created_at >= NOW() - ($2::text || ' days')::interval
        AND ${buildTeachabilitySqlClause('w').trim()}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
      `,
      [userId, days]
    );

    const recentResult = await pool.query(
      `
      SELECT
        rh.id,
        rh.is_correct,
        rh.review_type,
        rh.created_at,
        w.word,
        w.domain
      FROM review_history rh
      JOIN words w ON rh.word_id = w.id
      WHERE rh.user_id = $1
        AND ${buildTeachabilitySqlClause('w').trim()}
      ORDER BY rh.created_at DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    res.json({
      daily: dailyResult.rows,
      recent: recentResult.rows,
    });
  } catch (err) {
    console.error('Error getting review history:', err);
    res.status(500).json({ error: 'Failed to fetch review history' });
  }
};
