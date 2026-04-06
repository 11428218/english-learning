export type LanguageMode = 'en' | 'zh';

type TranslationMap = Record<string, { en: string; zh: string }>;

const UI: TranslationMap = {
  dashboard: { en: 'Dashboard', zh: '儀表板' },
  review: { en: 'Review', zh: '複習' },
  words: { en: 'Words', zh: '單字庫' },
  weakWords: { en: 'Weak Words', zh: '弱點單字' },
  status: { en: 'Status', zh: '系統狀態' },
  guestMode: { en: 'Guest Mode', zh: '訪客模式' },
  clickToReveal: { en: 'Click to reveal', zh: '點擊顯示答案' },
  definition: { en: 'Definition', zh: '定義' },
  examples: { en: 'Examples', zh: '例句' },
  noWordsFound: { en: 'No words found', zh: '找不到單字' },
  add: { en: 'Add', zh: '加入' },
  loadingStatsFailed: { en: 'Unable to load statistics', zh: '無法載入統計資料' },
  welcomeBack: { en: 'Welcome Back!', zh: '歡迎回來！' },
  keepDailyReview: {
    en: 'Keep up with your daily reviews to improve faster',
    zh: '維持每日複習，進步會更快',
  },
  totalWords: { en: 'Total Words', zh: '總單字數' },
  dueToday: { en: 'Due Today', zh: '今日待複習' },
  totalReviews: { en: 'Total Reviews', zh: '總作答次數' },
  accuracy: { en: 'Accuracy', zh: '正確率' },
  avgDifficulty: { en: 'Avg Difficulty', zh: '平均難度' },
  todaysReview: { en: "Today's Review", zh: '今日複習' },
  wordsWaiting: { en: 'words waiting for review', zh: '個單字等待複習' },
  startReview: { en: 'Start Review', zh: '開始複習' },
  addVocabulary: { en: 'Add Vocabulary', zh: '新增字彙' },
  exploreAddWords: {
    en: 'Explore and add new words to your learning list',
    zh: '探索並加入新單字到你的學習清單',
  },
  browseWords: { en: 'Browse Words', zh: '瀏覽單字' },
  practiceWeakWords: { en: 'Practice Weak Words', zh: '練習弱點單字' },
  allCaughtUp: { en: 'All Caught Up!', zh: '今天都複習完了！' },
  completeToday: {
    en: "You've completed today's reviews. Come back tomorrow to continue learning.",
    zh: '你已完成今天的複習，明天再回來持續學習。',
  },
  backDashboard: { en: 'Back to Dashboard', zh: '回到儀表板' },
  previous: { en: 'Previous', zh: '上一題' },
  next: { en: 'Next', zh: '下一題' },
  skipDashboard: { en: 'Skip to Dashboard', zh: '先回儀表板' },
  whatMeans: { en: 'What does this word mean?', zh: '這個單字是什麼意思？' },
  vocabulary: { en: 'Vocabulary', zh: '單字庫' },
  browseAndAdd: { en: 'Browse and add words to your learning list', zh: '瀏覽並加入單字到學習清單' },
  searchWords: { en: 'Search words...', zh: '搜尋單字...' },
  allDomains: { en: 'All Domains', zh: '全部領域' },
  refresh: { en: 'Refresh', zh: '重新整理' },
  showing: { en: 'Showing', zh: '顯示' },
  ofWordCount: { en: 'of', zh: '／' },
 loadMore: { en: 'Load More', zh: '載入更多' },
  learningTips: { en: 'Learning Tips', zh: '學習建議' },
  learnMore: { en: 'Learn More', zh: '查看更多' },
  historyProgress: { en: 'History Progress (Last 14 Days)', zh: '歷史進度（最近 14 天）' },
  recentAttempts: { en: 'Recent Attempts', zh: '最近作答' },
  noHistory: {
    en: 'No review history yet. Start a review session to build your timeline.',
    zh: '目前還沒有複習紀錄，先開始一輪複習吧。',
  },
  noAttempts: { en: 'No attempts recorded yet.', zh: '目前還沒有作答紀錄。' },
  correct: { en: 'Correct', zh: '答對' },
  incorrect: { en: 'Incorrect', zh: '答錯' },
  chineseHint: { en: 'Chinese Hint', zh: '中文提示' },
  languageMode: { en: 'Language', zh: '語言模式' },
  modeEnglish: { en: 'English', zh: '英文' },
  modeChinese: { en: 'Chinese', zh: '中文' },
  studyScope: { en: 'Study Scope', zh: '學習範圍' },
  chooseDomain: { en: 'Choose Domain', zh: '選擇領域' },
  chooseDifficulty: { en: 'Choose Difficulty', zh: '選擇難度' },
  startScopedReview: { en: 'Start Scoped Review', zh: '開始範圍複習' },
  easyFoundation: { en: 'Easy (Foundation)', zh: '簡單（基礎）' },
  intermediateBuild: { en: 'Intermediate', zh: '中等（進階）' },
  advancedChallenge: { en: 'Advanced', zh: '困難（挑戰）' },
  mixedAllLevels: { en: 'Mixed (All Levels)', zh: '混合（全部等級）' },
  domainGeneral: { en: 'General', zh: '一般' },
  domainBusiness: { en: 'Business', zh: '商務' },
  domainElectrical: { en: 'Electrical', zh: '電機' },
  domainToeic: { en: 'TOEIC', zh: '多益' },
};

const POS_MAP: Record<string, string> = {
  noun: '名詞',
  verb: '動詞',
  adjective: '形容詞',
  adverb: '副詞',
  preposition: '介系詞',
  pronoun: '代名詞',
  conjunction: '連接詞',
  interjection: '感嘆詞',
  unknown: '未知詞性',
};

const DOMAIN_MAP: Record<string, string> = {
  general: '一般',
  business: '商務',
  electrical: '電機',
  toeic: '多益',
};

const EXAMPLE_TYPE_MAP: Record<string, string> = {
  daily: '日常',
  business: '商務',
  technical: '技術',
};

const hasLatin = (text: string): boolean => /[A-Za-z]/.test(String(text || ''));

const zhHint = (text: string): string => {
  const normalized = String(text || '').trim();
  if (!normalized) return '暫無中文提示';

  const phraseMap: Array<[RegExp, string]> = [
    [/associate degree in applied science/gi, '應用科學副學士學位'],
    [/a person who/gi, '一個人，會'],
    [/the act of/gi, '...的行為'],
    [/used to/gi, '用來'],
    [/related to/gi, '與...相關'],
    [/in business/gi, '在商務情境中'],
    [/in electrical engineering/gi, '在電機工程情境中'],
    [/an?\s+/gi, '一個'],
    [/the\s+/gi, '這個'],
    [/and/gi, '和'],
    [/or/gi, '或'],
    [/for/gi, '用於'],
    [/with/gi, '搭配'],
  ];

  let converted = normalized;
  for (const [pattern, replacement] of phraseMap) {
    converted = converted.replace(pattern, replacement);
  }

  return `中文提示：${converted}`;
};

export const translate = (key: keyof typeof UI, mode: LanguageMode): string => {
  const item = UI[key];
  if (!item) return String(key);
  return mode === 'zh' ? item.zh : item.en;
};

export const translatePos = (value: string, mode: LanguageMode): string => {
  const en = String(value || 'unknown').toLowerCase();
  const zh = POS_MAP[en] || '其他';
  return mode === 'zh' ? zh : en;
};

export const translateDomain = (value: string, mode: LanguageMode): string => {
  const en = String(value || 'general').toLowerCase();
  const zh = DOMAIN_MAP[en] || '其他';
  return mode === 'zh' ? zh : en;
};

export const translateExampleType = (value: string, mode: LanguageMode): string => {
  const en = String(value || 'daily').toLowerCase();
  const zh = EXAMPLE_TYPE_MAP[en] || '其他';
  return mode === 'zh' ? zh : en;
};

export const translateTextHint = (text: string, mode: LanguageMode): string => {
  if (mode === 'en') return text;
  const zh = zhHint(text);
  if (hasLatin(zh)) {
    return '中文提示：此單字的詳細中文說明建置中，請先依例句理解語意。';
  }
  return zh;
};

const TOKEN_MAP: Record<string, string> = {
  a: '一個',
  an: '一個',
  the: '該',
  of: '的',
  and: '與',
  or: '或',
  to: '去',
  in: '在',
  on: '在',
  by: '由',
  for: '用於',
  with: '搭配',
  from: '來自',
  person: '人',
  people: '人們',
  thing: '事物',
  action: '行為',
  state: '狀態',
  quality: '特質',
  opposite: '相反的',
  contrasting: '對比的',
  type: '類型',
  used: '用於',
  related: '相關',
  not: '不',
  very: '非常',
  small: '小的',
  large: '大的',
};

const mapToken = (token: string): string => {
  const normalized = token.toLowerCase();
  return TOKEN_MAP[normalized] || token;
};

const convertDefinitionToZh = (text: string): string => {
  const source = String(text || '').trim();
  if (!source) return '暫無中文定義';

  const personPattern = /^a person who\s+(.+)$/i;
  const actPattern = /^the act of\s+(.+)$/i;
  const usedForPattern = /^used for\s+(.+)$/i;
  const relatedPattern = /^related to\s+(.+)$/i;
  const simpleNounPattern = /^an?\s+(.+)$/i;

  if (personPattern.test(source)) {
    return `指會${source.replace(personPattern, '$1')}的人`;
  }
  if (actPattern.test(source)) {
    return `${source.replace(actPattern, '$1')}的行為`;
  }
  if (usedForPattern.test(source)) {
    return `用於${source.replace(usedForPattern, '$1')}`;
  }
  if (relatedPattern.test(source)) {
    return `與${source.replace(relatedPattern, '$1')}相關`;
  }
  if (simpleNounPattern.test(source)) {
    return `一種${source.replace(simpleNounPattern, '$1')}`;
  }

  const converted = source
    .split(/(\s+|[,:;()\-])/)
    .map((token) => {
      if (!token.trim() || /^\s+$/.test(token) || /^[,:;()\-]$/.test(token)) {
        return token;
      }
      return mapToken(token);
    })
    .join('');

  if (hasLatin(converted)) {
    return '此單字的中文釋義尚在整理，建議先查看例句理解語意。';
  }

  return converted;
};

export const translateDefinition = (definition: string, mode: LanguageMode): string => {
  if (mode === 'en') return String(definition || '');
  return convertDefinitionToZh(definition);
};

const convertSentenceToZh = (text: string): string => {
  const source = String(text || '').trim();
  if (!source) return '暫無中文例句';

  const phraseMap: Array<[RegExp, string]> = [
    [/during the meeting/gi, '在會議期間'],
    [/in this context/gi, '在這個語境中'],
    [/in daily life/gi, '在日常生活中'],
    [/in business/gi, '在商務情境中'],
    [/in electrical engineering/gi, '在電機工程情境中'],
    [/is used to/gi, '用來'],
    [/is used for/gi, '用於'],
    [/refers to/gi, '指的是'],
    [/a person who/gi, '一個會'],
    [/an?\s+/gi, '一個'],
    [/the\s+/gi, '該'],
    [/and/gi, '與'],
    [/or/gi, '或'],
    [/for/gi, '用於'],
    [/with/gi, '搭配'],
    [/to\s+/gi, '去'],
  ];

  let converted = source;
  for (const [pattern, replacement] of phraseMap) {
    converted = converted.replace(pattern, replacement);
  }

  if (hasLatin(converted)) {
    return '此例句用於展示單字在語境中的使用方式。';
  }

  return converted;
};

export const translateExampleSentence = (sentence: string, mode: LanguageMode): string => {
  if (mode === 'en') return String(sentence || '');
  return convertSentenceToZh(sentence);
};
