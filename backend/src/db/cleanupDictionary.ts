import pool from './pool';
import { isTeachableDictionaryWord } from './dictionaryQuality';

const DEFAULT_BATCH_SIZE = 5000;
const DELETE_BATCH_SIZE = 2000;

const cleanupDictionary = async (): Promise<void> => {
  const applyChanges = String(process.env.DICTIONARY_CLEANUP_APPLY || 'false').toLowerCase() === 'true';
  const batchSize = Number(process.env.DICTIONARY_CLEANUP_BATCH_SIZE || DEFAULT_BATCH_SIZE);

  let lastId = 0;
  let scanned = 0;
  let flagged = 0;
  let deleted = 0;
  const idsToDelete: number[] = [];

  while (true) {
    const result = await pool.query(
      `
      SELECT id, word
      FROM words
      WHERE id > $1
      ORDER BY id ASC
      LIMIT $2
      `,
      [lastId, batchSize]
    );

    if (result.rows.length === 0) break;

    for (const row of result.rows) {
      scanned += 1;
      lastId = row.id;

      if (!isTeachableDictionaryWord(row.word)) {
        flagged += 1;
        idsToDelete.push(row.id);
      }
    }

    if (applyChanges && idsToDelete.length >= DELETE_BATCH_SIZE) {
      const deleteIds = idsToDelete.splice(0, DELETE_BATCH_SIZE);
      const deleteResult = await pool.query('DELETE FROM words WHERE id = ANY($1::int[])', [deleteIds]);
      deleted += deleteResult.rowCount || 0;
      console.log(`Deleted ${deleted} words so far...`);
    }
  }

  if (applyChanges && idsToDelete.length > 0) {
    const deleteResult = await pool.query('DELETE FROM words WHERE id = ANY($1::int[])', [idsToDelete]);
    deleted += deleteResult.rowCount || 0;
    idsToDelete.length = 0;
  }

  const stats = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE part_of_speech IS NOT NULL AND part_of_speech <> 'unknown')::int AS with_pos,
      COUNT(*) FILTER (WHERE definition NOT ILIKE 'English vocabulary word:%')::int AS with_real_definition
    FROM words
  `);

  console.log('Dictionary cleanup complete.');
  console.log(`Scanned rows: ${scanned}`);
  console.log(`Flagged low-value rows: ${flagged}`);
  console.log(`Deleted rows: ${applyChanges ? deleted : 0}`);
  console.log(`Mode: ${applyChanges ? 'apply' : 'dry-run'}`);
  console.log(`Remaining words total: ${stats.rows[0].total}`);
  console.log(`Remaining words with POS: ${stats.rows[0].with_pos}`);
  console.log(`Remaining words with real definitions: ${stats.rows[0].with_real_definition}`);
};

if (require.main === module) {
  cleanupDictionary()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Failed to clean up dictionary:', error);
      await pool.end();
      process.exit(1);
    });
}

export default cleanupDictionary;
