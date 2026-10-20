import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => { throw error; });
});

async function login(page) {
  await page.goto('/admin');
  await page.getByLabel('Admin password').fill('browser-test-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
}

async function openPanel(page, name) {
  const select = page.getByRole('combobox', { name: 'Section', exact: true });
  if (await select.isVisible()) {
    await select.selectOption({ label: name });
  } else {
    await page.getByRole('navigation', { name: 'Admin', exact: true }).getByRole('button', { name, exact: true }).click();
  }
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
}

test('public pages render without runtime errors, broken photos, or horizontal overflow', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/about', '/services', '/books', '/membership', '/events', '/join']) {
    const response = await page.goto(route);
    expect(response.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`${route === '/' ? 'home' : route.slice(1)}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('mobile menu works with navigation and Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation');
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.locator('#mobile-menu').getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL('/about');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('public navigation and browser history keep pages working', async ({ page }) => {
  await page.goto('/');
  for (const name of ['About', 'Services', 'Books', 'Membership', 'Events', 'Join']) {
    await page.getByRole('navigation', { name: 'Footer', exact: true }).getByRole('link', { name, exact: true }).click();
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.goBack();
  await expect(page).toHaveURL('/events');
  await expect(page.locator('main h1')).toBeVisible();
});

test('dark mode and small screens remain readable without page overflow', async ({ page, isMobile }, testInfo) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: isMobile ? 320 : 1024, height: 900 });
  await page.goto('/join');
  await expect(page.locator('main h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dark-join.png'), fullPage: true });
});

test('admin sections fit the screen and show usable fields', async ({ page }, testInfo) => {
  await login(page);
  for (const name of ['Highlights', 'Photo gallery', 'Membership tiers', 'Leadership', 'Services', 'What we stand for', 'Brand', 'Appearance', 'Contact details', 'About page', 'Services page', 'Books page', 'Membership page', 'Events page', 'Join page', 'Join form sign-ups']) {
    await openPanel(page, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('admin-signups.png'), fullPage: true });
});

test('join form submits once and displays confirmation', async ({ page }) => {
  await page.goto('/join');
  await page.getByLabel('Full name').fill('Browser Test Author');
  await page.getByLabel('Email', { exact: true }).fill('author@example.com');
  let submissions = 0;
  await page.route('**/api/join', async (route) => {
    submissions++;
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.continue();
  });
  await page.getByRole('button', { name: 'Request information' }).click();
  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Thank you');
  expect(submissions).toBe(1);
  await expect(page.getByLabel('Full name')).toHaveValue('');
});

test('content loading failure offers a working retry', async ({ page }) => {
  await page.route('**/api/content', (route) => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('check your connection');
  await page.unroute('**/api/content');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('main h1')).toBeVisible();
});

test('admin edits settings, handles a conflict, and preserves unrelated settings', async ({ page }) => {
  await login(page);
  await openPanel(page, 'Home page');
  const heading = page.getByLabel('Banner: headline');
  const original = await heading.inputValue();
  await heading.fill('A home for every author');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved.');
  const content = await page.request.get('/api/content');
  const { settings } = await content.json();
  await page.request.patch('/api/admin/settings', { data: {
    changes: { heroTitle: 'Changed in another tab' }, previous: { heroTitle: settings.heroTitle }
  } });
  await heading.fill('A conflicting edit');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('another tab');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reload saved values' }).click();
  await expect(heading).toHaveValue('Changed in another tab');
  await heading.fill(original);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved.');
});

test('admin can upload a cover, add a book, edit it, and delete it', async ({ page }) => {
  await login(page);
  await openPanel(page, 'Books');
  await page.getByLabel('Book title').fill('Browser QA book');
  await page.getByRole('textbox', { name: 'Author', exact: true }).fill('QA Author');
  await page.getByRole('button', { name: 'Cover image', exact: true }).setInputFiles(path.resolve('server/seed/images/logo.png'));
  await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const item = page.locator('li').filter({ hasText: 'Browser QA book' });
  await expect(item).toBeVisible();
  await expect(item.locator('img')).toHaveJSProperty('complete', true);
  await item.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Book title').fill('Edited QA book');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  const updated = page.locator('li').filter({ hasText: 'Edited QA book' });
  await expect(updated).toBeVisible();
  const publicPage = await page.context().newPage();
  await publicPage.goto('/books');
  await expect(publicPage.getByRole('heading', { name: 'Edited QA book', exact: true })).toBeVisible();
  await publicPage.close();
  page.once('dialog', (dialog) => dialog.accept());
  await updated.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(updated).toHaveCount(0);
});

test('failed logout keeps the admin signed in and successful retry ends the session', async ({ page }) => {
  await login(page);
  await page.route('**/api/admin/logout', (route) => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('still logged in');
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
  await page.unroute('**/api/admin/logout');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
  expect((await (await page.request.get('/api/admin/session')).json()).admin).toBe(false);
});

test('admin warns before discarding edits when switching sections', async ({ page }) => {
  await login(page);
  await openPanel(page, 'Home page');
  const input = page.getByLabel('Banner: headline');
  const original = await input.inputValue();
  await input.fill('An unsaved draft');
  page.once('dialog', (dialog) => dialog.dismiss());
  const select = page.getByRole('combobox', { name: 'Section', exact: true });
  if (await select.isVisible()) await select.selectOption({ label: 'Brand' });
  else await page.getByRole('navigation', { name: 'Admin', exact: true }).getByRole('button', { name: 'Brand', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Home page', exact: true })).toBeVisible();
  await expect(input).toHaveValue('An unsaved draft');
  await input.fill(original);
});

test('admin can read, export, and delete a join submission', async ({ page, isMobile }, testInfo) => {
  const name = `Export QA ${testInfo.project.name}`;
  const email = `export-${testInfo.project.name}@example.com`;
  await page.request.post('/api/join', { data: { name, email, message: 'Please send membership details.' } });
  await login(page);
  await openPanel(page, 'Join form sign-ups');
  await expect(page.getByRole('link', { name: email, exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('signups-with-content.png'), fullPage: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download for Excel (CSV)' }).click();
  const download = await downloadPromise;
  expect(await fs.readFile(await download.path(), 'utf8')).toContain(email);
  const row = page.getByRole(isMobile ? 'article' : 'row').filter({ hasText: email });
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('link', { name: email, exact: true })).toHaveCount(0);
});

test('unknown pages and trailing slashes have the correct behavior', async ({ page }) => {
  await page.goto('/about/');
  await expect(page).toHaveURL('/about');
  await expect(page.locator('main h1')).toBeVisible();
  const response = await page.goto('/not-a-page');
  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to the home page' }).click();
  await expect(page.locator('main h1')).toBeVisible();
});
