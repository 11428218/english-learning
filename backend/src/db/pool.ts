import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database connection pool
 * Manages PostgreSQL connections efficiently
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '10000', 10),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT_MS || '10000', 10),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
