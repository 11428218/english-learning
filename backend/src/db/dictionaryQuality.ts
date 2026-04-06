const SHORT_WORD_ALLOWLIST = new Set([
  'a',
  'i',
  'an',
  'as',
  'at',
  'be',
  'by',
  'do',
  'eh',
  'go',
  'ha',
  'he',
  'hi',
  'ho',
  'if',
  'in',
  'is',
  'it',
  'me',
  'my',
  'no',
  'o',
  'of',
  'oh',
  'on',
  'or',
  'ox',
  're',
  'so',
  'to',
  'up',
  'us',
  'we',
]);

const GENERIC_DEFINITION_PATTERNS = [/^english vocabulary word:/i, /^wordnet definition unavailable\.?$/i, /^definition unavailable\.?$/i, /^n\/a$/i, /^unknown$/i];

const LOW_VALUE_DEFINITION_PATTERNS = [
  /\babbreviation\b/i,
  /\bacronym\b/i,
  /\binitialism\b/i,
  /\bnonstandard form\b/i,
  /\bproper noun\b/i,
  /\bsurname\b/i,
  /\bgiven name\b/i,
  /\bfamily name\b/i,
  /\btrade name\b/i,
  /\bbrand name\b/i,
  /\bassociation of people\b/i,
  /\bhit squad\b/i,
  /\bguerrilla group\b/i,
  /\ba river in\b/i,
  /\ban? river in\b/i,
  /\ba city in\b/i,
  /\ban? city in\b/i,
  /\ba town in\b/i,
  /\ban? town in\b/i,
  /\ba state in\b/i,
  /\ban? state in\b/i,
  /\ba country in\b/i,
  /\ban? country in\b/i,
  /\bprovince in\b/i,
  /\bcounty in\b/i,
  /\bvillage in\b/i,
];

export const normalizeDictionaryWord = (value: string): string | null => {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z'\- ]/g, '')
    .trim();

  if (!cleaned || cleaned.includes(' ')) {
    return null;
  }

  if (!/^[a-z][a-z'\-]*$/.test(cleaned)) {
    return null;
  }

  return cleaned;
};

export const normalizeDictionaryDefinition = (value?: string): string | null => {
  if (!value) return null;

  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
};

export const isPlaceholderDefinition = (value?: string): boolean => {
  if (!value) return true;

  const normalized = value.replace(/\s+/g, ' ').trim();
  return GENERIC_DEFINITION_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const isLowValueDefinition = (value?: string): boolean => {
  if (!value) return true;

  const normalized = value.replace(/\s+/g, ' ').trim();
  return LOW_VALUE_DEFINITION_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const isTeachableDictionaryWord = (value: string): boolean => {
  const normalized = normalizeDictionaryWord(value);
  if (!normalized) return false;

  if (normalized === 'a') {
    return false;
  }

  if (normalized.startsWith('a-') || normalized.startsWith("a'")) {
    return false;
  }

  if (/^(.)\1{2,}$/.test(normalized)) {
    return false;
  }

  if (normalized.length <= 2 && !SHORT_WORD_ALLOWLIST.has(normalized)) {
    return false;
  }

  return true;
};

export const isTeachableDictionaryEntry = (word: string, definition?: string): boolean => {
  if (!isTeachableDictionaryWord(word)) return false;
  if (isPlaceholderDefinition(definition) || isLowValueDefinition(definition)) return false;
  return true;
};

export const buildTeachabilitySqlClause = (alias: string): string => `
  ${alias}.definition NOT ILIKE 'English vocabulary word:%'
  AND ${alias}.definition <> 'WordNet definition unavailable.'
  AND ${alias}.definition NOT ILIKE '%abbreviation%'
  AND ${alias}.definition NOT ILIKE '%acronym%'
  AND ${alias}.definition NOT ILIKE '%initialism%'
  AND ${alias}.definition NOT ILIKE '%nonstandard form%'
  AND ${alias}.definition NOT ILIKE '%proper noun%'
  AND ${alias}.definition NOT ILIKE '%surname%'
  AND ${alias}.definition NOT ILIKE '%given name%'
  AND ${alias}.definition NOT ILIKE '%family name%'
  AND ${alias}.definition NOT ILIKE '%trade name%'
  AND ${alias}.definition NOT ILIKE '%brand name%'
  AND ${alias}.definition NOT ILIKE '%association of people%'
  AND ${alias}.definition NOT ILIKE '%hit squad%'
  AND ${alias}.definition NOT ILIKE '%guerrilla group%'
  AND ${alias}.definition NOT ILIKE '%river in%'
  AND ${alias}.definition NOT ILIKE '%city in%'
  AND ${alias}.definition NOT ILIKE '%town in%'
  AND ${alias}.definition NOT ILIKE '%state in%'
  AND ${alias}.definition NOT ILIKE '%country in%'
  AND ${alias}.definition NOT ILIKE '%province in%'
  AND ${alias}.definition NOT ILIKE '%county in%'
  AND ${alias}.definition NOT ILIKE '%village in%'
`;

export const filterTeachableDictionaryWords = (words: string[]): string[] => {
  const uniqueWords = new Set<string>();

  for (const word of words) {
    const normalized = normalizeDictionaryWord(word);
    if (!normalized) continue;
    if (!isTeachableDictionaryWord(normalized)) continue;
    uniqueWords.add(normalized);
  }

  return Array.from(uniqueWords.values());
};
