import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Spinner } from '../components/common';
import { ReviewCard, ReviewProgress } from '../components/review';
import api from '../lib/api';
import { translate } from '../lib/i18n';
import { useUiStore } from '../lib/store';

/**
 * Review Page
 * Main review/study interface with spaced repetition
 */

export default function ReviewPage() {
  useAuth();
  const router = useRouter();
  const { languageMode } = useUiStore();

  const [selectedDomain, setSelectedDomain] = useState<'general' | 'business' | 'electrical' | 'toeic'>('general');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'intermediate' | 'advanced' | 'all'>('easy');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const difficultyMap: Record<typeof selectedDifficulty, { min?: number; max?: number }> = {
    easy: { min: 1, max: 3 },
    intermediate: { min: 4, max: 6 },
    advanced: { min: 7, max: 10 },
    all: {},
  };

  const isPlaceholderDefinition = (definition: unknown) => {
    const text = String(definition || '').trim();
    return /^english vocabulary word\s*:/i.test(text);
  };

  const fetchTodaysReviews = async () => {
    try {
      const range = difficultyMap[selectedDifficulty];
      const response = await api.getTodaysReviews({
        domain: selectedDomain,
        minDifficulty: range.min,
        maxDifficulty: range.max,
        order: 'difficulty_asc',
        limit: 50,
      });

      const reviewWords = (response.data.words || []).filter(
        (item: any) =>
          item &&
          String(item.definition || '').trim().length > 0 &&
          !isPlaceholderDefinition(item.definition)
      );
      setWords(reviewWords);
      setCurrentIndex(0);
      setSessionStarted(true);
      if (reviewWords.length === 0) {
        // No words to review
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (currentIndex >= words.length) return;

    setSubmitLoading(true);
    try {
      const currentWord = words[currentIndex];
      await api.submitAnswer(currentWord.user_word_id, isCorrect, 'recognition');

      // Move to next word
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All words reviewed
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <h1 className="text-3xl font-bold mb-4">{translate('studyScope', languageMode)}</h1>
          <p className="text-gray-600 mb-6">
            {translate('chooseDomain', languageMode)} + {translate('chooseDifficulty', languageMode)}
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {translate('chooseDomain', languageMode)}
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="general">{translate('domainGeneral', languageMode)}</option>
                <option value="business">{translate('domainBusiness', languageMode)}</option>
                <option value="electrical">{translate('domainElectrical', languageMode)}</option>
                <option value="toeic">{translate('domainToeic', languageMode)}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {translate('chooseDifficulty', languageMode)}
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="easy">{translate('easyFoundation', languageMode)}</option>
                <option value="intermediate">{translate('intermediateBuild', languageMode)}</option>
                <option value="advanced">{translate('advancedChallenge', languageMode)}</option>
                <option value="all">{translate('mixedAllLevels', languageMode)}</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={fetchTodaysReviews} className="w-full">
              {translate('startScopedReview', languageMode)}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">{translate('allCaughtUp', languageMode)}</h2>
          <p className="text-gray-600 mb-6">
            {translate('completeToday', languageMode)}
          </p>
          <Button onClick={() => router.push('/dashboard')}>{translate('backDashboard', languageMode)}</Button>
        </Card>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{translate('todaysReview', languageMode)}</h1>
      </div>

      {/* Progress Bar */}
      <ReviewProgress current={currentIndex + 1} total={words.length} />

      {/* Review Card */}
      <Card>
        <ReviewCard
          word={currentWord}
          distractorPool={words
            .filter((item, index) => index !== currentIndex)
            .map((item) => item.definition)
            .filter((definition) => definition && !isPlaceholderDefinition(definition))}
          onAnswer={handleAnswer}
          disabled={submitLoading}
        />
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        >
          ← {translate('previous', languageMode)}
        </Button>

        <div className="text-center text-gray-600">
          {currentIndex + 1} / {words.length}
        </div>

        <Button
          variant="outline"
          disabled={currentIndex === words.length - 1}
          onClick={() => setCurrentIndex(Math.min(words.length - 1, currentIndex + 1))}
        >
          {translate('next', languageMode)} →
        </Button>
      </div>

      {/* Skip button */}
      <div className="text-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-600 hover:text-primary text-sm font-medium"
        >
          {translate('skipDashboard', languageMode)}
        </button>
      </div>
    </div>
  );
}
