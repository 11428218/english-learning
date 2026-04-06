import React, { useState } from 'react';
import { Button } from './common';

/**
 * Form Input Component
 */

interface InputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20"
    />
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

/**
 * Login Form
 */

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<any>;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    const result = await onSubmit(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};

/**
 * Register Form
 */

interface RegisterFormProps {
  onSubmit: (email: string, password: string) => Promise<any>;
  loading?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, loading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = await onSubmit(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Registering...' : 'Register'}
      </Button>
    </form>
  );
};

/**
 * Create Word Form
 */

interface CreateWordFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const CreateWordForm: React.FC<CreateWordFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    part_of_speech: 'noun',
    domain: 'general',
    difficulty_level: 1,
    examples: [{ sentence: '', type: 'daily' }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word || !formData.definition) {
      alert('Word and definition are required');
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Word"
        placeholder="Enter word"
        value={formData.word}
        onChange={(e) => setFormData({ ...formData, word: e.target.value })}
      />
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Definition</label>
        <textarea
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          rows={3}
          placeholder="Enter definition"
          value={formData.definition}
          onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Part of Speech
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={formData.part_of_speech}
            onChange={(e) => setFormData({ ...formData, part_of_speech: e.target.value })}
          >
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adjective">Adjective</option>
            <option value="adverb">Adverb</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Domain</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          >
            <option value="general">General</option>
            <option value="business">Business</option>
            <option value="electrical">Electrical</option>
            <option value="toeic">TOEIC</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Word'}
      </Button>
    </form>
  );
};
