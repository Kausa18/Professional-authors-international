import { useState } from 'react';
import { formatLayout, parseLayout } from '../../../../shared/content.js';
import { useAdminApi } from './session.jsx';

export const inputClass = 'w-full rounded-md border border-line bg-paper px-3 py-2 text-ink focus:border-accent focus:outline-none';
const smallButton = 'inline-flex min-h-11 items-center justify-center rounded-md border border-line px-3 py-1.5 text-sm hover:border-ink disabled:opacity-40';

// Resize a photo in the browser before upload: smaller files, faster pages.
// PNGs stay PNG so transparent logos keep their transparency.
async function shrink(file, max = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  const mime = ['image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.86));
  if (!blob) throw new Error('That photo could not be read. Please try another one.');
  return blob;
}

function ImageInput({ value, onChange, onBusy, label }) {
  const api = useAdminApi();
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  async function choose(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
      setStatus('Choose a JPG, PNG, or WebP smaller than 20 MB.');
      return;
    }
    setUploading(true);
    setStatus('Uploading…');
    onBusy(1);
    try {
      const { url } = await api('POST', '/api/admin/images', await shrink(file));
      onChange(url);
      setStatus('');
    } catch (err) {
      setStatus(err.message);
    } finally {
      onBusy(-1);
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4" role="group" aria-label={label} aria-busy={uploading}>
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-paper">
        {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-muted">No photo</span>}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <label className={`${smallButton} cursor-pointer`}>
            {value ? 'Change photo' : 'Choose photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={choose} aria-label={label} />
          </label>
          {value && <button type="button" disabled={uploading} className={smallButton} onClick={() => onChange('')}>Remove</button>}
        </div>
        {status && <p className="text-sm text-muted" role="status">{status}</p>}
      </div>
    </div>
  );
}

function LayoutInput({ name, value, onChange }) {
  const sections = parseLayout(name, value);
  const update = (next) => onChange(formatLayout(next));
  const move = (i, step) => {
    const next = [...sections];
    [next[i], next[i + step]] = [next[i + step], next[i]];
    update(next);
  };
  return (
    <ol className="divide-y divide-line rounded-md border border-line bg-paper">
      {sections.map((s, i) => (
        <li key={s.key} className="flex items-center gap-3 px-3 py-2">
          <input type="checkbox" checked={s.visible} id={`${name}-${s.key}`} className="h-4 w-4 accent-[var(--highlight)]"
            onChange={(e) => update(sections.map((x) => (x.key === s.key ? { ...x, visible: e.target.checked } : x)))} />
          <label htmlFor={`${name}-${s.key}`} className={`flex-1 ${s.visible ? '' : 'text-muted line-through'}`}>{s.label}</label>
          <button type="button" className={smallButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${s.label} up`}>↑</button>
          <button type="button" className={smallButton} disabled={i === sections.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${s.label} down`}>↓</button>
        </li>
      ))}
    </ol>
  );
}

function Input({ field, value, onChange, onBusy }) {
  const id = `field-${field.key}`;
  switch (field.type) {
    case 'textarea':
      return <textarea id={id} required={field.required} rows={field.max > 1500 ? 10 : 4} maxLength={field.max} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    case 'image':
      return <ImageInput value={value} onChange={onChange} onBusy={onBusy} label={field.label} />;
    case 'layout':
      return <LayoutInput name={field.key} value={value} onChange={onChange} />;
    case 'color':
      return (
        <div className="flex items-center gap-3">
          <input id={id} type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-16 cursor-pointer rounded border border-line bg-paper" />
          <input value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} max-w-32 font-mono`} aria-label={`${field.label} code`} />
        </div>
      );
    case 'select':
      return (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'toggle':
      return <input id={id} type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} className="h-5 w-5 accent-[var(--highlight)]" />;
    default: {
      const type = { date: 'date', time: 'time', url: 'url', email: 'email', number: 'number' }[field.type] || 'text';
      return <input id={id} type={type} required={field.required} min={field.min} max={field.type === 'number' ? field.max : undefined} maxLength={field.type === 'number' ? undefined : field.max}
        value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    }
  }
}

export function FieldRow({ field, value, onChange, onBusy }) {
  const inline = field.type === 'toggle';
  const Label = field.type === 'image' || field.type === 'layout' ? 'p' : 'label';
  return (
    <div className={inline ? 'flex flex-row-reverse items-center justify-end gap-3' : 'space-y-1.5'}>
      <Label htmlFor={Label === 'label' ? `field-${field.key}` : undefined} className="block text-sm font-semibold">
        {field.label}{field.required && <span aria-hidden="true" className="text-danger"> *</span>}
      </Label>
      <Input field={field} value={value ?? ''} onChange={onChange} onBusy={onBusy} />
      {field.help && !inline && <p className="text-xs text-muted">{field.help}</p>}
    </div>
  );
}
