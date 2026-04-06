import axios from 'axios';
import pool from './pool';
import { filterTeachableDictionaryWords } from './dictionaryQuality';

/**
 * Imports a large English word list into the words table.
 * Source list: https://github.com/dwyl/english-words
 */

const WORDS_SOURCE_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

const DEFAULT_BATCH_SIZE = 2000;

const calculateDifficulty = (word: string): number => {
  if (word.length <= 4) return 1;
  if (word.length <= 7) return 2;
  if (word.length <= 10) return 3;
  return 4;
};

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return chunks;
};

const sanitizeWords = (rawText: string): string[] => {
  const lines = rawText.split(/\r?\n/);
  return filterTeachableDictionaryWords(lines);
};

const insertBatch = async (words: string[]) => {
  if (words.length === 0) return;

  const definitions = words.map((word) => `English vocabulary word: ${word}`);
  const partsOfSpeech = words.map(() => 'unknown');
  const domains = words.map(() => 'general');
  const difficulties = words.map((word) => calculateDifficulty(word));

  await pool.query(
    `
      INSERT INTO words (word, definition, part_of_speech, domain, difficulty_level)
      SELECT *
      FROM UNNEST(
        $1::text[],
        $2::text[],
        $3::text[],
        $4::text[],
        $5::int[]
      )
      ON CONFLICT (word) DO NOTHING
    `,
    [words, definitions, partsOfSpeech, domains, difficulties]
  );
};

const importEnglishWords = async () => {
  try {
    console.log('Downloading English word list...');

    const response = await axios.get<string>(WORDS_SOURCE_URL, {
      responseType: 'text',
      timeout: 120000,
      headers: {
        'User-Agent': 'ProLingual-WordImporter/1.0',
      },
    });

    const allWords = sanitizeWords(response.data);
    const batchSize = Number(process.env.WORD_IMPORT_BATCH_SIZE || DEFAULT_BATCH_SIZE);
    const limitRaw = process.env.WORD_IMPORT_LIMIT;
    const limit = limitRaw ? Math.max(1, Number(limitRaw)) : null;

    const targetWords = limit ? allWords.slice(0, limit) : allWords;
    const batches = chunkArray(targetWords, batchSize);

    console.log(`Found ${allWords.length} valid words.`);
    console.log(`Importing ${targetWords.length} words in ${batches.length} batches...`);

    let processed = 0;

    for (const [index, batch] of batches.entries()) {
      await insertBatch(batch);
      processed += batch.length;

      if ((index + 1) % 10 === 0 || index === batches.length - 1) {
        console.log(`Progress: ${processed}/${targetWords.length}`);
      }
    }

    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM words');
    console.log(`Import complete. Total words in database: ${countResult.rows[0].total}`);
  } catch (error) {
    console.error('Failed to import English words:', error);
    throw error;
  }
};

if (require.main === module) {
  importEnglishWords()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

export default importEnglishWords;
