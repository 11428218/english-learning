import pool from '../db/pool';
import {
  generateExampleSentences,
  generatePracticeExercise,
  getLocalCorpusStatus,
  trainLocalCorpus,
} from '../services/aiService';

/**
 * AI Controller
 * Handles AI-powered content generation
 */

export const generateExamples = async (req: any, res: any) => {
  try {
    const { word, domain } = req.body;

    if (!word || !domain) {
      return res.status(400).json({ error: 'Word and domain required' });
    }

    // Generate sentences from locally-trained corpus
    const sentences = await generateExampleSentences(word, domain);

    res.json({
      word,
      domain,
      sentences,
    });
  } catch (err: any) {
    console.error('Error generating examples:', err);
    res.status(500).json({ error: err.message || 'Failed to generate examples' });
  }
};

export const generatePractice = async (req: any, res: any) => {
  try {
    const { word, sentence, exercise_type, domain } = req.body;

    if (!word || !exercise_type) {
      return res.status(400).json({ error: 'word and exercise_type are required' });
    }

    const result = await generatePracticeExercise(word, sentence || '', exercise_type, domain || 'general');
    return res.json(result);
  } catch (err: any) {
    console.error('Error generating practice:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate practice' });
  }
};

export const trainCorpus = async (req: any, res: any) => {
  try {
    const { topic, domain, urls, max_pages } = req.body;

    if (!topic || !domain) {
      return res.status(400).json({ error: 'topic and domain are required' });
    }

    const result = await trainLocalCorpus({
      topic,
      domain,
      urls: Array.isArray(urls) ? urls : undefined,
      maxPages: typeof max_pages === 'number' ? max_pages : undefined,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Error training local corpus:', err);
    return res.status(500).json({ error: err.message || 'Failed to train corpus' });
  }
};

export const corpusStatus = async (_req: any, res: any) => {
  try {
    const status = await getLocalCorpusStatus();
    return res.json(status);
  } catch (err: any) {
    console.error('Error fetching corpus status:', err);
    return res.status(500).json({ error: err.message || 'Failed to get corpus status' });
  }
};

/**
 * Save generated example to database
 */
export const saveExample = async (req: any, res: any) => {
  try {
    const { word_id, sentence, type } = req.body;

    if (!word_id || !sentence) {
      return res.status(400).json({ error: 'word_id and sentence required' });
    }

    const result = await pool.query(
      `INSERT INTO examples (word_id, sentence, type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [word_id, sentence, type || 'general']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving example:', err);
    res.status(500).json({ error: 'Failed to save example' });
  }
};
