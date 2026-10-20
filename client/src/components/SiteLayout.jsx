import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { PAGES } from '../../../shared/content.js';
import { useContent, useSettings } from '../lib/content.jsx';
import { Container } from './ui.jsx';
import StatusScreen from './StatusScreen.jsx';

function Brand({ settings, compact = false }) {
  return (
    <Link to="/" className={`flex min-w-0 items-center gap-3 ${compact ? 'lg:max-w-[20rem]' : ''}`}>
      {settings.logo && <img src={settings.logo} alt="" width={compact ? 44 : 64} height={compact ? 44 : 64} className={`${compact ? 'h-11 w-11' : 'h-16 w-16'} shrink-0 object-contain`} />}
      <span className="min-w-0">
        <span className={`block font-display text-lg font-semibold leading-tight ${compact ? 'truncate' : ''}`}>{settings.siteName}</span>
        {settings.tagline && <span className={`block font-sans text-xs text-muted ${compact ? 'truncate' : 'mt-1'}`}>{settings.tagline}</span>}
      </span>
    </Link>
  );
}

const navClass = ({ isActive }) =>
  `font-sans text-[0.95rem] underline-offset-8 decoration-2 decoration-accent hover:underline ${isActive ? 'underline' : ''}`;

function Header({ settings }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  const links = PAGES.filter((p) => p.key !== 'join' && settings[p.nav]);
  const join = PAGES.find((p) => p.key === 'join');

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex items-center justify-between gap-4 py-3">
        <Brand settings={settings} compact />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {links.map((p) => <NavLink key={p.key} to={p.path} className={navClass}>{settings[p.nav]}</NavLink>)}
          {settings[join.nav] && (
            <NavLink to={join.path} className="rounded-full bg-primary px-5 py-2 font-sans text-sm font-semibold text-on-primary">
              {settings[join.nav]}
            </NavLink>
          )}
        </nav>
        <button ref={menuButton} type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line lg:hidden" aria-expanded={open} aria-controls={open ? 'mobile-menu' : undefined} onClick={() => setOpen(!open)}>
          <span className="sr-only">Menu</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </Container>
      {open && (
        <nav id="mobile-menu" className="border-t border-line lg:hidden" aria-label="Main">
          <Container className="flex flex-col py-2">
            {[...links, join].filter((p) => settings[p.nav]).map((p) => (
              <NavLink key={p.key} to={p.path} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-3 font-sans ${isActive ? 'bg-highlight/10 font-semibold text-highlight' : 'hover:bg-ink/5'}`}>
                {settings[p.nav]}
              </NavLink>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}

function SocialLink({ href, label, path }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded-full border border-line p-2 hover:border-ink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={path} /></svg>
    </a>
  );
}

const ICONS = {
  facebook: 'M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5H16.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z',
  instagram: 'M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.8-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM21 7.3c-.1-1.4-.4-2.7-1.4-3.7S17.3 2.3 15.9 2.2c-1.5-.1-5.9-.1-7.4 0-1.4.1-2.7.4-3.7 1.4S3.4 5.9 3.3 7.3c-.1 1.5-.1 5.9 0 7.4.1 1.4.4 2.7 1.4 3.7s2.3 1.3 3.7 1.4c1.5.1 5.9.1 7.4 0 1.4-.1 2.7-.4 3.7-1.4s1.3-2.3 1.4-3.7c.1-1.5.1-5.9 0-7.4z'
};

function Footer({ settings }) {
  const hasContact = settings.contactEmail || settings.contactPhone || settings.address;
  return (
    <footer className="mt-auto border-t border-line bg-card">
      <Container className={`grid gap-10 py-12 sm:grid-cols-2 ${(hasContact || settings.facebookUrl || settings.instagramUrl) ? 'lg:grid-cols-[2fr_1fr_1.5fr]' : 'lg:grid-cols-[2fr_1fr]'}`}>
        <div>
          <Brand settings={settings} />
          {settings.metaDescription && <p className="mt-4 max-w-sm text-[0.95rem] text-muted">{settings.metaDescription}</p>}
        </div>
        <nav className="flex flex-col gap-2 font-sans text-sm" aria-label="Footer">
          {PAGES.filter((p) => settings[p.nav]).map((p) => (
            <Link key={p.key} to={p.path} className="hover:underline">{settings[p.nav]}</Link>
          ))}
        </nav>
        {(hasContact || settings.facebookUrl || settings.instagramUrl) && (
          <div className="space-y-2 font-sans text-sm">
            {settings.joinContactTitle && <p className="font-semibold">{settings.joinContactTitle}</p>}
            {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="block hover:underline">{settings.contactEmail}</a>}
            {settings.contactPhone && <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="block hover:underline">{settings.contactPhone}</a>}
            {settings.address && <p className="whitespace-pre-line text-muted">{settings.address}</p>}
            <div className="flex gap-2 pt-2">
              <SocialLink href={settings.facebookUrl} label="Facebook" path={ICONS.facebook} />
              <SocialLink href={settings.instagramUrl} label="Instagram" path={ICONS.instagram} />
            </div>
          </div>
        )}
      </Container>
      {settings.footerText && (
        <div className="border-t border-line">
          <Container className="py-5 font-sans text-xs text-muted">© {new Date().getFullYear()} {settings.footerText}</Container>
        </div>
      )}
    </footer>
  );
}

export default function SiteLayout() {
  const { status, retry } = useContent();
  const settings = useSettings();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (status === 'loading') return <StatusScreen />;
  if (status === 'error') {
    return <StatusScreen error="Please check your connection and try again." onRetry={retry} />;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header settings={settings} />
      <main id="main-content" tabIndex={-1} className="flex-1"><Outlet /></main>
      <Footer settings={settings} />
    </div>
  );
}
