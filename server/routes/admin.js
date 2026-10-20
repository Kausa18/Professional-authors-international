import express from 'express';
import crypto from 'node:crypto';
import { COLLECTIONS, SETTINGS, validate } from '../../shared/content.js';
import { q, saveImage, releaseImages } from '../db.js';
import { loadSettings, loadCollection, UUID } from './public.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Check the file really is the image type it claims to be.
function looksLike(mime, buf) {
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
}

// Stops spreadsheet programs treating a cell like "=SUM(...)" as a formula.
function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const imagesOf = (fields, row) => fields.filter((f) => f.type === 'image').map((f) => row?.[f.key]).filter(Boolean);

export function adminRoutes(db, auth, { loginLimiter }) {
  const router = express.Router();

  router.post('/login', loginLimiter, async (req, res) => {
    if (!auth.passwordMatches(req.body?.password ?? '')) return res.status(401).json({ error: 'Wrong password.' });
    await auth.startSession(res);
    res.json({ ok: true });
  });
  router.post('/logout', async (req, res) => {
    await auth.endSession(req, res);
    res.json({ ok: true });
  });
  router.get('/session', async (req, res) => res.json({ admin: await auth.isAdmin(req) }));

  // Everything below needs a logged-in admin.
  router.use(auth.requireAdmin);

  router.put('/settings', async (req, res) => {
    const { value, error } = validate(SETTINGS, req.body);
    if (error) return res.status(400).json({ error });
    const before = await loadSettings(db);
    for (const [key, v] of Object.entries(value)) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, v]);
    }
    await releaseImages(db, imagesOf(SETTINGS, before).filter((p) => !Object.values(value).includes(p)));
    res.json(await loadSettings(db));
  });

  router.post('/images', express.raw({ type: IMAGE_TYPES, limit: MAX_IMAGE_BYTES }), async (req, res) => {
    const mime = req.get('content-type');
    if (!Buffer.isBuffer(req.body) || !IMAGE_TYPES.includes(mime) || !looksLike(mime, req.body)) {
      return res.status(400).json({ error: 'Please choose a JPG, PNG, or WebP photo.' });
    }
    res.status(201).json({ url: await saveImage(db, mime, req.body) });
  });

  // ---------- Lists: events, books, gallery, ... ----------
  const list = express.Router({ mergeParams: true });
  router.use('/collections/:name', (req, res, next) => {
    req.def = Object.hasOwn(COLLECTIONS, req.params.name) ? COLLECTIONS[req.params.name] : null;
    if (!req.def) return res.status(404).json({ error: 'Not found.' });
    next();
  }, list);

  const findItem = async (name, id) => (UUID.test(id) ? (await db.query(`SELECT * FROM ${q(name)} WHERE id = $1`, [id]))[0] : undefined);

  list.post('/', async (req, res) => {
    const { name } = req.params;
    const { value, error } = validate(req.def.fields, req.body);
    if (error) return res.status(400).json({ error });
    const keys = Object.keys(value);
    const [item] = await db.query(
      `INSERT INTO ${q(name)} (id, position, ${keys.map(q).join(', ')})
       VALUES ($1, (SELECT COALESCE(MAX(position), 0) + 1 FROM ${q(name)}), ${keys.map((_, i) => '$' + (i + 2)).join(', ')})
       RETURNING id`,
      [crypto.randomUUID(), ...keys.map((k) => value[k])]
    );
    res.status(201).json({ id: item.id, ...value });
  });

  list.put('/:id', async (req, res) => {
    const { name, id } = req.params;
    const existing = await findItem(name, id);
    if (!existing) return res.status(404).json({ error: 'Item not found.' });
    const { value, error } = validate(req.def.fields, req.body);
    if (error) return res.status(400).json({ error });
    const keys = Object.keys(value);
    await db.query(
      `UPDATE ${q(name)} SET ${keys.map((k, i) => `${q(k)} = $${i + 2}`).join(', ')} WHERE id = $1`,
      [id, ...keys.map((k) => value[k])]
    );
    await releaseImages(db, imagesOf(req.def.fields, existing).filter((p) => !Object.values(value).includes(p)));
    res.json({ id, ...value });
  });

  list.delete('/:id', async (req, res) => {
    const { name, id } = req.params;
    const existing = await findItem(name, id);
    if (!existing) return res.status(404).json({ error: 'Item not found.' });
    await db.query(`DELETE FROM ${q(name)} WHERE id = $1`, [id]);
    await releaseImages(db, imagesOf(req.def.fields, existing));
    res.json({ ok: true });
  });

  list.post('/:id/move', async (req, res) => {
    const { name, id } = req.params;
    if (req.def.sortBy) return res.status(400).json({ error: 'This list is sorted automatically.' });
    const step = req.body?.direction === 'up' ? -1 : req.body?.direction === 'down' ? 1 : 0;
    if (!step) return res.status(400).json({ error: 'Invalid direction.' });
    const ids = (await loadCollection(db, name)).map((r) => r.id);
    const from = ids.indexOf(id);
    if (from < 0) return res.status(404).json({ error: 'Item not found.' });
    const to = from + step;
    if (to >= 0 && to < ids.length) {
      [ids[from], ids[to]] = [ids[to], ids[from]];
      for (const [i, itemId] of ids.entries()) await db.query(`UPDATE ${q(name)} SET position = $1 WHERE id = $2`, [i + 1, itemId]);
    }
    res.json({ ok: true });
  });

  // ---------- Join form sign-ups ----------
  const signups = () => db.query('SELECT id, name, email, phone, genre, message, created_at FROM signups ORDER BY created_at DESC');

  router.get('/signups', async (req, res) => res.json(await signups()));

  router.get('/signups.csv', async (req, res) => {
    const rows = [['Name', 'Email', 'Phone', 'Genre or pen name', 'Message', 'Date']]
      .concat((await signups()).map((s) => [s.name, s.email, s.phone, s.genre, s.message, new Date(s.created_at).toISOString()]));
    res.set('Content-Disposition', `attachment; filename="signups-${new Date().toISOString().slice(0, 10)}.csv"`);
    // The byte-order mark makes Excel read names with accents correctly.
    res.type('text/csv').send('﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'));
  });

  router.delete('/signups/:id', async (req, res) => {
    if (!UUID.test(req.params.id)) return res.status(404).json({ error: 'Not found.' });
    await db.query('DELETE FROM signups WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  });

  return router;
}
