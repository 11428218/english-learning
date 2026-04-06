import pool from './pool';

/**
 * Database Schema Initialization
 * Creates all required tables for the language learning app
 */

const initDatabase = async () => {
  try {
    console.log('Initializing database schema...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Words table - vocabulary database
    await pool.query(`
      CREATE TABLE IF NOT EXISTS words (
        id SERIAL PRIMARY KEY,
        word VARCHAR(255) NOT NULL UNIQUE,
        definition TEXT NOT NULL,
        part_of_speech VARCHAR(50),
        domain VARCHAR(50) DEFAULT 'general',
        difficulty_level INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Words table created');

    // Example sentences for words
    await pool.query(`
      CREATE TABLE IF NOT EXISTS examples (
        id SERIAL PRIMARY KEY,
        word_id INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
        sentence TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Examples table created');

    // User word progress tracking (spaced repetition)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_words (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        word_id INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
        next_review_date TIMESTAMP,
        review_interval INT DEFAULT 1,
        ease_factor FLOAT DEFAULT 2.5,
        correct_streak INT DEFAULT 0,
        total_reviews INT DEFAULT 0,
        times_correct INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, word_id)
      )
    `);
    console.log('✓ User words table created');

    // Review history for analytics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_history (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        word_id INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
        is_correct BOOLEAN NOT NULL,
        review_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Review history table created');

    // Create indices for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_words_user_id ON user_words(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_words_next_review ON user_words(next_review_date);
      CREATE INDEX IF NOT EXISTS idx_examples_word_id ON examples(word_id);
      CREATE INDEX IF NOT EXISTS idx_review_history_user_id ON review_history(user_id);
    `);
    console.log('✓ Indices created');

    console.log('✓ Database schema initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

export default initDatabase;

if (require.main === module) {
  initDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Failed to initialize database schema from CLI:', err);
      await pool.end();
      process.exit(1);
    });
}
