import express from 'express';
import { renderHtml, isKnownPage, normalizePath } from './html.js';
import { loadSettings } from './routes/public.js';

export function pageRoutes(db, getTemplate) {
  const router = express.Router();
  router.get('/{*page}', async (req, res) => {
    const normalized = normalizePath(req.path);
    if (isKnownPage(req.path) && normalized !== req.path) {
      const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
      return res.redirect(308, normalized + query);
    }
    const html = renderHtml(await getTemplate(req.originalUrl), await loadSettings(db), req.path, `${req.protocol}://${req.get('host')}`);
    res.status(isKnownPage(req.path) ? 200 : 404).set('Cache-Control', normalized === '/admin' ? 'no-store' : 'no-cache').type('html').send(html);
  });
  return router;
}
