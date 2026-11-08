import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

/**
 * Tema da interface: "light", "dark" ou "system" (segue o aparelho).
 * A escolha fica salva no navegador e é aplicada no atributo data-theme do <html>,
 * que o CSS usa para trocar os tokens de cor.
 */
const STORAGE_KEY = 'acessario:theme';
const ThemeContext = createContext(null);
const root = document.documentElement;
// valor que já existia no <html> (ex.: definido pela página que hospeda o app), restaurado no modo "system"
let hostTheme = root.getAttribute('data-theme');

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function subscribeSystem(callback) {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  media?.addEventListener('change', callback);
  return () => media?.removeEventListener('change', callback);
}
const systemIsDark = () => Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

// aplica a escolha salva antes da primeira renderização, evitando um "piscar" de tema
const initialTheme = readStoredTheme();
if (initialTheme !== 'system') root.setAttribute('data-theme', initialTheme);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme);
  const systemDark = useSyncExternalStore(subscribeSystem, systemIsDark, () => false);

  useEffect(() => {
    if (theme === 'system') {
      if (hostTheme) root.setAttribute('data-theme', hostTheme);
      else root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    // se a página que hospeda o app trocar o atributo, a escolha explícita da pessoa continua valendo
    const observer = new MutationObserver(() => {
      const current = root.getAttribute('data-theme');
      if (theme === 'system') hostTheme = current;
      else if (current !== theme) root.setAttribute('data-theme', theme);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      if (next === 'system') window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // sem armazenamento: a escolha vale só nesta visita
    }
  }, []);

  const resolvedTheme =
    theme !== 'system' ? theme : hostTheme === 'dark' || hostTheme === 'light' ? hostTheme : systemDark ? 'dark' : 'light';

  const toggleTheme = useCallback(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'), [resolvedTheme, setTheme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, toggleTheme }), [theme, resolvedTheme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return context;
}
