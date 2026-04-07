import pool from './pool';
import initDatabase from './init';
import seedDatabase from './seed';

// importWordNetStructured is authored as a CLI-style module, so use require here.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const importWordNetStructured = require('./importWordNetStructured').default as () => Promise<void>;

const AUTO_IMPORT_THRESHOLD = Math.max(parseInt(process.env.WORD_LIBRARY_BOOTSTRAP_THRESHOLD || '1000', 10), 1);

const bootstrapDatabase = async (): Promise<void> => {
  console.log('Bootstrapping database...');

  await initDatabase();
  console.log('✓ Database initialized');

  await seedDatabase();
  console.log('✓ Seed vocabulary inserted');

  const wordCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM words');
  const wordCount = Number(wordCountResult.rows[0]?.count || 0);

  console.log(`Current word count: ${wordCount}`);

  const autoImportEnabled = String(process.env.AUTO_IMPORT_WORDNET || 'true').toLowerCase() === 'true';
  if (autoImportEnabled && wordCount < AUTO_IMPORT_THRESHOLD) {
    console.log(`Word count below threshold (${AUTO_IMPORT_THRESHOLD}); importing WordNet dataset...`);
    await importWordNetStructured();
    console.log('✓ WordNet dataset imported');
  } else {
    console.log('✓ WordNet import skipped');
  }
};

if (require.main === module) {
  bootstrapDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Failed to bootstrap database:', error);
      await pool.end();
      process.exit(1);
    });
}

export default bootstrapDatabase;
