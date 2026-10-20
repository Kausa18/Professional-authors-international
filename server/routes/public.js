import express from 'express';
import crypto from 'node:crypto';
import { COLLECTIONS, SETTINGS, validate } from '../../shared/content.js';
import { q } from '../db.js';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const JOIN_FIELDS = [
  { key: 'name', label: 'Name', required: true, max: 120 },
  { key: 'email', label: 'Email', type: 'email', required: true, max: 160 },
  { key: 'phone', label: 'Phone', max: 40 },
  { key: 'genre', label: 'Genre or pen name', max: 120 },
  { key: 'message', label: 'Message', type: 'textarea', max: 2000 }
];

export async function loadSettings(db) {
  const saved = Object.fromEntries((await db.query('SELECT key, value FROM settings')).map((r) => [r.key, r.value]));
  return Object.fromEntries(SETTINGS.map((s) => [s.key, saved[s.key] ?? '']));
}

export async function loadCollection(db, name) {
  const def = COLLECTIONS[name];
  const order = def.sortBy === 'date' ? '"date", "time", created_at' : 'position, created_at';
  return db.query(`SELECT id, ${def.fields.map((f) => q(f.key)).join(', ')} FROM ${q(name)} ORDER BY ${order}`);
}

export function publicRoutes(db, { joinLimiter }) {
  const router = express.Router();

  router.get('/health', async (req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  });

  // Everything the public site shows, in one request.
  router.get('/content', async (req, res) => {
    const content = { settings: await loadSettings(db) };
    for (const name of Object.keys(COLLECTIONS)) content[name] = await loadCollection(db, name);
    res.set('Cache-Control', 'no-cache');
    res.json(content);
  });

  router.get('/images/:id', async (req, res) => {
    if (!UUID.test(req.params.id)) return res.status(404).end();
    const [image] = await db.query('SELECT mime, data FROM images WHERE id = $1', [req.params.id]);
    if (!image) return res.status(404).end();
    // An image's address never changes its content, so browsers can keep it.
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.type(image.mime).send(Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength));
  });

  router.post('/join', joinLimiter, async (req, res) => {
    const { joinSuccess } = await loadSettings(db);
    // Bots fill in every field, including this one that people never see.
    if (req.body?.website) return res.status(201).json({ message: joinSuccess });
    const { value, error } = validate(JOIN_FIELDS, req.body);
    if (error) return res.status(400).json({ error });
    await db.query(
      'INSERT INTO signups (id, name, email, phone, genre, message) VALUES ($1, $2, $3, $4, $5, $6)',
      [crypto.randomUUID(), value.name, value.email, value.phone, value.genre, value.message]
    );
    res.status(201).json({ message: joinSuccess });
  });

  return router;
}
