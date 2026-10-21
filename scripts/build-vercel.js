import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, '.vercel', 'output');

// Use the actual Render URL, which can have a suffix added by Render.
// Only this public origin belongs on Vercel; database/admin secrets stay on Render.
let origin;
try {
  origin = new URL(process.env.RENDER_ORIGIN);
  if (origin.protocol !== 'https:' || origin.username || origin.password
    || origin.pathname !== '/' || origin.search || origin.hash) throw new Error();
} catch {
  throw new Error('Set RENDER_ORIGIN to the HTTPS origin of your Render service, for example https://your-service.onrender.com (no path, query, or credentials).');
}

// Only publish built assets. Express fills the HTML head from saved settings,
// and must handle /admin, API requests, redirects, and unknown-page 404s.
// The output directory is fixed within this project, never supplied by the user.
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(path.join(output, 'static'), { recursive: true });
await fs.cp(path.join(root, 'dist', 'assets'), path.join(output, 'static', 'assets'), { recursive: true });
await fs.writeFile(path.join(output, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: `${origin.origin}/$1` }
  ]
}, null, 2) + '\n');
console.log(`Vercel assets prepared; page and API requests will be forwarded to ${origin.origin}.`);
