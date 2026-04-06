import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, StatCard, Button, Spinner } from '../components/common';
import api from '../lib/api';
import { translate } from '../lib/i18n';
import { useUiStore } from '../lib/store';

/**
 * Dashboard Page
 * Shows learning statistics and quick actions
 */

export default function DashboardPage() {
  const router = useRouter();
  const { languageMode } = useUiStore();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsResponse, historyResponse] = await Promise.all([
        api.getStats(),
        api.getReviewHistory(14, 8),
      ]);
      setStats(statsResponse.data);
      setHistory(historyResponse.data.daily || []);
      setRecent(historyResponse.data.recent || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!stats) {
    return <Card>{translate('loadingStatsFailed', languageMode)}</Card>;
  }

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayHistory = history.find((item) => item.date === todayKey);
  const completedToday = Number(todayHistory?.total_reviews || 0);
  const dailyGoal = 30;
  const displayedCompleted = Math.min(completedToday, dailyGoal);
  const goalPercentage = Math.round(Math.min(100, (completedToday / dailyGoal) * 100));

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{translate('welcomeBack', languageMode)}</h1>
        <p className="text-gray-600">{translate('keepDailyReview', languageMode)}</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-5 gap-4">
        <StatCard
          title={translate('totalWords', languageMode)}
          value={stats.stats?.total_words || 0}
          icon="📚"
        />
        <StatCard
          title={translate('dueToday', languageMode)}
          value={stats.stats?.due_today || 0}
          icon="📅"
        />
        <StatCard
          title={translate('totalReviews', languageMode)}
          value={stats.stats?.total_reviews || 0}
          icon="✅"
        />
        <StatCard
          title={translate('accuracy', languageMode)}
          value={`${Math.round(stats.accuracy || 0)}%`}
          icon="🎯"
        />
        <StatCard
          title={translate('avgDifficulty', languageMode)}
          value={stats.stats?.avg_ease_factor?.toFixed(1) || '2.5'}
          icon="⚡"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-2xl font-bold mb-2">{translate('todaysReview', languageMode)}</h2>
          <p className="text-gray-600 mb-4">
            {stats.stats?.due_today || 0} {translate('wordsWaiting', languageMode)}
          </p>
          <Button
            onClick={() => router.push('/review')}
            className="w-full"
          >
            {translate('startReview', languageMode)} →
          </Button>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-2">{translate('addVocabulary', languageMode)}</h2>
          <p className="text-gray-600 mb-4">{translate('exploreAddWords', languageMode)}</p>
          <Button
            onClick={() => router.push('/words')}
            variant="outline"
            className="w-full"
          >
            {translate('browseWords', languageMode)} →
          </Button>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-2">Weak Words</h2>
          <p className="text-gray-600 mb-4">Focus on the words you struggle with most</p>
          <Button
            onClick={() => router.push('/weak')}
            variant="outline"
            className="w-full"
          >
            {translate('practiceWeakWords', languageMode)} →
          </Button>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-2">Learning Tips</h2>
          <p className="text-gray-600 mb-4">
            Review 20-30 minutes daily for best results. Focus on accuracy over speed.
          </p>
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600"
          >
            {translate('learnMore', languageMode)} →
          </Button>
        </Card>
      </div>

      {/* Today's Goal */}
      <Card>
        <h2 className="text-xl font-bold mb-4">Today's Goal</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 mb-1">Review Progress</p>
            <p className="text-2xl font-bold text-primary">
              {displayedCompleted} / {dailyGoal} reviews
            </p>
          </div>
          <div className="w-32 h-32 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {goalPercentage}%
              </div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">{translate('historyProgress', languageMode)}</h2>
        {history.length === 0 ? (
          <p className="text-gray-600">{translate('noHistory', languageMode)}</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.date} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-3 text-sm text-gray-700">{item.date}</div>
                <div className="col-span-6">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, Number(item.accuracy || 0))}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-3 text-sm text-gray-600 text-right">
                  {item.correct_reviews}/{item.total_reviews} ({Math.round(Number(item.accuracy || 0))}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">{translate('recentAttempts', languageMode)}</h2>
        {recent.length === 0 ? (
          <p className="text-gray-600">{translate('noAttempts', languageMode)}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between border rounded-lg px-3 py-2"
              >
                <div>
                  <div className="font-semibold text-gray-800">{row.word}</div>
                  <div className="text-xs text-gray-500">{row.domain} · {row.review_type}</div>
                </div>
                <div className={row.is_correct ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                  {row.is_correct ? translate('correct', languageMode) : translate('incorrect', languageMode)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
