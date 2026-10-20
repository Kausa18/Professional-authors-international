import crypto from 'node:crypto';

const COOKIE = 'paz_admin';

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

// Admin sessions are random tokens; only their hash is stored, so a leaked
// database cannot be used to log in. Logging out deletes the session.
export function createAuth(db, { password, secureCookies, sessionHours = 8 }) {
  const tokenHash = (token) => sha256(token).toString('hex');

  async function isAdmin(req) {
    const token = readCookie(req, COOKIE);
    if (!token) return false;
    const rows = await db.query('SELECT 1 FROM sessions WHERE token_hash = $1 AND expires_at > now()', [tokenHash(token)]);
    return rows.length > 0;
  }

  return {
    isAdmin,

    async requireAdmin(req, res, next) {
      if (await isAdmin(req)) return next();
      res.status(401).json({ error: 'Please log in again.' });
    },

    passwordMatches: (input) => crypto.timingSafeEqual(sha256(input), sha256(password)),

    async startSession(res) {
      const token = crypto.randomBytes(32).toString('base64url');
      await db.query(
        'INSERT INTO sessions (token_hash, expires_at) VALUES ($1, now() + make_interval(hours => $2))',
        [tokenHash(token), sessionHours]
      );
      res.cookie(COOKIE, token, {
        httpOnly: true, sameSite: 'strict', secure: secureCookies, path: '/', maxAge: sessionHours * 3600 * 1000
      });
    },

    async endSession(req, res) {
      const token = readCookie(req, COOKIE);
      if (token) await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
      res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: secureCookies, path: '/' });
    }
  };
}
