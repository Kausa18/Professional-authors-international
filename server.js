const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- Settings (read from a .env file if there is one) ----------
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* no .env file, that's fine */ }

const PORT = process.env.PORT || 3000;
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(6).toString('hex');
  console.log('No ADMIN_PASSWORD set in .env. Temporary admin password for this run: ' + ADMIN_PASSWORD);
}
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_HOURS = 8;

const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- What the admin can edit ----------
// Each collection is a list of items. type: text, textarea, date, time, url, image
const COLLECTIONS = {
  events: { title: { max: 120, req: 1 }, date: { type: 'date', req: 1 }, time: { type: 'time' }, location: { max: 120 }, description: { type: 'textarea', max: 1000 } },
  books: { title: { max: 120, req: 1 }, author: { max: 120, req: 1 }, description: { type: 'textarea', max: 600 }, genre: { max: 60 }, year: { max: 10 }, link: { type: 'url' }, image: { type: 'image' } },
  gallery: { image: { type: 'image', req: 1 }, caption: { max: 160 } },
  tiers: { name: { max: 60, req: 1 }, price: { max: 40 }, features: { type: 'textarea', max: 600 } },
  team: { name: { max: 100, req: 1 }, role: { max: 100 }, image: { type: 'image' } },
  services: { title: { max: 100, req: 1 }, text: { type: 'textarea', max: 400 } }
};
const SEEDS = {
  gallery: [
    ['/images/graduation-dinner-group.jpg', 'Guests at the graduation dinner'],
    ['/images/graduation-dinner-speech.jpg', 'A speech during the dinner'],
    ['/images/graduation-dinner-welcome.jpg', 'Guests being welcomed'],
    ['/images/graduation-dinner-guest.jpg', 'A guest at the dinner']
  ].map(([image, caption]) => ({ image, caption })),
  tiers: [
    { name: 'Emerging', price: '', features: 'Online circles\nMonthly workshop\nResource library' },
    { name: 'Professional', price: '', features: 'Everything in Emerging\nDirectory profile\nRights and contract clinics' },
    { name: 'Patron', price: '', features: "Everything in Professional\nSponsor a writer's grant\nAnnual gathering invitation" }
  ],
  services: [
    { title: 'Workshops and critique', text: 'Genre-specific groups and live sessions led by published authors.' },
    { title: 'Publishing guidance', text: 'Plain advice on agents, contracts, self-publishing, and royalties.' },
    { title: 'Translation and rights', text: 'Introductions to translators and foreign-rights contacts.' },
    { title: 'Member directory', text: 'A public author profile with your books, bio, and links.' }
  ]
};
const SETTING_DEFAULTS = {
  heroTitle: 'Writers who work across borders.',
  heroText: 'Professional Authors International is a community for working writers: sharing craft, contracts, and contacts with authors in every region.',
  galleryTitle: 'Our graduation dinner',
  galleryIntro: 'Members and guests at our recent graduation dinner.',
  aboutMission: "To support authors at every stage of their careers by sharing knowledge, opening doors to publishers, translators, and readers, and giving writers a strong voice as a community.",
  aboutStory: '',
  footerText: '© Professional Authors International.',
  contactEmail: ''
};
const SETTING_MAX = { heroTitle: 120, heroText: 400, galleryTitle: 120, galleryIntro: 200, aboutMission: 800, aboutStory: 4000, footerText: 200, contactEmail: 120 };

// ---------- Helpers ----------
const file = (name) => path.join(DATA_DIR, name + '.json');
function readJson(f, fallback) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return fallback; } }
function writeJson(f, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(f + '.tmp', JSON.stringify(data, null, 2));
  fs.renameSync(f + '.tmp', f);
}
function readList(name) {
  const list = readJson(file(name), null);
  if (list) return list;
  const seeded = (SEEDS[name] || []).map((x) => ({ id: crypto.randomUUID(), ...x }));
  if (seeded.length) writeJson(file(name), seeded);
  return seeded;
}
function sha(s) { return crypto.createHash('sha256').update(String(s)).digest(); }
function safeEqual(a, b) { return crypto.timingSafeEqual(sha(a), sha(b)); }
function sign(exp) { return crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex'); }
function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}
function isAdmin(req) {
  const [exp, sig] = getCookie(req, 'pai_admin').split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Please log in as admin.' });
  next();
}
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > 15 * 60 * 1000) { attempts.set(ip, { count: 1, first: now }); return false; }
  rec.count += 1;
  return rec.count > 5;
}
function removeUpload(p) {
  if (/^\/uploads\/[\w.-]+$/.test(p || '')) fs.unlink(path.join(PUBLIC_DIR, p), () => {});
}
function clean(schema, body) {
  const out = {};
  for (const [key, rule] of Object.entries(schema)) {
    const v = String(body[key] == null ? '' : body[key]).trim();
    const type = rule.type || 'text';
    if (!v && rule.req) return { error: `Please fill in: ${key}.` };
    if (v) {
      if (type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + 'T00:00:00')))) return { error: 'Please choose a valid date.' };
      if (type === 'time' && !/^\d{2}:\d{2}$/.test(v)) return { error: 'Please enter the time as HH:MM.' };
      if (type === 'url' && !(/^https?:\/\/\S+$/i.test(v) && v.length <= 300)) return { error: 'Links must start with http:// or https://' };
      if (type === 'image' && !/^\/(uploads|images)\/[\w.-]+$/.test(v)) return { error: 'Invalid image.' };
      if (rule.max && v.length > rule.max) return { error: `${key} is too long (${rule.max} characters max).` };
    }
    out[key] = v;
  }
  return { value: out };
}
function sorted(name, list) {
  return name === 'events' ? list.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))) : list;
}

// ---------- App ----------
const app = express();

// Photo upload (the page sends a resized photo as text). Registered before the small-body parser.
app.post('/api/admin/upload', requireAdmin, express.json({ limit: '6mb' }), (req, res) => {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body.data || ''));
  if (!m) return res.status(400).json({ error: 'Please choose a JPG, PNG, or WebP photo.' });
  const buf = Buffer.from(m[2], 'base64');
  const okMagic = (m[1] === 'jpeg' && buf[0] === 0xff && buf[1] === 0xd8) ||
    (m[1] === 'png' && buf.slice(1, 4).toString() === 'PNG') ||
    (m[1] === 'webp' && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP');
  if (!okMagic || buf.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'That photo could not be used (4 MB max).' });
  const name = crypto.randomUUID() + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  res.json({ path: '/uploads/' + name });
});

app.use(express.json({ limit: '50kb' }));
app.get('/site.html', (req, res) => res.redirect('/'));
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Join form
app.post('/api/join', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const genre = String(req.body.genre || '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please provide a name and a valid email.' });
  const signups = readJson(file('signups'), []);
  signups.push({ name, email, genre, date: new Date().toISOString() });
  writeJson(file('signups'), signups);
  res.status(201).json({ message: 'Thank you for joining!' });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  if (tooManyAttempts(req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  if (!safeEqual(req.body.password || '', ADMIN_PASSWORD)) return res.status(401).json({ error: 'Wrong password.' });
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `pai_admin=${exp}.${sign(exp)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}${secure}`);
  res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'pai_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});
app.get('/api/admin/session', (req, res) => res.json({ admin: isAdmin(req) }));

// Site text
app.get('/api/settings', (req, res) => res.json({ ...SETTING_DEFAULTS, ...readJson(file('settings'), {}) }));
app.put('/api/settings', requireAdmin, (req, res) => {
  const saved = {};
  for (const [key, max] of Object.entries(SETTING_MAX)) {
    const v = String(req.body[key] == null ? SETTING_DEFAULTS[key] : req.body[key]).trim();
    if (v.length > max) return res.status(400).json({ error: `${key} is too long (${max} characters max).` });
    saved[key] = v;
  }
  if (saved.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved.contactEmail)) return res.status(400).json({ error: 'Please enter a valid email.' });
  writeJson(file('settings'), saved);
  res.json(saved);
});

// Events, books, gallery, membership tiers, leadership, services
function schemaOf(req, res) {
  if (!Object.hasOwn(COLLECTIONS, req.params.name)) { res.status(404).json({ error: 'Not found.' }); return null; }
  return COLLECTIONS[req.params.name];
}
app.get('/api/c/:name', (req, res) => {
  if (!schemaOf(req, res)) return;
  res.json(sorted(req.params.name, readList(req.params.name)));
});
app.post('/api/c/:name', requireAdmin, (req, res) => {
  const schema = schemaOf(req, res); if (!schema) return;
  const { value, error } = clean(schema, req.body);
  if (error) return res.status(400).json({ error });
  const list = readList(req.params.name);
  const item = { id: crypto.randomUUID(), ...value };
  list.push(item);
  writeJson(file(req.params.name), list);
  res.status(201).json(item);
});
app.put('/api/c/:name/:id', requireAdmin, (req, res) => {
  const schema = schemaOf(req, res); if (!schema) return;
  const { value, error } = clean(schema, req.body);
  if (error) return res.status(400).json({ error });
  const list = readList(req.params.name);
  const i = list.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Item not found.' });
  if (list[i].image && list[i].image !== value.image) removeUpload(list[i].image);
  list[i] = { id: list[i].id, ...value };
  writeJson(file(req.params.name), list);
  res.json(list[i]);
});
app.delete('/api/c/:name/:id', requireAdmin, (req, res) => {
  if (!schemaOf(req, res)) return;
  const list = readList(req.params.name);
  const item = list.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  removeUpload(item.image);
  writeJson(file(req.params.name), list.filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Professional Authors International running at http://localhost:${PORT}`);
  console.log(`Admin page: http://localhost:${PORT}/#admin`);
});
