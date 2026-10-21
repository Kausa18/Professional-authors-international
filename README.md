# Professional Authors Zambia

The website and content admin for Professional Authors Zambia (PAZ).

- **Frontend:** React, React Router, Tailwind CSS, built with Vite
- **Backend:** Node.js and Express
- **Database:** PostgreSQL. Photos are stored in the database too, so nothing is lost when the site is redeployed.

## Run it on your computer

1. Install Node.js 22.12 or newer from https://nodejs.org
2. Copy `.env.example` to `.env` and set `ADMIN_PASSWORD` to a long password.
3. In this folder, run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000. The admin is at http://localhost:3000/admin

If `DATABASE_URL` is empty, the site uses a built-in local database stored in `.data/pglite`, so you don't need to install anything else.

To use a PostgreSQL server you have installed, run `npm run db:create`. It asks for the `postgres` user's password, creates a `paz` login and database, and saves `DATABASE_URL` in `.env`. Use `PGPORT=5433 npm run db:create` for a server on another port. For a hosted database (Neon, Supabase), paste its connection string into `DATABASE_URL` instead.

## Editing the website

Everything visitors see is edited from **/admin**. You don't need to change any code.

| Admin section | What it controls |
|---|---|
| **Lists** | Events, books, photo gallery, highlights, membership tiers, leadership, services, "What we stand for" |
| **Brand** | Name, tagline, logo, footer, search engine description |
| **Appearance** | Brand colours, gallery style, how many books and events show on the home page, whether past events are shown |
| **Home / About page** | Every heading, text and button, plus which sections appear and in what order |
| **Other pages** | Menu label, headline and intro for each page; the join form's labels and thank-you message |
| **Contact details** | Email, phone, address, Facebook and Instagram links |
| **Join form sign-ups** | Everyone who filled in the join form; download as CSV for Excel |

Photos are resized in the browser before upload. Photos that are no longer used are deleted automatically.

Settings save only the fields you changed. If another tab changes the same field, the admin asks you to reload the saved values before trying again. List edits also detect conflicting changes. Save and upload buttons show their progress, and switching admin sections prompts before discarding unsaved edits.

Database setup, initial content, settings updates, list changes, and photo cleanup use transactions, so an interrupted operation rolls back instead of leaving half-applied content. Concurrent PostgreSQL instances coordinate content writes with a transaction lock.

The text the site starts with is in `server/seed/defaults.js`. It is copied into the database only the first time the site runs; after that, the Admin page is the place to change it.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site with live reload while you work on the code |
| `npm test` | Runs the server tests (uses a temporary in-memory database) |
| `npm run test:browser` | Checks the built website and admin in Chrome at desktop and mobile sizes |
| `npm run build` | Builds the website into `dist/` |
| `npm run build:vercel` | Builds Vercel assets and routes; requires `RENDER_ORIGIN` |
| `npm start` | Runs the built website (run `npm run build` first) |
| `npm run db:create` | Creates the PostgreSQL login and database and saves the connection in `.env` |

For browser checks, run `npm run build` first. Chrome must be installed. To use Edge, set `PLAYWRIGHT_CHANNEL=msedge`; to use Playwright's Chromium, run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. In PowerShell, set a variable with `$env:PLAYWRIGHT_CHANNEL = 'msedge'`.

Browser checks use disposable in-memory content at port 4317 and never load `.env` or use your saved content. They cover public pages, navigation, responsive and dark layouts, join submissions, admin settings conflicts, uploads, book editing, and failed/successful logout. Screenshots and failure traces are saved in the ignored `test-results/` folder.

To run the API suite against PostgreSQL, set `PAZ_TEST_DATABASE_URL` to a **new, empty disposable test database**, then run `npm test`. The suite writes and deletes test content; never point it at a database containing content you need to keep. Without that variable, tests use an in-memory database.

## Putting it online

The deployment uses **Neon** for PostgreSQL, **Render** for Express and dynamic page HTML, and **Vercel** for the public address and built React assets. Requests follow this path:

```text
Browser -> Vercel -> Render -> Neon
           assets   HTML/API   content, photos, sessions, sign-ups
```

Vercel forwards page and API requests to Render under the same public address. This preserves secure admin cookies, page redirects, real 404 responses, and the page titles, descriptions, colours, and icons loaded from saved settings. No CORS configuration is needed.

### 1. Neon database

Create a project in [Neon](https://console.neon.tech), preferably in AWS Frankfurt to match the Render configuration. Copy its pooled PostgreSQL connection string from **Connect**, keeping its TLS parameters (`sslmode=require` and any `channel_binding` parameter).

The first Render start creates the schema and seeds the starting content automatically. This does not copy an existing local database. If you have edited local content, migrate that database before the first production start; keep the local database until the deployed content has been verified.

### 2. Render backend

Push this source, including `render.yaml`, to GitHub. In [Render](https://dashboard.render.com), choose **New > Blueprint**, connect this repository, and explicitly select the branch containing these files (currently `feat/production`). The Blueprint creates one Node.js web service in Frankfurt with:

| Setting | Value |
|---|---|
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm start` |
| Health check | `/api/health` |
| Node | `24` |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `DATABASE_URL` | Neon connection string; prompted during Blueprint setup |
| `ADMIN_PASSWORD` | A long, random password; prompted during Blueprint setup |

The Blueprint uses Render's Free instance. Free services [sleep after 15 minutes of inactivity](https://render.com/docs/free#spinning-down-on-idle), and the next visitor waits for startup. Choose a paid instance in Render if the site must stay responsive continuously.

Wait for a successful deploy. Open the service's actual public URL followed by `/api/health` and check for `{"status":"ok"}`. Save that URL for Vercel; Render may add a suffix to the service name. No persistent disk is required because photos and content live in Neon.

### 3. Vercel frontend and public address

Import the same repository in [Vercel](https://vercel.com/new), using the repository root. Select **Other** as the framework; `vercel.json` supplies the install and build commands. Set the production branch to the same branch used by Render.

Add **`RENDER_ORIGIN`** to the Vercel project's Production environment, with the actual Render origin (for example `https://your-service.onrender.com`). It must use HTTPS and have no path, query, or credentials. Add it to Preview as well only if previews should access the same backend and data. Never put `DATABASE_URL` or `ADMIN_PASSWORD` on Vercel.

Deploy. `npm run build:vercel` generates `.vercel/output/config.json` and static assets using Vercel's [Build Output API](https://vercel.com/docs/build-output-api/configuration). There is no hardcoded Render hostname in the source. A missing or invalid `RENDER_ORIGIN` fails the build with an explanation.

### 4. Verify the live site

At the Vercel address, check `/api/health`, the public pages, a seeded gallery photo, and a direct visit to `/about`. Log in at `/admin`, save a reversible text edit, reload to confirm persistence, restore it, and log out. Unknown page URLs should return HTTP 404. Confirm the session cookie has `Secure`, `HttpOnly`, and `SameSite=Strict`.

For updates, deploy the same commit to both services, preferably Render first. Render's HTML references that commit's built assets; asset requests absent from the current Vercel deployment fall through to Render. If the Render URL changes, update `RENDER_ORIGIN` and redeploy Vercel. Keep credentials in the hosting dashboards and `.env` out of Git.

## Project layout

```
client/            React app (pages, components, admin)
  src/pages/       Public pages; src/pages/admin/ is the admin
  src/components/  Layout and reusable blocks
server/            Express API
  routes/          Public and admin endpoints
  seed/            Starting content and photos (first run only)
  test/            API tests
shared/content.js  The content model: every setting and list, used by both sides
scripts/           Setup helpers (creating the database)
```

Keep `.env` private. It is listed in `.gitignore` and must never be committed.
