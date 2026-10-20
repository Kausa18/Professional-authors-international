import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { themeVariables } from '../../../shared/content.js';
import { api } from './api.js';

const ContentContext = createContext(null);

// Loads all site content once and shares it with every page.
export function ContentProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', data: null });

  const reload = useCallback(async () => {
    try {
      const data = await api('GET', '/api/content');
      setState({ status: 'ready', data });
      return data;
    } catch (error) {
      setState((s) => (s.data ? s : { status: 'error', data: null }));
      throw error;
    }
  }, []);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: s.data ? 'ready' : 'loading' }));
    return reload().catch(() => {});
  }, [reload]);

  const updateSettings = useCallback((settings) => {
    setState((s) => ({ ...s, data: { ...s.data, settings } }));
  }, []);

  useEffect(() => { reload().catch(() => {}); }, [reload]);

  // Keep colours in step when they are changed from the Admin page.
  useEffect(() => {
    if (!state.data) return;
    for (const [name, value] of Object.entries(themeVariables(state.data.settings))) {
      document.documentElement.style.setProperty(name, value);
    }
  }, [state.data]);

  return <ContentContext value={{ ...state, reload, retry, updateSettings }}>{children}</ContentContext>;
}

export const useContent = () => useContext(ContentContext);
export const useSettings = () => useContent().data?.settings ?? {};

export function usePageTitle(title) {
  const { siteName } = useSettings();
  useEffect(() => {
    if (siteName) document.title = title ? `${title} | ${siteName}` : siteName;
  }, [title, siteName]);
}

// Today's date as YYYY-MM-DD in the visitor's time zone.
export function today() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
