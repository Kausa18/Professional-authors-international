import { useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useSettings, usePageTitle } from '../lib/content.jsx';
import { Button, ButtonLink, PageHero, Section } from '../components/ui.jsx';

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
  const pending = useRef(false);

  async function submit(e) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setStatus({ state: 'sending', message: '' });
    try {
      const { message } = await api('POST', '/api/join', values);
      form.reset();
      setStatus({ state: 'sent', message });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    } finally {
      pending.current = false;
    }
  }

  const contact = [settings.contactEmail, settings.contactPhone, settings.address].some(Boolean);

  return (
    <>
      <PageHero eyebrow={settings.joinEyebrow} title={settings.joinTitle} intro={settings.joinIntro} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
          <form onSubmit={submit} aria-busy={status.state === 'sending'} className="space-y-5 rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <fieldset disabled={status.state === 'sending'} className="space-y-5">
            <Field label={settings.joinNameLabel || 'Full name'}>
              <input name="name" required maxLength={120} autoComplete="name" className={inputClass} />
            </Field>
            <Field label={settings.joinEmailLabel || 'Email'}>
              <input name="email" type="email" required maxLength={160} autoComplete="email" className={inputClass} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
            <Field label={settings.joinPhoneLabel || 'Phone (optional)'}>
              <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
            </Field>
            <Field label={settings.joinGenreLabel || 'Genre or pen name (optional)'}>
              <input name="genre" maxLength={120} className={inputClass} />
            </Field>
            </div>
            <Field label={settings.joinMessageLabel || 'Message (optional)'}>
              <textarea name="message" rows={4} maxLength={2000} className={inputClass} />
            </Field>
            {/* Hidden from people; bots that fill it in are ignored by the server. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
            </fieldset>
            <Button type="submit" className="w-full sm:w-auto" disabled={status.state === 'sending'}>{status.state === 'sending' ? 'Sending…' : settings.joinButton || 'Request information'}</Button>
            <p role={status.state === 'error' ? 'alert' : 'status'} className={`font-sans text-sm ${status.message ? 'rounded-lg border p-4' : ''} ${status.state === 'error' ? 'border-danger/20 bg-danger/5 text-danger' : 'border-highlight/20 bg-highlight/5 text-highlight'}`}>
              {status.message}
            </p>
          </form>

          <aside className="h-fit space-y-8 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-line bg-card p-7">
              <p className="mb-3 font-sans text-xs font-bold uppercase tracking-widest text-highlight">{settings.membershipNav}</p>
              <h2 className="text-2xl">{settings.membershipTitle}</h2>
              <p className="mt-3 text-muted">{settings.membershipIntro}</p>
              <ButtonLink to="/membership" variant="outline" className="mt-6">{settings.ctaPrimaryLabel || settings.membershipNav}</ButtonLink>
            </div>
          {contact && (
            <div className="rounded-2xl border border-line bg-card p-7 font-sans">
              {settings.joinContactTitle && <h2 className="mb-4 text-2xl">{settings.joinContactTitle}</h2>}
              <div className="space-y-2">
                {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="block text-highlight underline underline-offset-4">{settings.contactEmail}</a>}
                {settings.contactPhone && <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="block">{settings.contactPhone}</a>}
                {settings.address && <p className="whitespace-pre-line text-muted">{settings.address}</p>}
              </div>
            </div>
          )}
          </aside>
        </div>
      </Section>
    </>
  );
}
