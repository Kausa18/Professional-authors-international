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

The text the site starts with is in `server/seed/defaults.js`. It is copied into the database only the first time the site runs; after that, the Admin page is the place to change it.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site with live reload while you work on the code |
| `npm test` | Runs the server tests (uses a temporary in-memory database) |
| `npm run build` | Builds the website into `dist/` |
| `npm start` | Runs the built website (run `npm run build` first) |
| `npm run db:create` | Creates the PostgreSQL login and database and saves the connection in `.env` |

## Putting it online

The site needs a Node.js host (for example Render, Railway, or a VPS) and a PostgreSQL database (for example Neon or Supabase, both have free plans). GitHub Pages cannot run it.

1. Create the database and copy its connection string.
2. On the host, connect this repository and set:
   - **Build command:** `npm install --include=dev && npm run build`
   - **Start command:** `npm start`
   - **Environment variables:** `NODE_ENV=production`, `ADMIN_PASSWORD`, `DATABASE_URL`
3. The first start creates the tables and the starting content.

`TRUST_PROXY` defaults to `1` in production, which is right for Render, Railway and most VPS setups behind nginx. It makes sure login limits apply to each visitor rather than to the host's proxy.

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
