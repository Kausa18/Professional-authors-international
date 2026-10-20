import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { connect, migrate, seed, removeUnusedImages } from '../db.js';
import { createApp } from '../app.js';
import { SETTINGS, COLLECTIONS } from '../../shared/content.js';

const PASSWORD = 'test-password';
let db, app;

before(async () => {
  db = await connect({ dataDir: 'memory://' });
  await migrate(db);
  await seed(db);
  app = createApp({ db, adminPassword: PASSWORD, limits: { join: 3, login: 3 } });
});
after(() => db.close());

async function login() {
  const res = await request(app).post('/api/admin/login').send({ password: PASSWORD }).expect(200);
  return res.headers['set-cookie'][0].split(';')[0];
}

const tinyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);

test('health check reaches the database', async () => {
  await request(app).get('/api/health').expect(200, { status: 'ok' });
});

test('content includes every setting and the seeded lists', async () => {
  const { body } = await request(app).get('/api/content').expect(200);
  assert.deepEqual(Object.keys(body.settings).sort(), SETTINGS.map((s) => s.key).sort());
  assert.equal(body.settings.siteName, 'Professional Authors Zambia');
  assert.match(body.settings.logo, /^\/api\/images\//);
  for (const name of Object.keys(COLLECTIONS)) assert.ok(Array.isArray(body[name]), name);
  assert.equal(body.gallery.length, 4);
  assert.equal(body.highlights.length, 3);
});

test('seeded photos are served from the database', async () => {
  const { body } = await request(app).get('/api/content');
  const res = await request(app).get(body.gallery[0].image).expect(200);
  assert.equal(res.headers['content-type'], 'image/jpeg');
  assert.ok(res.body.length > 1000);
  await request(app).get('/api/images/not-an-id').expect(404);
});

test('seeding runs only once', async () => {
  assert.equal(await seed(db), false);
  const { body } = await request(app).get('/api/content');
  assert.equal(body.gallery.length, 4);
});

test('admin routes need a login', async () => {
  await request(app).post('/api/admin/collections/events').send({ title: 'x', date: '2030-01-01' }).expect(401);
  await request(app).put('/api/admin/settings').send({}).expect(401);
  await request(app).get('/api/admin/signups').expect(401);
});

test('wrong password is refused', async () => {
  await request(app).post('/api/admin/login').send({ password: 'nope' }).expect(401);
});

test('events can be added, edited, and deleted', async () => {
  const cookie = await login();
  const bad = await request(app).post('/api/admin/collections/events').set('Cookie', cookie).send({ title: 'Launch', date: 'soon' }).expect(400);
  assert.match(bad.body.error, /date/i);

  const { body: created } = await request(app).post('/api/admin/collections/events').set('Cookie', cookie)
    .send({ title: 'Book launch', date: '2030-05-01', time: '18:00', location: 'Lusaka' }).expect(201);
  await request(app).put(`/api/admin/collections/events/${created.id}`).set('Cookie', cookie)
    .send({ title: 'Big book launch', date: '2030-05-02' }).expect(200);

  let { body } = await request(app).get('/api/content');
  const event = body.events.find((e) => e.id === created.id);
  assert.equal(event.title, 'Big book launch');
  assert.equal(event.time, '');

  await request(app).delete(`/api/admin/collections/events/${created.id}`).set('Cookie', cookie).expect(200);
  ({ body } = await request(app).get('/api/content'));
  assert.ok(!body.events.some((e) => e.id === created.id));
  await request(app).delete(`/api/admin/collections/events/${created.id}`).set('Cookie', cookie).expect(404);
  await request(app).post('/api/admin/collections/nothing').set('Cookie', cookie).send({}).expect(404);
});

test('deleting a gallery photo removes the image too', async () => {
  const cookie = await login();
  const { body } = await request(app).get('/api/content');
  const photo = body.gallery[0];
  await request(app).delete(`/api/admin/collections/gallery/${photo.id}`).set('Cookie', cookie).expect(200);
  await request(app).get(photo.image).expect(404);
});

test('uploads only accept real images', async () => {
  const cookie = await login();
  await request(app).post('/api/admin/images').set('Cookie', cookie).set('Content-Type', 'image/jpeg')
    .send(Buffer.from('<script>alert(1)</script>')).expect(400);
  await request(app).post('/api/admin/images').set('Cookie', cookie).set('Content-Type', 'text/html')
    .send('<p>hi</p>').expect(400);
  const { body } = await request(app).post('/api/admin/images').set('Cookie', cookie).set('Content-Type', 'image/jpeg')
    .send(tinyJpeg).expect(201);
  assert.match(body.url, /^\/api\/images\//);

  // Unused uploads survive the grace period, then are cleaned up.
  assert.equal(await removeUnusedImages(db), 0);
  await removeUnusedImages(db, { graceHours: 0 });
  await request(app).get(body.url).expect(404);
});

test('items can be reordered', async () => {
  const cookie = await login();
  const before = (await request(app).get('/api/content')).body.services.map((s) => s.id);
  await request(app).post(`/api/admin/collections/services/${before[1]}/move`).set('Cookie', cookie).send({ direction: 'up' }).expect(200);
  const after = (await request(app).get('/api/content')).body.services.map((s) => s.id);
  assert.deepEqual(after, [before[1], before[0], ...before.slice(2)]);
  await request(app).post(`/api/admin/collections/events/${before[0]}/move`).set('Cookie', cookie).send({ direction: 'up' }).expect(400);
});

test('settings are validated and saved', async () => {
  const cookie = await login();
  const { body: content } = await request(app).get('/api/content');
  const settings = { ...content.settings, heroTitle: 'New headline', colorPrimary: '#112233', layoutHome: 'hero,-gallery,intro,highlights,events,books,cta' };
  const { body } = await request(app).put('/api/admin/settings').set('Cookie', cookie).send(settings).expect(200);
  assert.equal(body.heroTitle, 'New headline');
  assert.equal(body.layoutHome, 'hero,-gallery,intro,highlights,events,books,cta');

  for (const broken of [{ colorPrimary: 'red' }, { siteName: '' }, { homeBooksCount: '99' }, { layoutHome: 'hero' }, { contactEmail: 'nope' }]) {
    await request(app).put('/api/admin/settings').set('Cookie', cookie).send({ ...settings, ...broken }).expect(400);
  }
});

test('join form saves sign-ups, ignores bots, and is rate limited', async () => {
  await request(app).post('/api/join').send({ name: 'Bot', email: 'bot@example.com', website: 'spam.example' }).expect(201);
  await request(app).post('/api/join').send({ name: '', email: 'x' }).expect(400);
  const ok = await request(app).post('/api/join').send({ name: 'Mwila', email: 'mwila@example.com', message: '=HYPERLINK("x")' }).expect(201);
  assert.match(ok.body.message, /thank you/i);
  await request(app).post('/api/join').send({ name: 'Again', email: 'again@example.com' }).expect(429);

  const cookie = await login();
  const { body: signups } = await request(app).get('/api/admin/signups').set('Cookie', cookie).expect(200);
  assert.equal(signups.length, 1);
  assert.equal(signups[0].name, 'Mwila');

  const csv = await request(app).get('/api/admin/signups.csv').set('Cookie', cookie).expect(200);
  assert.match(csv.text, /Mwila,mwila@example\.com/);
  assert.match(csv.text, /"'=HYPERLINK\(""x""\)"/);

  await request(app).delete(`/api/admin/signups/${signups[0].id}`).set('Cookie', cookie).expect(200);
  assert.equal((await request(app).get('/api/admin/signups').set('Cookie', cookie)).body.length, 0);
});

test('logging out ends the session on the server', async () => {
  const cookie = await login();
  await request(app).get('/api/admin/signups').set('Cookie', cookie).expect(200);
  await request(app).post('/api/admin/logout').set('Cookie', cookie).expect(200);
  await request(app).get('/api/admin/signups').set('Cookie', cookie).expect(401);
});

test('unknown API addresses return JSON 404', async () => {
  const res = await request(app).get('/api/nothing-here').expect(404);
  assert.equal(res.body.error, 'Not found.');
});
