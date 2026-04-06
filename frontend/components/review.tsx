import React, { useState, useEffect } from 'react';
import { Button, Flashcard } from './common';
import api from '../lib/api';
import {
  translate,
  translateDefinition,
  translateDomain,
  translateExampleType,
  translateExampleSentence,
  translatePos,
  translateTextHint,
} from '../lib/i18n';
import { useUiStore } from '../lib/store';

/**
 * Review Card Component
 * Interactive card for reviewing words
 */

interface ReviewCardProps {
  word: any;
  distractorPool?: string[];
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  word,
  distractorPool = [],
  onAnswer,
  disabled = false,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const { languageMode } = useUiStore();

  // Generate multiple choice options
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);

    const clean = (value: unknown) => String(value || '').trim();
    const isPlaceholderDefinition = (value: string) => /^english vocabulary word\s*:/i.test(value);
    const targetWord = clean(word.word).toLowerCase();
    const containsTargetWord = (value: string) =>
      targetWord.length > 0 && value.toLowerCase().includes(targetWord);

    const correctDefinition = clean(word.definition);
    if (!correctDefinition || isPlaceholderDefinition(correctDefinition) || containsTargetWord(correctDefinition)) {
      setOptions([]);
      return;
    }

    const uniquePool = Array.from(
      new Set(
        distractorPool
          .map((item) => clean(item))
          .filter(
            (item) =>
              item.length > 0 &&
              !isPlaceholderDefinition(item) &&
              !containsTargetWord(item) &&
              item.toLowerCase() !== correctDefinition.toLowerCase()
          )
      )
    );

    const distractors = shuffle(uniquePool).slice(0, 3);

    const fallbackDistractors = [
      'an opposite meaning in this context',
      'a meaning from a different topic',
      'an unrelated interpretation',
      'a meaning that does not fit the sentence',
    ].filter(
      (item) =>
        item.toLowerCase() !== correctDefinition.toLowerCase() &&
        !distractors.some((existing) => existing.toLowerCase() === item.toLowerCase())
    );

    const finalDistractors = [...distractors, ...fallbackDistractors].slice(0, 3);
    const finalOptions = shuffle([correctDefinition, ...finalDistractors]).slice(0, 4);
    setOptions(finalOptions);
  }, [word, distractorPool]);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    const isCorrect = options[index] === word.definition;
    // Auto-submit after selection
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedOption(null);
      setShowAnswer(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Word Display */}
      <div className="result text-center">
        <div className="text-4xl font-bold text-primary mb-2">{word.word}</div>
        <div className="text-sm text-gray-600">{translatePos(word.part_of_speech, languageMode)}</div>
      </div>

      {/* Example Sentences */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="font-semibold text-gray-800 mb-2">{translate('examples', languageMode)}:</div>
        <div className="space-y-2">
          {word.examples?.slice(0, 2).map((ex: any, i: number) => (
            <div key={i} className="text-sm text-gray-700">
              <span className="text-xs text-gray-500 mr-2">({translateExampleType(ex.type, languageMode)})</span>
              {translateExampleSentence(ex.sentence, languageMode)}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-line">
        <div className="font-semibold mb-1">{translate('chineseHint', languageMode)}</div>
        {translateTextHint(word.definition || '', languageMode)}
      </div>

      {/* Answer Options */}
      <div className="space-y-2">
        <div className="font-semibold text-gray-800">
          {translate('whatMeans', languageMode)} ({word.word})
        </div>
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            disabled={disabled || selectedOption !== null}
            className={`w-full p-3 rounded-lg border-2 transition text-left ${
              selectedOption === index
                ? options[index] === word.definition
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            {translateDefinition(option, languageMode)}
          </button>
        ))}
      </div>

      {/* Answer revealed */}
      {showAnswer && (
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => onAnswer(true)} variant="primary">
            ✓ Correct
          </Button>
          <Button onClick={() => onAnswer(false)} variant="danger">
            ✗ Wrong
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Review Progress
 */

interface ReviewProgressProps {
  current: number;
  total: number;
}

export const ReviewProgress: React.FC<ReviewProgressProps> = ({ current, total }) => {
  const { languageMode } = useUiStore();
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {languageMode === 'zh' ? `第 ${current} / ${total} 張` : `Card ${current} of ${total}`}
        </span>
        <span className="font-semibold text-primary">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Word List Component
 */

interface WordListProps {
  words: any[];
  onWordSelect?: (word: any) => void;
  onAddWord?: (wordId: number) => void;
}

export const WordList: React.FC<WordListProps> = ({ words, onWordSelect, onAddWord }) => {
  const { languageMode } = useUiStore();

  return (
    <div className="space-y-2">
      {words.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{translate('noWordsFound', languageMode)}</div>
      ) : (
        words.map((word) => (
          <div
            key={word.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition"
          >
            <div className="flex-1 cursor-pointer" onClick={() => onWordSelect?.(word)}>
              <div className="font-semibold text-gray-800">{word.word}</div>
              <div className="text-sm text-gray-600">{translateDefinition(word.definition, languageMode)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {translateDomain(word.domain, languageMode)} • {translatePos(word.part_of_speech, languageMode)}
              </div>
            </div>
            {onAddWord && (
              <Button variant="outline" onClick={() => onAddWord(word.id)} className="ml-4">
                + {translate('add', languageMode)}
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
};
