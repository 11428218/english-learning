import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import net from 'net';
import http from 'http';
import initDatabase from './db/init';
import pool from './db/pool';
import { errorHandler } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import wordRoutes from './routes/words';
import reviewRoutes from './routes/review';
import aiRoutes from './routes/ai';

dotenv.config();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

const app = express();
const REQUESTED_PORT = Number(process.env.PORT || 5000);
const STRICT_PORT = String(process.env.STRICT_PORT || 'true').toLowerCase() !== 'false';
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 20000);

const findAvailablePort = (port: number): Promise<number> =>
  new Promise((resolve) => {
    const tester = net.createServer();

    tester
      .once('error', () => resolve(findAvailablePort(port + 1)))
      .once('listening', () => {
        tester.close(() => resolve(port));
      })
      .listen(port);
  });

const isPortAvailable = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const tester = net.createServer();
    tester
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port);
  });

/**
 * Middleware
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS);
  next();
});

/**
 * Initialize database on startup
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/details', async (req, res) => {
  const startedAt = process.uptime();
  const memory = process.memoryUsage();

  const base = {
    status: 'ok',
    uptime_seconds: Number(startedAt.toFixed(2)),
    memory_mb: {
      rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      heap_used: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heap_total: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const dbPing = await pool.query('SELECT 1 as ok');
    const wordsCount = await pool.query('SELECT COUNT(*)::int AS count FROM words');
    const dueToday = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM user_words
       WHERE next_review_date <= CURRENT_DATE`
    );

    return res.json({
      ...base,
      database: {
        connected: dbPing.rows[0]?.ok === 1,
        words_total: wordsCount.rows[0]?.count || 0,
        reviews_due_today: dueToday.rows[0]?.count || 0,
      },
    });
  } catch (error: any) {
    return res.status(503).json({
      ...base,
      status: 'degraded',
      database: {
        connected: false,
        error: error?.code || error?.message || 'unknown_error',
      },
    });
  }
});

/**
 * API Routes
 */
app.use('/auth', authRoutes);
app.use('/words', wordRoutes);
app.use('/review', reviewRoutes);
app.use('/ai', aiRoutes);

/**
 * Error handling
 */
app.use(errorHandler);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Initialize database
    try {
      await initDatabase();
      console.log('✓ Database initialized');
    } catch (dbErr) {
      console.warn('⚠ WARNING: Could not connect to database:', (dbErr as any).code);
      console.warn('⚠ The backend is starting in offline mode. Database functionality will not work.');
      console.warn('⚠ Please ensure PostgreSQL is running and configured in .env');
    }

    let port = REQUESTED_PORT;
    if (STRICT_PORT) {
      const free = await isPortAvailable(REQUESTED_PORT);
      if (!free) {
        console.error(
          `Port ${REQUESTED_PORT} is already in use. Stop the old process first, or set STRICT_PORT=false to auto-fallback.`
        );
        process.exit(1);
      }
    } else {
      port = await findAvailablePort(REQUESTED_PORT);
      if (port !== REQUESTED_PORT) {
        console.warn(`⚠ Port ${REQUESTED_PORT} is in use, switched to port ${port}`);
      }
    }

    const server = http.createServer(app);

    server.headersTimeout = REQUEST_TIMEOUT_MS + 5000;
    server.requestTimeout = REQUEST_TIMEOUT_MS;
    server.keepAliveTimeout = 5000;

    server.listen(port, () => {
      console.log(`✓ Server running on port ${port}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`✓ API is available at http://localhost:${port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await pool.end();
        console.log('✓ Server and DB pool closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export default app;
