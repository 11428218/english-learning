import pool from '../db/pool';
import { buildTeachabilitySqlClause } from '../db/dictionaryQuality';
import { Word, ReviewResponse, ReviewWord } from '../types';
import { calculateNextReview } from '../services/spacedRepetition';

/**
 * Words Controller
 * Handles CRUD operations for vocabulary
 */

export const getAllWords = async (req: any, res: any) => {
  try {
    const { domain, difficulty } = req.query;
    const includeLowValue = String(req.query.includeLowValue || '').toLowerCase() === 'true';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const sortMode = String(req.query.sort || 'difficulty').toLowerCase();

    let query = `
      SELECT w.*, 
        json_agg(
          json_build_object(
            'id', e.id,
            'sentence', e.sentence,
            'type', e.type
          )
        ) as examples
      FROM words w
      LEFT JOIN examples e ON w.id = e.word_id
    `;

    const conditions = [];
    const values = [];

    if (domain) {
      conditions.push(`w.domain = $${values.length + 1}`);
      values.push(domain);
    }

    if (difficulty) {
      conditions.push(`w.difficulty_level = $${values.length + 1}`);
      values.push(parseInt(difficulty));
    }

    if (!includeLowValue) {
      conditions.push(buildTeachabilitySqlClause('w').trim());
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const orderSql = sortMode === 'alpha'
      ? 'w.word ASC'
      : 'w.difficulty_level ASC, w.word ASC';

    query += ` GROUP BY w.id ORDER BY ${orderSql} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch words' });
  }
};

export const getWord = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT w.*, 
        json_agg(
          json_build_object(
            'id', e.id,
            'sentence', e.sentence,
            'type', e.type
          )
        ) as examples
      FROM words w
      LEFT JOIN examples e ON w.id = e.word_id
      WHERE w.id = $1
      GROUP BY w.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch word' });
  }
};

export const createWord = async (req: any, res: any) => {
  try {
    const { word, definition, part_of_speech, domain, difficulty_level, examples } =
      req.body;

    if (!word || !definition) {
      return res.status(400).json({ error: 'Word and definition required' });
    }

    const wordResult = await pool.query(
      `INSERT INTO words (word, definition, part_of_speech, domain, difficulty_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [word, definition, part_of_speech || 'noun', domain || 'general', difficulty_level || 1]
    );

    const createdWord = wordResult.rows[0];

    // Add examples if provided
    if (examples && Array.isArray(examples)) {
      for (const example of examples) {
        await pool.query(
          `INSERT INTO examples (word_id, sentence, type)
           VALUES ($1, $2, $3)`,
          [createdWord.id, example.sentence, example.type || 'general']
        );
      }
    }

    const fullWord = await pool.query(
      `
      SELECT w.*, 
        json_agg(
          json_build_object(
            'id', e.id,
            'sentence', e.sentence,
            'type', e.type
          )
        ) as examples
      FROM words w
      LEFT JOIN examples e ON w.id = e.word_id
      WHERE w.id = $1
      GROUP BY w.id
      `,
      [createdWord.id]
    );

    res.status(201).json(fullWord.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Word already exists' });
    }
    res.status(500).json({ error: 'Failed to create word' });
  }
};

export const updateWord = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { definition, part_of_speech, domain, difficulty_level } = req.body;

    const result = await pool.query(
      `UPDATE words 
       SET definition = COALESCE($2, definition),
           part_of_speech = COALESCE($3, part_of_speech),
           domain = COALESCE($4, domain),
           difficulty_level = COALESCE($5, difficulty_level)
       WHERE id = $1
       RETURNING *`,
      [id, definition, part_of_speech, domain, difficulty_level]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update word' });
  }
};

export const deleteWord = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM words WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete word' });
  }
};

/**
 * Add word to user's learning list
 */
export const addWordToUser = async (req: any, res: any) => {
  try {
    const { wordId } = req.body;
    const userId = req.userId;

    if (!wordId) {
      return res.status(400).json({ error: 'Word ID required' });
    }

    const result = await pool.query(
      `INSERT INTO user_words (user_id, word_id, next_review_date)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, word_id) DO NOTHING
       RETURNING *`,
      [userId, wordId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Word already added to user' });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add word to user' });
  }
};
