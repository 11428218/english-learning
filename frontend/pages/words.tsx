import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Spinner } from '../components/common';
import { WordList } from '../components/review';
import api from '../lib/api';
import { translate, translateDomain } from '../lib/i18n';
import { useUiStore } from '../lib/store';

/**
 * Words Page
 * Browse and add vocabulary words
 */

export default function WordsPage() {
  const router = useRouter();
  const { languageMode } = useUiStore();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const pageSize = 200;

  useEffect(() => {
    fetchWords(true);
  }, [domain]);

  const fetchWords = async (reset = false) => {
    setLoading(true);
    try {
      const nextOffset = reset ? 0 : offset;
      const response = await api.getAllWords(domain || undefined, undefined, pageSize, nextOffset);
      const fetched = Array.isArray(response.data) ? response.data : [];
      if (reset) {
        setWords(fetched);
        setOffset(fetched.length);
      } else {
        setWords((prev) => [...prev, ...fetched]);
        setOffset(nextOffset + fetched.length);
      }
    } catch (err) {
      console.error('Error fetching words:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async (wordId: number) => {
    setAdding(true);
    try {
      await api.addWordToUser(wordId);
      alert(languageMode === 'zh' ? '已加入學習清單！' : 'Word added to your learning list!');
    } catch (err: any) {
      alert(err.response?.data?.error || (languageMode === 'zh' ? '加入失敗' : 'Failed to add word'));
    } finally {
      setAdding(false);
    }
  };

  const filteredWords = words.filter((w) =>
    w.word.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">{translate('vocabulary', languageMode)}</h1>
        <p className="text-gray-600">{translate('browseAndAdd', languageMode)}</p>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder={translate('searchWords', languageMode)}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
        />

        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
        >
          <option value="">{translate('allDomains', languageMode)}</option>
          <option value="general">{translateDomain('general', languageMode)}</option>
          <option value="business">{translateDomain('business', languageMode)}</option>
          <option value="electrical">{translateDomain('electrical', languageMode)}</option>
          <option value="toeic">{translateDomain('toeic', languageMode)}</option>
        </select>

        <Button onClick={() => fetchWords(true)}>{translate('refresh', languageMode)}</Button>
      </div>

      {/* Word List */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <WordList
            words={filteredWords}
            onAddWord={handleAddWord}
            onWordSelect={(word) => router.push(`/words/${word.id}`)}
          />
        )}
      </Card>

      {/* Results Count */}
      <div className="text-center text-gray-600">
        {translate('showing', languageMode)} {filteredWords.length} {translate('ofWordCount', languageMode)} {words.length}
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={() => fetchWords(false)} disabled={loading}>
          {translate('loadMore', languageMode)}
        </Button>
      </div>
    </div>
  );
}
