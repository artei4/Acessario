const env = import.meta.env ?? {};

export const config = {
  apiUrl: (env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/+$/, ''),
  /**
   * "local" (padrão) roda o núcleo REST dentro do navegador, salvando em localStorage:
   * o app funciona sem servidor. "http" usa a API REST de server/ (npm run dev:http).
   */
  apiMode: env.VITE_API_MODE === 'http' ? 'http' : 'local',
  /** Usuário da demonstração (não há autenticação no protótipo). */
  currentUserId: env.VITE_USER_ID ?? 'u-jose',
  /** API pública de geocodificação (OpenStreetMap). */
  geocodingUrl: 'https://nominatim.openstreetmap.org',
};
