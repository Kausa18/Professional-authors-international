import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const AdminContext = createContext(null);

// Wraps api() so an expired login sends the admin back to the login form.
export function AdminSession({ onExpired, children }) {
  const adminApi = useCallback(async (...args) => {
    try {
      return await api(...args);
    } catch (err) {
      if (err.status === 401) onExpired();
      throw err;
    }
  }, [onExpired]);
  return <AdminContext value={adminApi}>{children}</AdminContext>;
}

export const useAdminApi = () => useContext(AdminContext);

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
    <p role="status" className={`rounded-md px-4 py-3 text-sm ${notice.error ? 'bg-danger/10 text-danger' : 'bg-highlight/10 text-highlight'}`}>
      {notice.text}
    </p>
  );
}
