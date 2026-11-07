const env = import.meta.env ?? {};

export const config = {
  apiUrl: (env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/+$/, ''),
  /** "http" usa a API REST; "local" roda o mesmo núcleo REST no navegador. */
  apiMode: env.VITE_API_MODE === 'local' ? 'local' : 'http',
  /** Usuário da demonstração (não há autenticação no protótipo). */
  currentUserId: env.VITE_USER_ID ?? 'u-jose',
  /** API pública de geocodificação (OpenStreetMap). */
  geocodingUrl: 'https://nominatim.openstreetmap.org',
};
