import { useCallback, useSyncExternalStore } from 'react';

/**
 * Roteamento por hash (#/rotas?de=a&para=b), sem dependências externas.
 * Funciona em qualquer hospedagem estática, sem configurar o servidor.
 */

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

const getHash = () => window.location.hash || '#/';

export function parseHash(hash) {
  const [rawPath, search = ''] = hash.replace(/^#/, '').split('?');
  const path = `/${rawPath.replace(/^\/+|\/+$/g, '')}`;
  return { path, query: Object.fromEntries(new URLSearchParams(search)) };
}

/** Compara "/rotas/:routeId" com "/rotas/r1" e devolve { routeId: 'r1' } ou null. */
export function matchPath(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i];
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(pathParts[i]);
    else if (part !== pathParts[i]) return null;
  }
  return params;
}

export function buildPath(path, query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && params.set(k, v));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function useHashRouter() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '#/');
  const { path, query } = parseHash(hash);

  const navigate = useCallback((to, query, { replace = false } = {}) => {
    const target = `#${buildPath(to, query)}`;
    if (replace) window.location.replace(target);
    else window.location.hash = target;
    window.scrollTo?.(0, 0);
  }, []);

  const back = useCallback((fallback = '/') => {
    if (window.history.length > 1) window.history.back();
    else navigate(fallback);
  }, [navigate]);

  return { path, query, navigate, back };
}
