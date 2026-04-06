import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * Local AI service:
 * 1) Crawl public web pages
 * 2) Save corpus locally
 * 3) Generate examples/practice from trained corpus
 */

type Domain = 'general' | 'business' | 'electrical' | 'toeic';

interface CorpusDocument {
  id: string;
  sourceUrl: string;
  topic: string;
  domain: Domain;
  text: string;
  createdAt: string;
}

interface LocalCorpusStore {
  version: number;
  documents: CorpusDocument[];
}

interface TrainCorpusInput {
  topic: string;
  domain: Domain;
  urls?: string[];
  maxPages?: number;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const CORPUS_PATH = path.join(DATA_DIR, 'local-ai-corpus.json');
const MAX_TEXT_LENGTH = 12000;
const CRAWLER_USER_AGENT = process.env.CRAWLER_USER_AGENT || 'prolingual-local-ai-bot/1.0';

const DEFAULT_DOMAIN_FALLBACKS: Record<Domain, string[]> = {
  general: [
    'I use this word in class discussions.',
    'This term appears in many academic articles.',
    'Understanding this word improves reading comprehension.',
  ],
  business: [
    'The manager used this word during the project meeting.',
    'Our team discussed this concept in the quarterly report.',
    'This term is common in professional communication.',
  ],
  electrical: [
    'This concept is essential in electrical circuit analysis.',
    'Engineers apply this term when designing stable systems.',
    'This word often appears in technical documentation.',
  ],
  toeic: [
    'This word frequently appears in TOEIC reading passages.',
    'You may hear this term in TOEIC listening sections.',
    'Mastering this word can improve your TOEIC score.',
  ],
};

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const ensureStore = async (): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(CORPUS_PATH);
  } catch {
    const initial: LocalCorpusStore = { version: 1, documents: [] };
    await fs.writeFile(CORPUS_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  }
};

const loadStore = async (): Promise<LocalCorpusStore> => {
  await ensureStore();
  const raw = await fs.readFile(CORPUS_PATH, 'utf-8');
  return JSON.parse(raw) as LocalCorpusStore;
};

const saveStore = async (store: LocalCorpusStore): Promise<void> => {
  await fs.writeFile(CORPUS_PATH, JSON.stringify(store, null, 2), 'utf-8');
};

const htmlToText = (html: string): string => {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const withLineBreaks = noScript
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');

  const stripped = withLineBreaks.replace(/<[^>]+>/g, ' ');

  return normalizeWhitespace(stripped).slice(0, MAX_TEXT_LENGTH);
};

const splitSentences = (text: string): string[] => {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length >= 40 && line.length <= 220);
};

const containsWholeWord = (sentence: string, word: string): boolean => {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
  return regex.test(sentence);
};

const uniqueByLowerCase = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }

  return result;
};

const searchWikipediaUrls = async (topic: string, limit: number): Promise<string[]> => {
  try {
    const response = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: topic,
        format: 'json',
        utf8: 1,
        srlimit: limit,
      },
      headers: {
        'User-Agent': CRAWLER_USER_AGENT,
      },
      timeout: 15000,
    });

    const items = (response.data?.query?.search || []) as Array<{ title: string }>;
    return items
      .map((item) => `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`)
      .slice(0, limit);
  } catch (err) {
    // Keep training flow alive even if Wikipedia search is blocked.
    return [];
  }
};

const pickDistractors = (word: string, domain: Domain): string[] => {
  const domainDistractors: Record<Domain, string[]> = {
    general: ['method', 'context', 'concept', 'result', 'approach'],
    business: ['revenue', 'strategy', 'proposal', 'budget', 'stakeholder'],
    electrical: ['resistance', 'current', 'circuit', 'frequency', 'voltage'],
    toeic: ['schedule', 'document', 'department', 'contract', 'supervisor'],
  };

  return domainDistractors[domain].filter((item) => item.toLowerCase() !== word.toLowerCase()).slice(0, 3);
};

export const trainLocalCorpus = async (input: TrainCorpusInput) => {
  const { topic, domain, urls = [], maxPages = 5 } = input;

  if (!topic?.trim()) {
    throw new Error('topic is required');
  }

  const store = await loadStore();
  const wikiUrls = await searchWikipediaUrls(topic, maxPages);
  const targetUrls = uniqueByLowerCase([...urls, ...wikiUrls]).slice(0, Math.max(1, maxPages));

  let added = 0;
  const failed: Array<{ url: string; reason: string }> = [];

  for (const url of targetUrls) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
        },
        timeout: 15000,
      });
      const rawText = htmlToText(typeof response.data === 'string' ? response.data : '');

      if (rawText.length < 200) {
        failed.push({ url, reason: 'not enough readable text' });
        continue;
      }

      store.documents.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        sourceUrl: url,
        topic,
        domain,
        text: rawText,
        createdAt: new Date().toISOString(),
      });

      added += 1;
    } catch (err: any) {
      failed.push({ url, reason: err?.message || 'fetch failed' });
    }
  }

  await saveStore(store);

  return {
    topic,
    domain,
    pagesRequested: targetUrls.length,
    pagesAdded: added,
    totalDocuments: store.documents.length,
    failed,
  };
};

export const getLocalCorpusStatus = async () => {
  const store = await loadStore();
  const byDomain = store.documents.reduce<Record<string, number>>((acc, item) => {
    acc[item.domain] = (acc[item.domain] || 0) + 1;
    return acc;
  }, {});

  return {
    totalDocuments: store.documents.length,
    byDomain,
    lastUpdated: store.documents.length ? store.documents[store.documents.length - 1].createdAt : null,
  };
};

/**
 * Generate example sentences for a word in a specific domain
 */
export const generateExampleSentences = async (
  word: string,
  domain: Domain
): Promise<string[]> => {
  const store = await loadStore();
  const normalizedWord = word.trim();

  if (!normalizedWord) {
    throw new Error('word is required');
  }

  const candidates = store.documents
    .filter((doc) => doc.domain === domain)
    .flatMap((doc) => splitSentences(doc.text))
    .filter((sentence) => containsWholeWord(sentence, normalizedWord));

  const sentences = uniqueByLowerCase(candidates).slice(0, 3);

  if (sentences.length >= 3) {
    return sentences;
  }

  const fallback = DEFAULT_DOMAIN_FALLBACKS[domain].map((template) =>
    template.replace('this word', normalizedWord)
  );

  return uniqueByLowerCase([...sentences, ...fallback]).slice(0, 3);
};

/**
 * Generate practice exercises (fill in the blank, etc.)
 */
export const generatePracticeExercise = async (
  word: string,
  sentence: string,
  exerciseType: 'fill_blank' | 'translation' | 'rewriting',
  domain: Domain = 'general'
): Promise<{ exercise: string; options?: string[] }> => {
  const cleanedSentence = normalizeWhitespace(sentence);
  const fallbackSentence = `Students should learn how to use the word ${word} correctly in context.`;
  const sourceSentence = cleanedSentence || fallbackSentence;

  if (exerciseType === 'fill_blank') {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const withBlank = sourceSentence.replace(regex, '____');
    const options = uniqueByLowerCase([word, ...pickDistractors(word, domain)]).slice(0, 4);

    return {
      exercise: `Fill in the blank:\n${withBlank}`,
      options,
    };
  }

  if (exerciseType === 'translation') {
    return {
      exercise: `Translate this sentence into Traditional Chinese:\n${sourceSentence}`,
    };
  }

  return {
    exercise: `Rewrite the sentence using "${word}" with the same meaning:\n${sourceSentence}`,
  };
};
