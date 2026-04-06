import fs from 'fs';
import path from 'path';
const wordnetDb = require('wordnet-db') as { path?: string };
import { isTeachableDictionaryEntry } from './dictionaryQuality';

/**
 * Build a structured dictionary dataset from WordNet data files.
 * Output:
 * - data/wordnet-structured.json
 * - data/wordnet-structured.jsonl
 */

type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb';

interface WordEntry {
  word: string;
  part_of_speech: PartOfSpeech;
  definition: string;
  source: 'wordnet';
  examples: {
    daily: string;
    business: string;
    technical: string;
  };
}

interface BuildStats {
  totalSynsetsParsed: number;
  totalCandidateWords: number;
  totalEntriesWritten: number;
  skippedInvalidWords: number;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const OUTPUT_JSON = path.join(DATA_DIR, 'wordnet-structured.json');
const OUTPUT_JSONL = path.join(DATA_DIR, 'wordnet-structured.jsonl');

const WORDNET_DATA_FILES: Array<{ file: string; pos: PartOfSpeech }> = [
  { file: 'data.noun', pos: 'noun' },
  { file: 'data.verb', pos: 'verb' },
  { file: 'data.adj', pos: 'adjective' },
  { file: 'data.adv', pos: 'adverb' },
];

const normalizeDefinition = (value: string): string => {
  const cleaned = value
    .replace(/^"+|"+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return 'WordNet definition unavailable.';
  }

  return cleaned[0].toUpperCase() + cleaned.slice(1);
};

const normalizeWord = (raw: string): string | null => {
  const normalized = raw.replace(/_/g, ' ').toLowerCase().trim();

  // Keep single-token words for flashcard UX consistency.
  if (normalized.includes(' ')) return null;
  if (!/^[a-z][a-z'-]*$/.test(normalized)) return null;

  return normalized;
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pickByHash = (word: string, variants: string[]): string => {
  if (variants.length === 0) return '';
  const index = hashString(word) % variants.length;
  return variants[index];
};

const toNounPhrase = (definition: string): string => {
  const lowered = definition.replace(/[.]+$/g, '').trim().toLowerCase();
  if (lowered.startsWith('to ')) {
    return `the act of ${lowered.slice(3)}`;
  }
  return lowered;
};

const buildExamples = (word: string, definition: string): WordEntry['examples'] => {
  const concept = toNounPhrase(definition);

  const dailyTemplates = [
    `I used the word "${word}" in class today to describe ${concept}.`,
    `When reading news articles, I often see "${word}" used for ${concept}.`,
    `To improve my vocabulary, I wrote a sentence with "${word}" about ${concept}.`,
  ];

  const businessTemplates = [
    `During the meeting, the team used "${word}" to explain ${concept}.`,
    `In a business report, "${word}" can clarify ${concept} for stakeholders.`,
    `Our manager highlighted "${word}" when discussing ${concept} in strategy planning.`,
  ];

  const technicalTemplates = [
    `In electrical engineering discussions, "${word}" is useful when describing ${concept}.`,
    `The lab report referenced "${word}" to model ${concept} in a circuit scenario.`,
    `Engineers may use "${word}" while analyzing ${concept} in technical documentation.`,
  ];

  return {
    daily: pickByHash(`${word}:daily`, dailyTemplates),
    business: pickByHash(`${word}:business`, businessTemplates),
    technical: pickByHash(`${word}:technical`, technicalTemplates),
  };
};

const parseDataFile = (
  filePath: string,
  pos: PartOfSpeech,
  entriesByKey: Map<string, WordEntry>,
  stats: BuildStats
): void => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.startsWith('  ')) continue;

    const parts = line.split(' | ');
    if (parts.length < 2) continue;

    const left = parts[0];
    const gloss = parts.slice(1).join(' | ');
    const tokens = left.trim().split(/\s+/);

    if (tokens.length < 6) continue;

    const wordCountHex = tokens[3];
    const wordCount = Number.parseInt(wordCountHex, 16);

    if (!Number.isFinite(wordCount) || wordCount <= 0) continue;

    const definition = normalizeDefinition(gloss.split(';')[0] || gloss);
    stats.totalSynsetsParsed += 1;

    for (let i = 0; i < wordCount; i += 1) {
      const wordTokenIndex = 4 + i * 2;
      const lemmaRaw = tokens[wordTokenIndex];

      if (!lemmaRaw) continue;

      if (/[A-Z]/.test(lemmaRaw)) {
        stats.skippedInvalidWords += 1;
        continue;
      }

      const word = normalizeWord(lemmaRaw);
      if (!word || !isTeachableDictionaryEntry(word, definition)) {
        stats.skippedInvalidWords += 1;
        continue;
      }

      stats.totalCandidateWords += 1;
      const key = `${word}::${pos}`;

      if (!entriesByKey.has(key)) {
        entriesByKey.set(key, {
          word,
          part_of_speech: pos,
          definition,
          source: 'wordnet',
          examples: buildExamples(word, definition),
        });
      }
    }
  }
};

const writeStructuredJson = (entries: WordEntry[]): void => {
  const payload = {
    metadata: {
      source: 'WordNet 3.0',
      generated_at: new Date().toISOString(),
      total_entries: entries.length,
      schema: {
        word: 'string',
        part_of_speech: 'noun|verb|adjective|adverb',
        definition: 'string',
        source: 'wordnet',
        examples: {
          daily: 'string',
          business: 'string',
          technical: 'string',
        },
      },
    },
    entries,
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(payload, null, 2), 'utf-8');
};

const writeStructuredJsonl = (entries: WordEntry[]): void => {
  const lines = entries.map((entry) => JSON.stringify(entry));
  fs.writeFileSync(OUTPUT_JSONL, `${lines.join('\n')}\n`, 'utf-8');
};

const buildWordNetDataset = async (): Promise<void> => {
  const stats: BuildStats = {
    totalSynsetsParsed: 0,
    totalCandidateWords: 0,
    totalEntriesWritten: 0,
    skippedInvalidWords: 0,
  };

  const entriesByKey = new Map<string, WordEntry>();

  const wnPath = wordnetDb?.path;
  if (!wnPath || !fs.existsSync(wnPath)) {
    throw new Error('wordnet-db package path not found. Please install dependency: wordnet-db');
  }

  for (const fileInfo of WORDNET_DATA_FILES) {
    const filePath = path.join(wnPath, fileInfo.file);

    if (!fs.existsSync(filePath)) {
      throw new Error(`WordNet data file not found: ${filePath}`);
    }

    console.log(`Parsing ${fileInfo.file}...`);
    parseDataFile(filePath, fileInfo.pos, entriesByKey, stats);
  }

  let entries = Array.from(entriesByKey.values());

  const limitRaw = process.env.WORDNET_LIMIT;
  if (limitRaw) {
    const limit = Math.max(1, Number(limitRaw));
    entries = entries.slice(0, limit);
  }

  entries.sort((a, b) => {
    if (a.word === b.word) return a.part_of_speech.localeCompare(b.part_of_speech);
    return a.word.localeCompare(b.word);
  });

  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  writeStructuredJson(entries);
  writeStructuredJsonl(entries);

  stats.totalEntriesWritten = entries.length;

  console.log('WordNet structured dataset build complete.');
  console.log(JSON.stringify({ stats, output: { json: OUTPUT_JSON, jsonl: OUTPUT_JSONL } }, null, 2));
};

buildWordNetDataset().catch((err) => {
  console.error('Failed to build WordNet dataset:', err);
  process.exit(1);
});
