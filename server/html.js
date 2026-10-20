import { PAGES, themeVariables } from '../shared/content.js';

const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const normalizePath = (pathname) => pathname.replace(/\/+$/, '').toLowerCase() || '/';
export const isKnownPage = (pathname) => {
  const normalized = normalizePath(pathname);
  return normalized === '/' || normalized === '/admin' || PAGES.some((p) => p.path === normalized);
};

// Fills the page's <head> from the settings, so the title, description, icon
// and colours are right before any JavaScript runs (and in link previews).
export function renderHtml(template, settings, pathname, origin) {
  pathname = normalizePath(pathname);
  const page = PAGES.find((p) => p.path === pathname);
  const title = page ? `${settings[page.nav]} | ${settings.siteName}` : settings.siteName;
  const description = (page && settings[page.intro]) || settings.metaDescription;
  const logo = settings.logo ? origin + settings.logo : '';
  const vars = Object.entries(themeVariables(settings)).map(([k, v]) => `${k}:${v}`).join(';');

  const head = [
    `<title>${escape(title)}</title>`,
    description && `<meta name="description" content="${escape(description)}">`,
    `<meta property="og:type" content="website">`,
    pathname === '/admin' && '<meta name="robots" content="noindex, nofollow">',
    `<meta property="og:site_name" content="${escape(settings.siteName)}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    description && `<meta property="og:description" content="${escape(description)}">`,
    logo && `<meta property="og:image" content="${escape(logo)}">`,
    `<meta name="theme-color" content="${escape(settings.colorPrimary)}">`,
    settings.logo && `<link rel="icon" href="${escape(settings.logo)}">`,
    settings.logo && `<link rel="apple-touch-icon" href="${escape(settings.logo)}">`,
    `<style>:root{${escape(vars)}}</style>`
  ].filter(Boolean).join('\n    ');

  return template.replace('<!--app-head-->', head);
}
