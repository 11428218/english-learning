import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Spinner } from '../components/common';
import api from '../lib/api';
import { translateDefinition } from '../lib/i18n';
import { useUiStore } from '../lib/store';

/**
 * Weak Words Page
 * Shows words that need extra review priority.
 */
export default function WeakWordsPage() {
  const { isAuthenticated } = useAuth();
  const { languageMode } = useUiStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weakWords, setWeakWords] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchWeakWords();
  }, [isAuthenticated]);

  const fetchWeakWords = async () => {
    try {
      const response = await api.getWeakWords(20);
      setWeakWords(response.data || []);
    } catch (err) {
      console.error('Error fetching weak words:', err);
      setWeakWords([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weak Words</h1>
          <p className="text-gray-600 mt-1">
            Prioritize these words to improve long-term retention.
          </p>
        </div>
        <Button onClick={() => router.push('/review')}>Start Review</Button>
      </div>

      {weakWords.length === 0 ? (
        <Card>
          <h2 className="text-xl font-bold mb-2">No weak words yet</h2>
          <p className="text-gray-600 mb-4">
            Complete a few review sessions and your weak-word list will appear here.
          </p>
          <Button variant="outline" onClick={() => router.push('/review')}>
            Go to Review
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {weakWords.map((item) => {
            const total = Number(item.total_reviews || 0);
            const correct = Number(item.times_correct || 0);
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

            return (
              <Card key={item.user_word_id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">{item.word}</h3>
                    <p className="text-gray-700 mt-1">{translateDefinition(item.definition, languageMode)}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {item.domain} • {item.part_of_speech} • difficulty {item.difficulty_level}/5
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>Ease: {Number(item.ease_factor || 2.5).toFixed(2)}</p>
                    <p>Streak: {item.correct_streak || 0}</p>
                    <p>Accuracy: {accuracy}%</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button variant="outline" onClick={() => router.push(`/${item.id}`)}>
                    View Details
                  </Button>
                  <Button onClick={() => router.push('/review')}>Practice Now</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
