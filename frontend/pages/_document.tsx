import Document, { Html, Head, Main, NextScript } from 'next/document';

/**
 * Document Component
 * Custom document for Next.js
 */

class MyDocument extends Document {
  render() {
    const performancePolyfill = `
      (function () {
        if (typeof window === 'undefined') return;
        var perf = window.performance;
        if (!perf) return;
        if (typeof perf.clearMarks !== 'function') {
          perf.clearMarks = function () {};
        }
        if (typeof perf.clearMeasures !== 'function') {
          perf.clearMeasures = function () {};
        }
      })();
    `;

    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="description" content="ProLingual - Language Learning App" />
          <link rel="icon" href="/favicon.ico" />
          <script dangerouslySetInnerHTML={{ __html: performancePolyfill }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
