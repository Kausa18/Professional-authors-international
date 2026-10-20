import { useCallback, useEffect, useRef, useState } from 'react';
import { COLLECTIONS, SETTINGS, validate } from '../../../../shared/content.js';
import { useContent } from '../../lib/content.jsx';
import { Button } from '../../components/ui.jsx';
import { FieldRow } from './fields.jsx';
import { Notice, useAdminApi, useNotice, useUnsavedChanges } from './session.jsx';

const rowButton = 'min-h-11 rounded-md border border-line px-3 py-1.5 text-sm hover:border-ink disabled:cursor-not-allowed disabled:opacity-40';

// Counts photo uploads still in progress, so a form is not saved too early.
function useBusy() {
  const [busy, setBusy] = useState(0);
  return [busy > 0, useCallback((step) => setBusy((n) => n + step), [])];
}

export function SettingsPanel({ group }) {
  const api = useAdminApi();
  const { data, reload, updateSettings } = useContent();
  const [values, setValues] = useState(data.settings);
  const [baseline, setBaseline] = useState(data.settings);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [notice, setNotice] = useNotice();
  const [busy, onBusy] = useBusy();
  const fields = SETTINGS.filter((s) => s.group === group);
  const changedFields = fields.filter((field) => values[field.key] !== baseline[field.key]);
  const dirty = changedFields.length > 0;
  useUnsavedChanges(dirty);

  async function save(e) {
    e.preventDefault();
    if (pending.current || busy || !dirty) return;
    const { value: changes, error } = validate(changedFields, values);
    if (error) return setNotice({ error: true, text: error });
    pending.current = true;
    setSaving(true);
    setNotice(null);
    try {
      const previous = Object.fromEntries(changedFields.map((field) => [field.key, baseline[field.key]]));
      const settings = await api('PATCH', '/api/admin/settings', { changes, previous });
      setValues(settings);
      setBaseline(settings);
      updateSettings(settings);
      setNotice({ text: 'Saved. The website has been updated.' });
    } catch (err) {
      setNotice({ error: true, text: err.message, conflict: err.status === 409 });
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  async function reset() {
    if (dirty && !confirm('Discard your edits and load the latest saved values?')) return;
    try {
      const latest = await reload();
      setValues(latest.settings);
      setBaseline(latest.settings);
      setNotice(null);
    } catch (err) { setNotice({ error: true, text: err.message }); }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <fieldset disabled={saving} className="space-y-6">
        {fields.map((field) => (
          <FieldRow key={field.key} field={field} value={values[field.key]} onBusy={onBusy}
            onChange={(v) => setValues((s) => ({ ...s, [field.key]: v }))} />
        ))}
      </fieldset>
      <div className="sticky bottom-0 -mx-1 space-y-3 bg-card/95 px-1 py-4 backdrop-blur">
        <Notice notice={notice} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || saving || !dirty}>{saving ? 'Saving…' : busy ? 'Waiting for photo…' : 'Save changes'}</Button>
          <button type="button" disabled={saving || busy} onClick={reset} className={rowButton}>Reload saved values</button>
          <span className="text-xs text-muted">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
        </div>
      </div>
    </form>
  );
}

function summary(def, item) {
  const sub = def.subtitle && item[def.subtitle];
  return {
    title: item[def.title] || 'Untitled',
    subtitle: def.subtitle === 'date' && sub
      ? new Date(sub + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : sub
  };
}

export function CollectionPanel({ name }) {
  const api = useAdminApi();
  const { data, reload } = useContent();
  const def = COLLECTIONS[name];
  const items = data[name];
  const blank = Object.fromEntries(def.fields.map((f) => [f.key, '']));
  const [editingId, setEditingId] = useState(null);
  const [values, setValues] = useState(blank);
  const [original, setOriginal] = useState(blank);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [notice, setNotice] = useNotice();
  const [busy, onBusy] = useBusy();
  const formRef = useRef(null);

  const dirty = def.fields.some((field) => values[field.key] !== original[field.key]);
  useUnsavedChanges(dirty);
  const reset = () => { setEditingId(null); setValues(blank); setOriginal(blank); };

  function edit(item) {
    if (busy || saving || (dirty && !confirm('Discard your unsaved changes?'))) return;
    setEditingId(item.id);
    setValues(Object.fromEntries(def.fields.map((f) => [f.key, item[f.key] ?? ''])));
    setOriginal(Object.fromEntries(def.fields.map((f) => [f.key, item[f.key] ?? ''])));
    setNotice(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function run(action, success, onSaved) {
    if (pending.current || busy) return false;
    pending.current = true;
    setSaving(true);
    try {
      await action();
      onSaved?.();
      try {
        await reload();
        setNotice({ text: success });
      } catch {
        setNotice({ error: true, text: `${success} The list could not refresh. Use Refresh list to see the latest content.` });
      }
      return true;
    } catch (err) {
      setNotice({ error: true, text: err.message });
      return false;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (saving || busy) return;
    const { error } = validate(def.fields, values);
    if (error) return setNotice({ error: true, text: error });
    await run(
      () => (editingId ? api('PUT', `/api/admin/collections/${name}/${editingId}`, { ...values, previous: original }) : api('POST', `/api/admin/collections/${name}`, values)),
      editingId ? 'Changes saved.' : 'Added.', reset
    );
  }

  async function remove(item) {
    if (!confirm(`Delete "${summary(def, item).title}"? This cannot be undone.`)) return;
    await run(() => api('DELETE', `/api/admin/collections/${name}/${item.id}`), 'Deleted.', () => { if (editingId === item.id) reset(); });
  }

  const move = (item, direction) => run(() => api('POST', `/api/admin/collections/${name}/${item.id}/move`, { direction }), 'Order updated.');

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form ref={formRef} onSubmit={save} className="h-fit scroll-mt-24 space-y-5 rounded-xl border border-line bg-paper/50 p-5 sm:p-6">
        <h2 className="font-sans text-lg font-semibold">{editingId ? 'Edit' : 'Add new'}</h2>
        <fieldset disabled={saving} className="space-y-5">
          {def.fields.map((field) => (
            <FieldRow key={field.key} field={field} value={values[field.key]} onBusy={onBusy}
              onChange={(v) => setValues((s) => ({ ...s, [field.key]: v }))} />
          ))}
        </fieldset>
        <Notice notice={notice} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy || saving || (editingId && !dirty)}>{saving ? 'Saving…' : busy ? 'Waiting for photo…' : editingId ? 'Save changes' : 'Add'}</Button>
          {editingId && <Button type="button" variant="outline" disabled={saving || busy} onClick={() => { if (!dirty || confirm('Discard your unsaved changes?')) reset(); }}>Cancel</Button>}
        </div>
      </form>

      <div>
        <h2 className="mb-3 font-sans text-lg font-semibold">All {def.label.toLowerCase()} ({items.length})</h2>
        <button type="button" disabled={saving || busy} className={`${rowButton} mb-4`} onClick={() => reload().then(() => setNotice(null)).catch((err) => setNotice({ error: true, text: err.message }))}>Refresh list</button>
        {def.sortBy && <p className="mb-3 text-sm text-muted">Sorted by date automatically.</p>}
        {!items.length && <p className="text-muted">Nothing here yet. Add the first one with the form.</p>}
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item, i) => {
            const { title, subtitle } = summary(def, item);
            return (
              <li key={item.id} className={`flex flex-wrap items-center gap-3 py-3 ${editingId === item.id ? 'bg-accent/10' : ''}`}>
                {def.thumb && (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-paper">
                    {item[def.thumb] && <img src={item[def.thumb]} alt="" className="h-full w-full object-cover" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{title}</p>
                  {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
                </div>
                <fieldset disabled={saving || busy} className="flex flex-wrap gap-1.5">
                  {!def.sortBy && (
                    <>
                      <button type="button" className={rowButton} disabled={saving || busy || i === 0} onClick={() => move(item, 'up')} aria-label={`Move ${title} up`}>↑</button>
                      <button type="button" className={rowButton} disabled={saving || busy || i === items.length - 1} onClick={() => move(item, 'down')} aria-label={`Move ${title} down`}>↓</button>
                    </>
                  )}
                  <button type="button" className={rowButton} onClick={() => edit(item)}>Edit</button>
                  <button type="button" className={`${rowButton} text-danger`} onClick={() => remove(item)}>Delete</button>
                </fieldset>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function SignupsPanel() {
  const api = useAdminApi();
  const [rows, setRows] = useState(null);
  const [notice, setNotice] = useNotice();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/admin/signups')); }
    catch (err) { setNotice({ error: true, text: err.message }); }
    finally { setLoading(false); }
  }, [api, setNotice]);
  useEffect(() => { load(); }, [load]);

  async function remove(row) {
    if (deleting) return;
    if (!confirm(`Delete the sign-up from ${row.name}?`)) return;
    setDeleting(row.id);
    try {
      await api('DELETE', `/api/admin/signups/${row.id}`);
      setRows((rows) => rows.filter((item) => item.id !== row.id));
      setNotice({ text: 'Deleted.' });
    } catch (err) {
      setNotice({ error: true, text: err.message });
    } finally {
      setDeleting(null);
    }
  }

  if (!rows) return (
    <div className="space-y-4">
      {loading && <p role="status" className="text-sm text-muted">Loading sign-ups…</p>}
      <Notice notice={notice} />
      {!loading && <Button type="button" variant="outline" onClick={load}>Try again</Button>}
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">{rows.length} {rows.length === 1 ? 'person has' : 'people have'} used the join form.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={loading || !!deleting} className={rowButton} onClick={load}>{loading ? 'Refreshing…' : 'Refresh'}</button>
          {rows.length > 0 && <a href="/api/admin/signups.csv" className="rounded-full border border-ink/25 px-5 py-2 text-sm font-semibold hover:border-ink">Download for Excel (CSV)</a>}
        </div>
      </div>
      <Notice notice={notice} />
      <div className="space-y-4 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="space-y-3 rounded-xl border border-line bg-paper/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl">{row.name}</h2>
              <time className="shrink-0 text-xs text-muted" dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString()}</time>
            </div>
            <a href={`mailto:${row.email}`} className="block text-highlight underline">{row.email}</a>
            {row.phone && <a href={`tel:${row.phone.replace(/\s/g, '')}`} className="block">{row.phone}</a>}
            {row.genre && <p className="text-sm text-muted">{row.genre}</p>}
            {row.message && <p className="whitespace-pre-line text-sm">{row.message}</p>}
            <button type="button" disabled={!!deleting} className={`${rowButton} text-danger`} onClick={() => remove(row)}>{deleting === row.id ? 'Deleting…' : 'Delete'}</button>
          </article>
        ))}
        {!rows.length && <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">No sign-ups yet.</p>}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-line md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
            <tr>{['Date', 'Name', 'Email', 'Phone', 'Genre', 'Message', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3">{new Date(row.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-semibold">{row.name}</td>
                <td className="px-4 py-3"><a href={`mailto:${row.email}`} className="text-highlight underline">{row.email}</a></td>
                <td className="whitespace-nowrap px-4 py-3">{row.phone}</td>
                <td className="px-4 py-3">{row.genre}</td>
                <td className="max-w-xs whitespace-pre-line px-4 py-3">{row.message}</td>
                <td className="px-4 py-3"><button type="button" disabled={!!deleting} className={`${rowButton} text-danger`} onClick={() => remove(row)}>{deleting === row.id ? 'Deleting…' : 'Delete'}</button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No sign-ups yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
