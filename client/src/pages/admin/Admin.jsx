import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { COLLECTIONS, SETTING_GROUPS } from '../../../../shared/content.js';
import { api } from '../../lib/api.js';
import { useContent, useSettings, usePageTitle } from '../../lib/content.jsx';
import { Button } from '../../components/ui.jsx';
import { inputClass } from './fields.jsx';
import { AdminSession } from './session.jsx';
import { CollectionPanel, SettingsPanel, SignupsPanel } from './panels.jsx';

const MENU = [
  { heading: 'Lists', items: Object.entries(COLLECTIONS).map(([key, def]) => ({ id: `list-${key}`, label: def.label, help: def.help, render: () => <CollectionPanel name={key} /> })) },
  { heading: 'Text and settings', items: SETTING_GROUPS.map((g) => ({ id: `settings-${g.key}`, label: g.label, render: () => <SettingsPanel group={g.key} /> })) },
  { heading: 'People', items: [{ id: 'signups', label: 'Join form sign-ups', render: () => <SignupsPanel /> }] }
];
const ALL_ITEMS = MENU.flatMap((m) => m.items);

function Login({ onLogin }) {
  const settings = useSettings();
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await api('POST', '/api/admin/login', { password: new FormData(e.currentTarget).get('password') });
      onLogin();
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-xl border border-line bg-card p-8 shadow-sm">
        {settings.logo && <img src={settings.logo} alt="" className="mx-auto h-20 w-20" />}
        <h1 className="text-center text-2xl">{settings.siteName}</h1>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Admin password</span>
          <input name="password" type="password" required autoFocus autoComplete="current-password" className={inputClass} />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={sending} className="w-full">Log in</Button>
        <Link to="/" className="block text-center text-sm text-muted hover:underline">Back to the website</Link>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const settings = useSettings();
  const [params, setParams] = useSearchParams();
  const current = ALL_ITEMS.find((i) => i.id === params.get('tab')) ?? ALL_ITEMS.find((i) => i.id === 'list-events');
  const open = (id) => setParams({ tab: id });

  async function logout() {
    await api('POST', '/api/admin/logout').catch(() => {});
    onLogout();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-card">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {settings.logo && <img src={settings.logo} alt="" className="h-9 w-9" />}
            <p className="truncate font-semibold">{settings.shortName || settings.siteName} <span className="font-normal text-muted">Admin</span></p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <a href="/" target="_blank" rel="noopener" className="rounded-md px-3 py-1.5 hover:bg-ink/5">View website ↗</a>
            <button type="button" onClick={logout} className="rounded-md border border-line px-3 py-1.5 hover:border-ink">Log out</button>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-[15rem_1fr]">
        <nav aria-label="Admin" className="hidden border-r border-line bg-card md:block">
          <div className="sticky top-[61px] max-h-[calc(100vh-61px)] space-y-6 overflow-y-auto p-4">
            {MENU.map((group) => (
              <div key={group.heading}>
                <p className="mb-1 px-3 text-xs font-bold uppercase tracking-wider text-muted">{group.heading}</p>
                {group.items.map((item) => (
                  <button key={item.id} type="button" onClick={() => open(item.id)} aria-current={item.id === current.id ? 'page' : undefined}
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-sm ${item.id === current.id ? 'bg-primary font-semibold text-on-primary' : 'hover:bg-ink/5'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0 bg-card p-4 sm:p-8">
          <label className="mb-6 block md:hidden">
            <span className="sr-only">Section</span>
            <select value={current.id} onChange={(e) => open(e.target.value)} className={inputClass}>
              {MENU.map((group) => (
                <optgroup key={group.heading} label={group.heading}>
                  {group.items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <h1 className="text-3xl">{current.label}</h1>
          {current.help && <p className="mt-1 text-muted">{current.help}</p>}
          <div className="mt-8" key={current.id}>{current.render()}</div>
        </main>
      </div>
    </div>
  );
}

export default function Admin() {
  const { status } = useContent();
  const [session, setSession] = useState('checking');
  usePageTitle('Admin');

  useEffect(() => {
    api('GET', '/api/admin/session').then((s) => setSession(s.admin ? 'in' : 'out')).catch(() => setSession('out'));
  }, []);
  const expire = useCallback(() => setSession('out'), []);

  if (status === 'loading' || session === 'checking') return <div className="min-h-screen" aria-busy="true" />;
  if (status === 'error') return <p role="alert" className="p-8">The content could not be loaded. Please make sure the server is running.</p>;

  return (
    <div className="font-sans">
      {session === 'in'
        ? <AdminSession onExpired={expire}><Dashboard onLogout={expire} /></AdminSession>
        : <Login onLogin={() => setSession('in')} />}
    </div>
  );
}
