import React from 'react';
import type { AppProps } from 'next/app';
import { Header } from '../components/common';
import { useUiStore } from '../lib/store';
import '../styles/globals.css';

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode; languageMode: 'en' | 'zh' },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; languageMode: 'en' | 'zh' }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Global UI crash captured:', error, info);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isZh = this.props.languageMode === 'zh';
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white border rounded-xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isZh ? '頁面暫時發生錯誤' : 'Something went wrong'}
            </h1>
            <p className="text-gray-600 mb-4">
              {isZh
                ? '我們已攔截錯誤，請重新整理頁面。'
                : 'The app caught an unexpected error. Please reload the page.'}
            </p>
            {this.state.message && (
              <p className="text-xs text-gray-500 mb-4 break-all">{this.state.message}</p>
            )}
            <button
              onClick={this.handleReload}
              className="w-full px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90"
            >
              {isZh ? '重新整理' : 'Reload'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * App Component
 * Root component for Next.js app
 */

function MyApp({ Component, pageProps }: AppProps) {
  const { languageMode } = useUiStore();

  return (
    <GlobalErrorBoundary languageMode={languageMode}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Component {...pageProps} />
        </main>
        <footer className="border-t bg-white mt-16">
          <div className="container mx-auto px-4 py-8 text-center text-gray-600 text-sm">
            <p>
              {languageMode === 'zh'
                ? '© 2026 ProLingual - 專為進階學習者打造的語言學習平台'
                : '© 2026 ProLingual - Language Learning for Serious Learners'}
            </p>
          </div>
        </footer>
      </div>
    </GlobalErrorBoundary>
  );
}

export default MyApp;
