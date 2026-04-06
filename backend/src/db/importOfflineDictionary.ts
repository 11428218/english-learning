import fs from 'fs';
import path from 'path';
import readline from 'readline';
import pool from './pool';
import {
  isTeachableDictionaryEntry,
  isPlaceholderDefinition,
  normalizeDictionaryDefinition,
  normalizeDictionaryWord,
} from './dictionaryQuality';

type DictionaryEntry = {
  word: string;
  definition: string;
  partOfSpeech: string;
};

const DEFAULT_DICTIONARY_PATH = path.resolve(__dirname, '../../data/offline-dictionary.sample.jsonl');
const DEFAULT_BATCH_SIZE = 1000;

const normalizePos = (value?: string): string => {
  if (!value) return 'unknown';
  const v = value.trim().toLowerCase();

  if (v.startsWith('n')) return 'noun';
  if (v.startsWith('v')) return 'verb';
  if (v.startsWith('adj')) return 'adjective';
  if (v.startsWith('adv')) return 'adverb';
  if (v.startsWith('prep')) return 'preposition';
  if (v.startsWith('pron')) return 'pronoun';
  if (v.startsWith('conj')) return 'conjunction';
  if (v.startsWith('interj')) return 'interjection';

  return v || 'unknown';
};

const calculateDifficulty = (word: string): number => {
  if (word.length <= 4) return 1;
  if (word.length <= 7) return 2;
  if (word.length <= 10) return 3;
  return 4;
};

const parseCsvLine = (line: string): string[] => {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];

    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (c === ',' && !inQuotes) {
      cols.push(current);
      current = '';
      continue;
    }

    current += c;
  }

  cols.push(current);
  return cols.map((c) => c.trim());
};

const buildEntryFromAnyObject = (raw: any): DictionaryEntry | null => {
  const word = normalizeDictionaryWord(raw?.word || raw?.term || raw?.headword || '');
  if (!word) return null;

  // Format A: DictionaryAPI style
  const meanings = Array.isArray(raw?.meanings) ? raw.meanings : [];
  if (meanings.length > 0) {
    const firstMeaning = meanings.find((m: any) => Array.isArray(m?.definitions) && m.definitions.length > 0);
    const definition = normalizeDictionaryDefinition(firstMeaning?.definitions?.[0]?.definition);
    if (definition && isTeachableDictionaryEntry(word, definition)) {
      return {
        word,
        definition,
        partOfSpeech: normalizePos(firstMeaning?.partOfSpeech),
      };
    }
  }

  // Format B: Kaikki/Wiktionary JSONL style
  const senses = Array.isArray(raw?.senses) ? raw.senses : [];
  if (senses.length > 0) {
    const glossFromSense = senses
      .map((s: any) => {
        if (Array.isArray(s?.glosses) && s.glosses.length > 0) return s.glosses[0];
        if (Array.isArray(s?.raw_glosses) && s.raw_glosses.length > 0) return s.raw_glosses[0];
        return null;
      })
      .find((v: string | null) => !!v);

    const definition = normalizeDictionaryDefinition(glossFromSense || raw?.gloss || raw?.definition);
    if (definition && isTeachableDictionaryEntry(word, definition)) {
      return {
        word,
        definition,
        partOfSpeech: normalizePos(raw?.pos || raw?.partOfSpeech),
      };
    }
  }

  // Format C: generic object shape
  const genericDefinition = normalizeDictionaryDefinition(raw?.definition || raw?.meaning || raw?.gloss);
  if (!genericDefinition || !isTeachableDictionaryEntry(word, genericDefinition)) return null;

  return {
    word,
    definition: genericDefinition,
    partOfSpeech: normalizePos(raw?.part_of_speech || raw?.partOfSpeech || raw?.pos),
  };
};

const parseJsonLine = (line: string): DictionaryEntry | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const raw = JSON.parse(trimmed);
    return buildEntryFromAnyObject(raw);
  } catch {
    return null;
  }
};

const parseCsvToEntry = (line: string): DictionaryEntry | null => {
  const cols = parseCsvLine(line);
  if (cols.length < 3) return null;

  // Expected: word,part_of_speech,definition
  const word = normalizeDictionaryWord(cols[0]);
  const partOfSpeech = normalizePos(cols[1]);
  const definition = normalizeDictionaryDefinition(cols.slice(2).join(','));

  if (!word || !definition || !isTeachableDictionaryEntry(word, definition)) return null;

  return {
    word,
    partOfSpeech,
    definition,
  };
};

const applyBatch = async (entries: DictionaryEntry[], insertMissing: boolean): Promise<number> => {
  if (entries.length === 0) return 0;

  const words = entries.map((e) => e.word);
  const definitions = entries.map((e) => e.definition);
  const partOfSpeech = entries.map((e) => e.partOfSpeech);

  if (!insertMissing) {
    const result = await pool.query(
      `
      WITH input AS (
        SELECT *
        FROM UNNEST(
          $1::text[],
          $2::text[],
          $3::text[]
        ) AS t(word, definition, part_of_speech)
      )
      UPDATE words w
      SET
        definition = input.definition,
        part_of_speech = input.part_of_speech
      FROM input
      WHERE w.word = input.word
      RETURNING w.id
      `,
      [words, definitions, partOfSpeech]
    );

    return result.rowCount || 0;
  }

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
    ON CONFLICT (word)
    DO UPDATE
      SET definition = EXCLUDED.definition,
          part_of_speech = EXCLUDED.part_of_speech
    RETURNING id
    `,
    [words, definitions, partOfSpeech, domains, difficulties]
  );

  return result.rowCount || 0;
};

const processLineByLine = async (
  dictionaryPath: string,
  parser: (line: string) => DictionaryEntry | null,
  insertMissing: boolean,
  batchSize: number
) => {
  const stream = fs.createReadStream(dictionaryPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let parsed = 0;
  let skipped = 0;
  let updated = 0;
  let batch: DictionaryEntry[] = [];
  let isFirstLine = true;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Ignore CSV header line
    if (isFirstLine && /^word\s*,/i.test(trimmed)) {
      isFirstLine = false;
      continue;
    }
    isFirstLine = false;

    const entry = parser(trimmed);
    if (!entry) {
      skipped += 1;
      continue;
    }

    parsed += 1;
    batch.push(entry);

    if (batch.length >= batchSize) {
      updated += await applyBatch(batch, insertMissing);
      batch = [];

      if (parsed % (batchSize * 5) === 0) {
        console.log(`Progress: parsed=${parsed}, updated=${updated}, skipped=${skipped}`);
      }
    }
  }

  if (batch.length > 0) {
    updated += await applyBatch(batch, insertMissing);
  }

  return { parsed, updated, skipped };
};

const processJsonArray = async (dictionaryPath: string, insertMissing: boolean, batchSize: number) => {
  const raw = await fs.promises.readFile(dictionaryPath, 'utf8');
  const data = JSON.parse(raw);
  const items: any[] = Array.isArray(data) ? data : [];

  let parsed = 0;
  let skipped = 0;
  let updated = 0;
  let batch: DictionaryEntry[] = [];

  for (const obj of items) {
    const entry = buildEntryFromAnyObject(obj);
    if (!entry) {
      skipped += 1;
      continue;
    }

    parsed += 1;
    batch.push(entry);

    if (batch.length >= batchSize) {
      updated += await applyBatch(batch, insertMissing);
      batch = [];
    }
  }

  if (batch.length > 0) {
    updated += await applyBatch(batch, insertMissing);
  }

  return { parsed, updated, skipped };
};

const importOfflineDictionary = async () => {
  const dictionaryPath = path.resolve(process.env.DICTIONARY_FILE || DEFAULT_DICTIONARY_PATH);
  const batchSize = Number(process.env.DICTIONARY_BATCH_SIZE || DEFAULT_BATCH_SIZE);
  const insertMissing = String(process.env.DICTIONARY_INSERT_MISSING || 'false').toLowerCase() === 'true';

  if (!fs.existsSync(dictionaryPath)) {
    throw new Error(`Dictionary file not found: ${dictionaryPath}`);
  }

  const ext = path.extname(dictionaryPath).toLowerCase();
  console.log(`Using dictionary file: ${dictionaryPath}`);
  console.log(`Mode: ${insertMissing ? 'upsert (insert missing + update existing)' : 'update existing words only'}`);
  console.log('Quality filter: enabled (removes low-value words such as article-prefixed compounds and placeholder entries)');

  let result: { parsed: number; updated: number; skipped: number };

  if (ext === '.csv') {
    result = await processLineByLine(dictionaryPath, parseCsvToEntry, insertMissing, batchSize);
  } else if (ext === '.json') {
    result = await processJsonArray(dictionaryPath, insertMissing, batchSize);
  } else {
    // Default to JSONL/NDJSON line parser
    result = await processLineByLine(dictionaryPath, parseJsonLine, insertMissing, batchSize);
  }

  const stats = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE part_of_speech IS NOT NULL AND part_of_speech <> 'unknown')::int AS with_pos,
      COUNT(*) FILTER (WHERE definition NOT LIKE 'English vocabulary word:%')::int AS with_real_definition
    FROM words
    `
  );

  console.log('Dictionary import complete.');
  console.log(`Parsed rows: ${result.parsed}`);
  console.log(`Updated rows: ${result.updated}`);
  console.log(`Skipped rows: ${result.skipped}`);
  console.log(`Words total: ${stats.rows[0].total}`);
  console.log(`Words with POS: ${stats.rows[0].with_pos}`);
  console.log(`Words with real definitions: ${stats.rows[0].with_real_definition}`);
};

if (require.main === module) {
  importOfflineDictionary()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Failed to import offline dictionary:', error);
      await pool.end();
      process.exit(1);
    });
}

export default importOfflineDictionary;