# Professional Authors International

## Run it
1. Install Node.js 18 or newer from https://nodejs.org
2. Copy `.env.example` to `.env` and set `ADMIN_PASSWORD` to a long password of your own.
   (Without a .env file, the server prints a temporary password in the terminal each time it starts.)
3. In this folder run:
   npm install
   npm start
4. Open http://localhost:3000

## Edit the site from the Admin page
Open http://localhost:3000/#admin and log in. The tabs let you change:
- Site text: home headline and intro, gallery heading, About mission and story, footer, contact email
- Events, Books (with cover photos and links), Photo gallery, Membership tiers, Leadership, Services

Photos are uploaded from the Admin page and saved in public/uploads/. No code changes are needed to add content.
Content is saved in the data/ folder. Back up data/ and public/uploads/ to keep your content safe.
Keep `.env` private and never share it.

## Files
- public/index.html: the whole website in one file. Search for "STYLES" (CSS) and "SCRIPT" (JavaScript).
- server.js: Express server, admin login, and the content and upload endpoints
- public/images/: the starting graduation dinner photos
- public/uploads/: photos you add through the Admin page
- data/: saved content (created automatically)
- legacy/: the earlier version with a separate file for each page. It is not used by the site.

## Put the project on GitHub
You need a free account at https://github.com and Git installed from https://git-scm.com

1. Create the repository on GitHub
   - Click the + button (top right), then "New repository".
   - Name it, for example `professional-authors-international`.
   - Choose Private if you do not want the code and photos public. Choose Public to share it.
   - Leave "Add a README" and the other boxes unticked, then click "Create repository".
   - Copy the repository address that GitHub shows, for example
     https://github.com/YOUR-USERNAME/professional-authors-international.git
2. In a terminal, go into this project folder and run:
   git init
   git add .
   git status
   git commit -m "First version of the website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/professional-authors-international.git
   git push -u origin main
   (Replace the address with the one you copied. GitHub may ask you to sign in.)
3. Check `git status` before you commit. The list must NOT include `.env`. If it does, stop and tell someone before pushing,
   because `.env` holds your admin password.

Later, after you change the code:
   git add .
   git commit -m "Describe what you changed"
   git push

What is saved on GitHub, and what is not:
- Saved: the code and the four starting photos in public/images/.
- Not saved (kept private on purpose): `.env`, the data/ folder (events, books, sign-ups), and public/uploads/ (photos added through Admin).
  Back those up yourself, because GitHub will not have them.

Note: GitHub stores the code but does not run this site. GitHub Pages cannot run the Express server.
To put the site online, use a Node.js host such as Render, Railway, or a VPS, and connect it to your repository.
Set ADMIN_PASSWORD and NODE_ENV=production in the host's settings, not in the code.
