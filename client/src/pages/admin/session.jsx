import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const AdminContext = createContext(null);
const EditContext = createContext(null);

// Wraps api() so an expired login sends the admin back to the login form.
export function AdminSession({ onExpired, children }) {
  const [dirty, setDirty] = useState(false);
  const adminApi = useCallback(async (...args) => {
    try {
      return await api(...args);
    } catch (err) {
      if (err.status === 401) onExpired();
      throw err;
    }
  }, [onExpired]);
  return <AdminContext value={adminApi}><EditContext value={{ dirty, setDirty }}>{children}</EditContext></AdminContext>;
}

export const useAdminApi = () => useContext(AdminContext);
export const useEditGuard = () => useContext(EditContext);

export function useUnsavedChanges(dirty) {
  const { setDirty } = useEditGuard();
  useEffect(() => {
    setDirty(dirty);
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    if (dirty) window.addEventListener('beforeunload', warn);
    return () => { setDirty(false); window.removeEventListener('beforeunload', warn); };
  }, [dirty, setDirty]);
}

// A short message that clears itself.
export function useNotice() {
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!notice || notice.error) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);
  return [notice, setNotice];
}

export function Notice({ notice }) {
  if (!notice) return null;
  return (
    <p role={notice.error ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm ${notice.error ? 'border-danger/20 bg-danger/10 text-danger' : 'border-highlight/20 bg-highlight/10 text-highlight'}`}>
      {notice.text}
    </p>
  );
}
