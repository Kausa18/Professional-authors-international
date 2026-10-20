import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import express from 'express';
import { connect, migrate, seed, removeUnusedImages } from './db.js';
import { createApp } from './app.js';
import { pageRoutes } from './pages.js';

const ROOT = path.resolve(import.meta.dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* no .env file: use the real environment */ }

const env = process.env;
const dev = process.argv.includes('--dev');
const production = env.NODE_ENV === 'production';
const port = Number(env.PORT) || 3000;

function fail(message) {
  console.error(message);
  process.exit(1);
}

let adminPassword = env.ADMIN_PASSWORD;
if (!adminPassword) {
  if (production) fail('ADMIN_PASSWORD must be set in production.');
  adminPassword = crypto.randomBytes(6).toString('hex');
  console.log(`No ADMIN_PASSWORD in .env. Temporary admin password for this run: ${adminPassword}`);
}
if (production && !env.DATABASE_URL) fail('DATABASE_URL must be set in production.');

// TRUST_PROXY: how many proxies sit in front of the app. Hosts like Render and
// Railway use one, so production defaults to 1.
function trustProxySetting(value) {
  if (value === undefined || value === '') return production ? 1 : false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'true' || value === 'false') return value === 'true';
  return value;
}

const db = await connect({ url: env.DATABASE_URL, dataDir: path.join(ROOT, '.data', 'pglite') });
if (db.kind === 'pglite') console.log('No DATABASE_URL set: using the built-in local database in .data/pglite');
await migrate(db);
if (await seed(db)) console.log('Added the starting content. Edit it from the Admin page.');

const app = createApp({ db, adminPassword, production, trustProxy: trustProxySetting(env.TRUST_PROXY) });
const server = http.createServer(app);

// Every non-API address is a page of the React app.
let getTemplate;
if (dev) {
  // One address for everything: Vite serves the React app with live reload.
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: path.join(ROOT, 'vite.config.js'),
    server: { middlewareMode: true, ws: { server } },
    appType: 'custom'
  });
  app.use(vite.middlewares);
  getTemplate = (url) => vite.transformIndexHtml(url, fs.readFileSync(path.join(ROOT, 'client', 'index.html'), 'utf8'));
} else {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) fail('The website has not been built yet. Run: npm run build');
  const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(dist, { index: false }));
  getTemplate = async () => template;
}
app.use(pageRoutes(db, getTemplate));

// Tidy up photos nobody uses any more and expired logins, now and every 6 hours.
async function cleanUp() {
  try {
    await db.query('DELETE FROM sessions WHERE expires_at < now()');
    const removed = await removeUnusedImages(db);
    if (removed) console.log(`Removed ${removed} unused photo(s).`);
  } catch (err) {
    console.error('Clean-up failed:', err.message);
  }
}
cleanUp();
setInterval(cleanUp, 6 * 3600 * 1000).unref();

server.listen(port, () => {
  console.log(`Professional Authors Zambia website: http://localhost:${port}`);
  console.log(`Admin: http://localhost:${port}/admin`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => db.close().finally(() => process.exit(0))));
}
