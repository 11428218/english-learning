import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import {
  translate,
  translateDefinition,
  translateExampleType,
  translateExampleSentence,
  translatePos,
} from '../lib/i18n';
import { useUiStore } from '../lib/store';

/**
 * Header Component
 * Navigation and user info
 */

export const Header: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { languageMode, setLanguageMode, loadUiFromStorage } = useUiStore();

  React.useEffect(() => {
    loadUiFromStorage();
  }, [loadUiFromStorage]);

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div
          className="text-2xl font-bold text-primary cursor-pointer"
          onClick={() => router.push('/')}
        >
          ProLingual
        </div>

        <nav className="flex items-center gap-6">
          <a
            href="/dashboard"
            className="text-gray-700 hover:text-primary transition"
          >
            {translate('dashboard', languageMode)}
          </a>
          <a href="/review" className="text-gray-700 hover:text-primary transition">
            {translate('review', languageMode)}
          </a>
          <a href="/words" className="text-gray-700 hover:text-primary transition">
            {translate('words', languageMode)}
          </a>
          <a href="/weak" className="text-gray-700 hover:text-primary transition">
            {translate('weakWords', languageMode)}
          </a>
          <a href="/status" className="text-gray-700 hover:text-primary transition">
            {translate('status', languageMode)}
          </a>

          <select
            value={languageMode}
            onChange={(e) =>
              setLanguageMode(e.target.value as 'en' | 'zh')
            }
            className="px-2 py-1 rounded border border-gray-300 text-xs text-gray-700"
            aria-label={translate('languageMode', languageMode)}
          >
            <option value="en">{translate('modeEnglish', languageMode)}</option>
            <option value="zh">{translate('modeChinese', languageMode)}</option>
          </select>

          <div className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 border">
            {translate('guestMode', languageMode)}: {user?.email || 'guest@prolingual.local'}
          </div>
        </nav>
      </div>
    </header>
  );
};

/**
 * Card Component
 * Reusable card wrapper
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>{children}</div>
);

/**
 * Button Component
 * Reusable button with variants
 */

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'danger' | 'light';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-semibold transition cursor-pointer';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    outline: 'border border-primary text-primary hover:bg-gray-bg',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    light: 'bg-white !text-primary border border-white/60 shadow-sm hover:bg-blue-50',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </button>
  );
};

/**
 * Flashcard Component
 * Interactive vocabulary card
 */

interface FlashcardProps {
  word: string;
  definition: string;
  partOfSpeech: string;
  examples: Array<{ sentence: string; type: string }>;
  onFlip?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  word,
  definition,
  partOfSpeech,
  examples,
  onFlip,
}) => {
  const [flipped, setFlipped] = React.useState(false);
  const { languageMode } = useUiStore();

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.();
  };

  return (
    <div
      onClick={handleFlip}
      className="w-full h-64 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white p-8 cursor-pointer shadow-lg hover:shadow-xl transition transform hover:scale-105 flex flex-col justify-between"
    >
      {!flipped ? (
        <div className="text-center flex flex-col justify-center items-center h-full">
          <div className="text-5xl font-bold mb-4">{word}</div>
          <div className="text-sm text-blue-100">{translate('clickToReveal', languageMode)}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-sm text-blue-100 mb-1">{translate('definition', languageMode)}</div>
            <div className="text-lg font-semibold">{translateDefinition(definition, languageMode)}</div>
          </div>
          <div className="text-sm text-blue-100">{translatePos(partOfSpeech, languageMode)}</div>
          <div>
            <div className="text-xs text-blue-100 mb-2">{translate('examples', languageMode)}:</div>
            <div className="space-y-1">
              {examples.slice(0, 2).map((ex, i) => (
                <div key={i} className="text-xs text-blue-50">
                  • ({translateExampleType(ex.type, languageMode)}) {translateExampleSentence(ex.sentence, languageMode)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Loading Spinner
 */

export const Spinner: React.FC = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * Stats Card Component
 */

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <Card className="text-center">
    {icon && <div className="text-3xl mb-2 text-center">{icon}</div>}
    <div className="text-2xl font-bold text-primary mb-1">{value}</div>
    <div className="text-sm text-gray-600">{title}</div>
  </Card>
);
