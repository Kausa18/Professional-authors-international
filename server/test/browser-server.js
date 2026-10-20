// Browser tests run the production bundle with disposable content. Never load
// .env or connect to the user's development/production database here.
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { connect, migrate, seed } from '../db.js';
import { createApp } from '../app.js';
import { pageRoutes } from '../pages.js';

export async function startBrowserServer() {
  const dist = path.resolve(import.meta.dirname, '../../dist');
  const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
  const db = await connect({ dataDir: 'memory://' });
  try {
    await migrate(db);
    await seed(db);
    const app = createApp({ db, adminPassword: 'browser-test-password', production: true, limits: { join: 100, login: 100 } });
    app.use('/assets', express.static(path.join(dist, 'assets')));
    app.use(pageRoutes(db, async () => template));
    const server = await new Promise((resolve, reject) => {
      const instance = app.listen(4317, 'localhost', () => resolve(instance));
      instance.on('error', reject);
    });
    return async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await db.close();
    };
  } catch (error) {
    await db.close();
    throw error;
  }
}
