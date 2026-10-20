import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connect, migrate, seed } from '../db.js';

test('interrupted seeding rolls back and concurrent retries seed exactly once', async () => {
  const db = await connect({ dataDir: 'memory://' });
  try {
    await migrate(db);
    let inserts = 0;
    const interrupted = { ...db, transaction: (work) => db.transaction((tx) => work({ query: (sql, params) => {
      if (sql.includes('INSERT INTO "gallery"') && ++inserts === 2) throw new Error('Startup interrupted');
      return tx.query(sql, params);
    } })) };
    await assert.rejects(seed(interrupted), /Startup interrupted/);
    for (const table of ['gallery', 'settings', 'images', 'meta']) {
      assert.equal((await db.query(`SELECT count(*)::int AS count FROM ${table}`))[0].count, 0);
    }
    assert.deepEqual(await Promise.all([seed(db), seed(db)]), [true, false]);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM gallery'))[0].count, 4);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM images'))[0].count, 5);
  } finally { await db.close(); }
});
