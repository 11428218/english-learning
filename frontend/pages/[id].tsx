import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Spinner } from '../components/common';
import api from '../lib/api';
import { translateDefinition, translateExampleSentence, translateExampleType, translatePos, translateDomain } from '../lib/i18n';
import { useUiStore } from '../lib/store';

/**
 * Word Detail Page
 * Shows detailed word information and examples
 */

export default function WordDetailPage() {
  const { languageMode } = useUiStore();
  const router = useRouter();
  const { id } = router.query;
  const [word, setWord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWord();
    }
  }, [id]);

  const fetchWord = async () => {
    try {
      const response = await api.getWord(Number(id));
      setWord(response.data);
    } catch (err) {
      console.error('Error fetching word:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!word) {
    return (
      <Card>
        <p className="text-gray-600">Word not found</p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        ← Back
      </Button>

      {/* Word Header */}
      <Card className="border-l-4 border-primary">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">{word.word}</h1>
            <p className="text-gray-600 text-sm">
              {translatePos(word.part_of_speech, languageMode)} • {translateDomain(word.domain, languageMode)} • Difficulty: {word.difficulty_level}/5
            </p>
          </div>
        </div>
      </Card>

      {/* Definition */}
      <Card>
        <h2 className="text-lg font-bold mb-3">Definition</h2>
        <p className="text-gray-800 text-lg leading-relaxed">{translateDefinition(word.definition, languageMode)}</p>
      </Card>

      {/* Examples */}
      {word.examples && word.examples.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold mb-4">Example Sentences</h2>
          <div className="space-y-3">
            {word.examples.map((example: any, index: number) => (
              <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
                <div className="text-xs font-semibold text-primary uppercase mb-1">
                  {translateExampleType(example.type, languageMode)}
                </div>
                <p className="text-gray-800">{translateExampleSentence(example.sentence, languageMode)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="flex gap-3">
        <Button onClick={() => router.push('/words')} className="flex-1">
          Browse More
        </Button>
        <Button onClick={() => router.push('/review')} className="flex-1">
          Start Review
        </Button>
      </Card>
    </div>
  );
}
