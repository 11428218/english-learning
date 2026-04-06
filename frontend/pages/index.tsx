import React from 'react';
import { useRouter } from 'next/router';
import { Button, Card } from '../components/common';
import { useUiStore } from '../lib/store';

/**
 * Home Page
 * Landing page for unauthenticated users
 */

export default function Home() {
  const router = useRouter();
  const { languageMode } = useUiStore();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          {languageMode === 'zh' ? '像專家一樣學語言' : 'Learn Languages Like a Pro'}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {languageMode === 'zh'
            ? '用間隔重複、本地訓練語料例句與領域專業內容，扎實掌握英文單字。特別適合多益、商務與技術英文。'
            : 'Master vocabulary with spaced repetition, locally-trained AI examples, and domain-specific content. Perfect for TOEIC, Business, and Technical English.'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/dashboard')}>
            {languageMode === 'zh' ? '開始學習' : 'Start Learning'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/review')}>
            {languageMode === 'zh' ? '立即複習' : 'Review Now'}
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <div className="text-3xl mb-3">🎴</div>
          <h3 className="text-xl font-bold mb-2">Flashcards</h3>
          <p className="text-gray-600">
            Interactive flashcards with multiple examples, part of speech, and domain-specific context.
          </p>
        </Card>

        <Card>
          <div className="text-3xl mb-3">🧠</div>
          <h3 className="text-xl font-bold mb-2">Spaced Repetition</h3>
          <p className="text-gray-600">
            SM-2 algorithm ensures optimal review intervals based on your learning curve.
          </p>
        </Card>

        <Card>
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-xl font-bold mb-2">Local AI Content</h3>
          <p className="text-gray-600">
            Unlimited examples generated from your own trained web corpus for any word and domain.
          </p>
        </Card>

        <Card>
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-xl font-bold mb-2">Progress Tracking</h3>
          <p className="text-gray-600">
            Monitor your learning with detailed statistics and weak word identification.
          </p>
        </Card>

        <Card>
          <div className="text-3xl mb-3">🎓</div>
          <h3 className="text-xl font-bold mb-2">Domain-Specific</h3>
          <p className="text-gray-600">
            TOEIC, Business English, and Electrical Engineering vocabularies.
          </p>
        </Card>

        <Card>
          <div className="text-3xl mb-3">✨</div>
          <h3 className="text-xl font-bold mb-2">Clean & Simple</h3>
          <p className="text-gray-600">
            Minimal, distraction-free interface focused on learning effectiveness.
          </p>
        </Card>
      </div>

      {/* CTA */}
      <div className="bg-primary text-white rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
        <p className="mb-6 text-lg">No sign-up needed. Jump directly into your study flow.</p>
        <Button
          variant="light"
          onClick={() => router.push('/dashboard')}
          className="min-w-[180px]"
        >
          {languageMode === 'zh' ? '開啟儀表板' : 'Open Dashboard'}
        </Button>
      </div>
    </div>
  );
}
