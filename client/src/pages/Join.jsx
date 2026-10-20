import { useState } from 'react';
import { api } from '../lib/api.js';
import { useSettings, usePageTitle } from '../lib/content.jsx';
import { Button, PageHero, Section } from '../components/ui.jsx';

const inputClass = 'w-full rounded-lg border border-line bg-card px-4 py-3 text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

export default function Join() {
  const settings = useSettings();
  usePageTitle(settings.joinNav);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: 'sending', message: '' });
    try {
      const { message } = await api('POST', '/api/join', Object.fromEntries(new FormData(form)));
      form.reset();
      setStatus({ state: 'sent', message });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  const contact = [settings.contactEmail, settings.contactPhone, settings.address].some(Boolean);

  return (
    <>
      <PageHero eyebrow={settings.joinEyebrow} title={settings.joinTitle} intro={settings.joinIntro} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
          <form onSubmit={submit} className="max-w-xl space-y-5">
            <Field label={settings.joinNameLabel}>
              <input name="name" required maxLength={120} autoComplete="name" className={inputClass} />
            </Field>
            <Field label={settings.joinEmailLabel}>
              <input name="email" type="email" required maxLength={160} autoComplete="email" className={inputClass} />
            </Field>
            <Field label={settings.joinPhoneLabel}>
              <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
            </Field>
            <Field label={settings.joinGenreLabel}>
              <input name="genre" maxLength={120} className={inputClass} />
            </Field>
            <Field label={settings.joinMessageLabel}>
              <textarea name="message" rows={4} maxLength={2000} className={inputClass} />
            </Field>
            {/* Hidden from people; bots that fill it in are ignored by the server. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <Button type="submit" disabled={status.state === 'sending'}>{settings.joinButton}</Button>
            <p role="status" className={`font-sans text-sm ${status.state === 'error' ? 'text-danger' : 'text-highlight'}`}>
              {status.message}
            </p>
          </form>

          {contact && (
            <aside className="h-fit rounded-xl border border-line bg-card p-7 font-sans">
              {settings.joinContactTitle && <h2 className="mb-4 text-2xl">{settings.joinContactTitle}</h2>}
              <div className="space-y-2">
                {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="block text-highlight underline underline-offset-4">{settings.contactEmail}</a>}
                {settings.contactPhone && <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="block">{settings.contactPhone}</a>}
                {settings.address && <p className="whitespace-pre-line text-muted">{settings.address}</p>}
              </div>
            </aside>
          )}
        </div>
      </Section>
    </>
  );
}
