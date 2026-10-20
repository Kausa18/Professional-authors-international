import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createAuth } from './auth.js';
import { publicRoutes } from './routes/public.js';
import { adminRoutes } from './routes/admin.js';

// Builds the API. Serving the React app is added by index.js, so tests can
// use this on its own.
export function createApp({ db, adminPassword, production = false, trustProxy = false, limits = {} }) {
  const app = express();
  // Behind a host's proxy (Render, Railway, nginx) this must be set, or every
  // visitor shares the proxy's address and one person can lock out the admin.
  app.set('trust proxy', trustProxy);

  app.use(helmet(production
    ? { contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'blob:'] } } }
    : { contentSecurityPolicy: false, hsts: false })); // the dev server injects inline scripts

  const auth = createAuth(db, { password: adminPassword, secureCookies: production });
  const limiter = (windowMinutes, limit, error, extra) => rateLimit({
    windowMs: windowMinutes * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: { error }, ...extra
  });

  const api = express.Router();
  api.use(express.json({ limit: '100kb' }));
  api.use(publicRoutes(db, {
    joinLimiter: limiter(60, limits.join ?? 5, 'Too many requests. Please try again later.')
  }));
  api.use('/admin', adminRoutes(db, auth, {
    loginLimiter: limiter(15, limits.login ?? 5, 'Too many attempts. Try again in 15 minutes.', { skipSuccessfulRequests: true })
  }));
  api.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  api.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That is too large to upload.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' });
    if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  app.use('/api', api);
  return app;
}
