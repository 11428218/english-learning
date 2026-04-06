import fs from 'fs';
import path from 'path';
import readline from 'readline';
import pool from './pool';
import {
  isTeachableDictionaryEntry,
  normalizeDictionaryDefinition,
  normalizeDictionaryWord,
} from './dictionaryQuality';

type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'unknown';

interface WordNetStructuredEntry {
  word: string;
  part_of_speech: PartOfSpeech;
  definition: string;
  source?: string;
  examples?: {
    daily?: string;
    business?: string;
    technical?: string;
  };
}

const DEFAULT_JSONL_PATH = path.resolve(__dirname, '../../data/wordnet-structured.jsonl');
const DEFAULT_BATCH_SIZE = 800;

const normalizePos = (value?: string): PartOfSpeech => {
  if (!value) return 'unknown';
  const v = value.toLowerCase();
  if (v.startsWith('n')) return 'noun';
  if (v.startsWith('v')) return 'verb';
  if (v.startsWith('adj')) return 'adjective';
  if (v.startsWith('adv')) return 'adverb';
  return 'unknown';
};

const calculateDifficulty = (word: string): number => {
  if (word.length <= 4) return 1;
  if (word.length <= 7) return 2;
  if (word.length <= 10) return 3;
  return 4;
};

const posRank = (pos: PartOfSpeech): number => {
  if (pos === 'noun') return 4;
  if (pos === 'verb') return 3;
  if (pos === 'adjective') return 2;
  if (pos === 'adverb') return 1;
  return 0;
};

const dedupeEntriesByWord = (entries: WordNetStructuredEntry[]): WordNetStructuredEntry[] => {
  const merged = new Map<string, WordNetStructuredEntry>();

  for (const entry of entries) {
    const existing = merged.get(entry.word);
    if (!existing) {
      merged.set(entry.word, entry);
      continue;
    }

    const existingRank = posRank(existing.part_of_speech || 'unknown');
    const currentRank = posRank(entry.part_of_speech || 'unknown');
    const currentDefScore = entry.definition.length;
    const existingDefScore = existing.definition.length;

    const shouldReplace =
      currentRank > existingRank ||
      (currentRank === existingRank && currentDefScore > existingDefScore);

    if (shouldReplace) {
      merged.set(entry.word, entry);
    }
  }

  return Array.from(merged.values());
};

const parseLine = (line: string): WordNetStructuredEntry | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as WordNetStructuredEntry;
    const word = normalizeDictionaryWord(parsed.word || '');
    const definition = normalizeDictionaryDefinition(parsed.definition);

    if (!word || !definition || !isTeachableDictionaryEntry(word, definition)) return null;

    return {
      word,
      definition,
      part_of_speech: normalizePos(parsed.part_of_speech),
      source: parsed.source || 'wordnet',
      examples: {
        daily: normalizeDictionaryDefinition(parsed.examples?.daily) || undefined,
        business: normalizeDictionaryDefinition(parsed.examples?.business) || undefined,
        technical: normalizeDictionaryDefinition(parsed.examples?.technical) || undefined,
      },
    };
  } catch {
    return null;
  }
};

const upsertWords = async (entries: WordNetStructuredEntry[]) => {
  const words = entries.map((e) => e.word);
  const definitions = entries.map((e) => e.definition);
  const pos = entries.map((e) => e.part_of_speech || 'unknown');
  const domains = entries.map(() => 'general');
  const difficulties = entries.map((e) => calculateDifficulty(e.word));

  const result = await pool.query(
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
      ON CONFLICT (word) DO UPDATE
      SET
        definition = EXCLUDED.definition,
        part_of_speech = CASE
          WHEN words.part_of_speech IS NULL OR words.part_of_speech = '' OR words.part_of_speech = 'unknown'
            THEN EXCLUDED.part_of_speech
          ELSE words.part_of_speech
        END,
        domain = CASE
          WHEN words.domain IS NULL OR words.domain = '' THEN EXCLUDED.domain
          ELSE words.domain
        END,
        difficulty_level = GREATEST(COALESCE(words.difficulty_level, 1), EXCLUDED.difficulty_level)
      RETURNING id, word
    `,
    [words, definitions, pos, domains, difficulties]
  );

  const wordIdMap = new Map<string, number>();
  for (const row of result.rows) {
    wordIdMap.set(row.word, row.id);
  }

  return wordIdMap;
};

const insertExamples = async (
  entries: WordNetStructuredEntry[],
  wordIdMap: Map<string, number>
): Promise<number> => {
  const wordIds: number[] = [];
  const sentences: string[] = [];
  const types: string[] = [];

  for (const entry of entries) {
    const wordId = wordIdMap.get(entry.word);
    if (!wordId) continue;

    const examples = entry.examples || {};
    const triplets: Array<{ sentence?: string; type: 'daily' | 'business' | 'technical' }> = [
      { sentence: examples.daily, type: 'daily' },
      { sentence: examples.business, type: 'business' },
      { sentence: examples.technical, type: 'technical' },
    ];

    for (const item of triplets) {
      const sentence = normalizeDictionaryDefinition(item.sentence || '');
      if (!sentence) continue;

      wordIds.push(wordId);
      sentences.push(sentence);
      types.push(item.type);
    }
  }

  if (wordIds.length === 0) return 0;

  const inserted = await pool.query(
    `
      INSERT INTO examples (word_id, sentence, type)
      SELECT x.word_id, x.sentence, x.type
      FROM UNNEST($1::int[], $2::text[], $3::text[]) AS x(word_id, sentence, type)
      WHERE NOT EXISTS (
        SELECT 1
        FROM examples e
        WHERE e.word_id = x.word_id
          AND e.sentence = x.sentence
          AND e.type = x.type
      )
    `,
    [wordIds, sentences, types]
  );

  return inserted.rowCount || 0;
};

const importWordNetStructured = async (): Promise<void> => {
  const inputFile = process.env.WORDNET_STRUCTURED_FILE || DEFAULT_JSONL_PATH;
  const batchSize = Number(process.env.WORDNET_IMPORT_BATCH_SIZE || DEFAULT_BATCH_SIZE);

  if (!fs.existsSync(inputFile)) {
    throw new Error(`WordNet structured file not found: ${inputFile}`);
  }

  const stream = fs.createReadStream(inputFile, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let parsed = 0;
  let skipped = 0;
  let insertedExamples = 0;
  let processed = 0;
  let batch: WordNetStructuredEntry[] = [];

  const flush = async () => {
    if (batch.length === 0) return;

    const deduped = dedupeEntriesByWord(batch);

    const idMap = await upsertWords(deduped);
    const exCount = await insertExamples(deduped, idMap);
    insertedExamples += exCount;
    processed += deduped.length;

    if (processed % 5000 === 0 || batch.length < batchSize) {
      console.log(
        `Progress: parsed=${parsed}, processed=${processed}, skipped=${skipped}, examplesInserted=${insertedExamples}`
      );
    }

    batch = [];
  };

  for await (const line of rl) {
    const entry = parseLine(line);
    if (!entry) {
      skipped += 1;
      continue;
    }

    parsed += 1;
    batch.push(entry);

    if (batch.length >= batchSize) {
      await flush();
    }
  }

  await flush();

  const coverage = await pool.query(`
    SELECT
      COUNT(*)::int AS words_total,
      COUNT(*) FILTER (WHERE part_of_speech IS NOT NULL AND part_of_speech <> 'unknown')::int AS words_with_pos,
      COUNT(*) FILTER (WHERE definition IS NOT NULL AND definition <> '' AND definition NOT ILIKE 'English vocabulary word:%')::int AS words_with_real_definition,
      (SELECT COUNT(*)::int FROM examples WHERE type = 'daily') AS daily_examples,
      (SELECT COUNT(*)::int FROM examples WHERE type = 'business') AS business_examples,
      (SELECT COUNT(*)::int FROM examples WHERE type = 'technical') AS technical_examples
    FROM words
  `);

  console.log('WordNet structured import complete.');
  console.log(
    JSON.stringify(
      {
        parsed,
        skipped,
        processed,
        insertedExamples,
        coverage: coverage.rows[0],
      },
      null,
      2
    )
  );
};

importWordNetStructured()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Failed to import WordNet structured data:', err);
    await pool.end();
    process.exit(1);
  });
