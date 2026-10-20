import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { COLLECTIONS, SETTINGS } from '../shared/content.js';
import { SETTING_DEFAULTS, COLLECTION_SEEDS, SEED_LOGO } from './seed/defaults.js';

const SEED_IMAGES = path.join(import.meta.dirname, 'seed', 'images');

// Connects to PostgreSQL when a URL is given, otherwise to an embedded
// PostgreSQL (PGlite) stored in dataDir, or held in memory for 'memory://'.
// Transactions always use one connection. The shared lock serializes content
// writes across server instances, including first-run setup and image cleanup.
export async function connect({ url, dataDir }) {
  if (url) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: url, max: 10 });
    return {
      kind: 'postgres',
      query: async (sql, params) => (await pool.query(sql, params)).rows,
      transaction: async (work) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query('SELECT pg_advisory_xact_lock(184721093)');
          const result = await work({ query: async (sql, params) => (await client.query(sql, params)).rows });
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      close: () => pool.end()
    };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  if (dataDir !== 'memory://') await fs.mkdir(dataDir, { recursive: true });
  const db = await PGlite.create(dataDir);
  return {
    kind: 'pglite',
    query: async (sql, params) => (await db.query(sql, params)).rows,
    transaction: (work) => db.transaction((tx) => work({ query: async (sql, params) => (await tx.query(sql, params)).rows })),
    close: () => db.close()
  };
}

// Field keys come from shared/content.js, never from requests; quoting still
// keeps words like "date" and "text" safe as column names.
export const q = (identifier) => {
  if (!/^[a-z][a-zA-Z_]*$/.test(identifier)) throw new Error('Bad identifier: ' + identifier);
  return `"${identifier}"`;
};

export async function migrate(db) {
  return db.transaction(async (db) => {
    await db.query(`CREATE TABLE IF NOT EXISTS meta (key text PRIMARY KEY, value text NOT NULL)`);
    await db.query(`CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL)`);
    await db.query(`CREATE TABLE IF NOT EXISTS images (
      id uuid PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);
    await db.query(`CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL)`);
    await db.query(`CREATE TABLE IF NOT EXISTS signups (
      id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, phone text NOT NULL DEFAULT '',
      genre text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now())`);
    for (const [name, def] of Object.entries(COLLECTIONS)) {
      await db.query(`CREATE TABLE IF NOT EXISTS ${q(name)} (
        id uuid PRIMARY KEY, position integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now())`);
      // Adding columns this way lets new fields appear without losing content.
      for (const f of def.fields) {
        await db.query(`ALTER TABLE ${q(name)} ADD COLUMN IF NOT EXISTS ${q(f.key)} text NOT NULL DEFAULT ''`);
      }
    }
  });
}

export async function saveImage(db, mime, buffer) {
  const id = crypto.randomUUID();
  await db.query('INSERT INTO images (id, mime, data) VALUES ($1, $2, $3)', [id, mime, buffer]);
  return '/api/images/' + id;
}

async function seedImage(db, file) {
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return saveImage(db, mime, await fs.readFile(path.join(SEED_IMAGES, file)));
}

// Writes the starting content once. Anything deleted later stays deleted.
export async function seed(db) {
  return db.transaction(async (db) => {
    const done = await db.query(`SELECT 1 FROM meta WHERE key = 'seeded'`);
    if (done.length) {
      await addMissingSettings(db);
      return false;
    }
    const defaults = { ...SETTING_DEFAULTS, logo: await seedImage(db, SEED_LOGO) };
    for (const s of SETTINGS) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [s.key, defaults[s.key] ?? '']);
    }
    for (const [name, items] of Object.entries(COLLECTION_SEEDS)) {
      const fields = COLLECTIONS[name].fields;
      for (const [i, item] of items.entries()) {
        const row = { ...item };
        for (const f of fields) if (f.type === 'image' && row[f.key]) row[f.key] = await seedImage(db, row[f.key]);
        const keys = fields.map((f) => f.key);
        await db.query(
          `INSERT INTO ${q(name)} (id, position, ${keys.map(q).join(', ')}) VALUES ($1, $2, ${keys.map((_, k) => '$' + (k + 3)).join(', ')})`,
          [crypto.randomUUID(), i + 1, ...keys.map((k) => row[k] ?? '')]
        );
      }
    }
    await db.query(`INSERT INTO meta (key, value) VALUES ('seeded', $1)`, [new Date().toISOString()]);
    return true;
  });
}

// Settings added in later versions get their default value on existing sites.
async function addMissingSettings(db) {
  for (const s of SETTINGS) {
    if (s.type === 'image') continue;
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [s.key, SETTING_DEFAULTS[s.key] ?? '']);
  }
}

// Every image path currently used by a setting or a list item.
async function usedImages(db) {
  const used = new Set();
  const imageSettings = SETTINGS.filter((s) => s.type === 'image').map((s) => s.key);
  for (const row of await db.query('SELECT value FROM settings WHERE key = ANY($1)', [imageSettings])) used.add(row.value);
  for (const [name, def] of Object.entries(COLLECTIONS)) {
    for (const f of def.fields.filter((f) => f.type === 'image')) {
      for (const row of await db.query(`SELECT ${q(f.key)} AS v FROM ${q(name)}`)) used.add(row.v);
    }
  }
  return used;
}

// Deletes images no longer used anywhere. Recent uploads are kept for a day
// so a photo uploaded into an unsaved form is not removed under the admin.
export async function removeUnusedImages(db, { graceHours = 24 } = {}) {
  return db.transaction(async (db) => {
    const used = await usedImages(db);
    const candidates = await db.query(
      `SELECT id FROM images WHERE created_at < now() - make_interval(hours => $1)`, [graceHours]);
    const unused = candidates.map((r) => r.id).filter((id) => !used.has('/api/images/' + id));
    if (unused.length) await db.query('DELETE FROM images WHERE id = ANY($1::uuid[])', [unused]);
    return unused.length;
  });
}

// Deletes specific images straight away if nothing uses them any more.
export async function releaseImages(db, paths) {
  const used = await usedImages(db);
  const ids = paths.filter((p) => p && !used.has(p)).map((p) => p.split('/').pop());
  if (ids.length) await db.query('DELETE FROM images WHERE id = ANY($1::uuid[])', [ids]);
}
