/**
 * Spaced Repetition Service
 * Implements SM-2 algorithm for optimal learning
 * 
 * SM-2 Algorithm:
 * - I(1) := 1 (first interval)
 * - I(2) := 6 (second interval)
 * - I(n) := I(n-1) * EF (subsequent intervals)
 * 
 * EF (ease factor) modification:
 * EF' := EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
 * Where quality is 0-5 (0=wrong, 5=perfect)
 */

/**
 * Calculate next review date based on spaced repetition algorithm
 */
export const calculateNextReview = (
  easeFactor: number,
  reviewInterval: number,
  quality: number // 0-5, where 5 = perfect, 0 = complete failure
): {
  nextReviewDate: Date;
  newInterval: number;
  newEaseFactor: number;
  newStreak: number;
} => {
  let newEaseFactor = easeFactor;
  let newInterval = reviewInterval;
  let newStreak = 0;

  // Update ease factor based on response quality
  newEaseFactor = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor of 1.3

  // Update interval based on response
  if (quality < 3) {
    // Wrong answer - reset interval
    newInterval = 1;
    newStreak = 0;
  } else {
    // Correct answer - increase interval
    if (reviewInterval === 0 || reviewInterval === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(reviewInterval * newEaseFactor);
    }
    newStreak = 1;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    nextReviewDate,
    newInterval,
    newEaseFactor: Math.round(newEaseFactor * 100) / 100,
    newStreak,
  };
};

/**
 * Get words that need review today
 * Query for words where next_review_date <= today
 */
export const getTodaysReviews = (userId: number) => {
  const query = `
    SELECT 
      w.*,
      uw.id as user_word_id,
      uw.correct_streak,
      uw.review_interval,
      uw.ease_factor,
      json_agg(
        json_build_object(
          'id', e.id,
          'sentence', e.sentence,
          'type', e.type
        )
      ) as examples
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    LEFT JOIN examples e ON w.id = e.word_id
    WHERE uw.user_id = $1 
      AND (uw.next_review_date IS NULL OR uw.next_review_date <= NOW())
    GROUP BY w.id, uw.id
    ORDER BY uw.review_interval ASC
  `;
  return query;
};

/**
 * Get weak words (frequently incorrect answers)
 * Words with low ease factor and high error rate
 */
export const getWeakWords = (userId: number) => {
  const query = `
    SELECT 
      uw.*,
      w.*,
      (
        SELECT COUNT(*) * 100 / COUNT(CASE WHEN rh.is_correct THEN 1 END)
        FROM review_history rh
        WHERE rh.user_id = $1 AND rh.word_id = w.id
      ) as error_rate
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    WHERE uw.user_id = $1
      AND uw.ease_factor < 2.0
    ORDER BY uw.ease_factor ASC, uw.correct_streak ASC
    LIMIT 10
  `;
  return query;
};
