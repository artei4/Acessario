const env = import.meta.env ?? {};

export const config = {
  /** Em desenvolvimento, o servidor local; publicado na Vercel, a função em /api do mesmo site. */
  apiUrl: (env.VITE_API_URL || (env.DEV === false || env.PROD ? '/api' : 'http://localhost:3001')).replace(/\/+$/, ''),
  /**
   * "http" (padrão) usa a API REST de server/ (npm start).
   * "local" roda o mesmo núcleo REST no navegador, com localStorage (npm run dev:demo).
   */
  apiMode: env.VITE_API_MODE === 'local' ? 'local' : 'http',
  /** Usuário da demonstração (não há autenticação no protótipo). */
  currentUserId: env.VITE_USER_ID ?? 'u-jose',
  /** API pública de geocodificação (OpenStreetMap). */
  geocodingUrl: 'https://nominatim.openstreetmap.org',
  /** Google Maps JavaScript API. Sem chave, o app usa o mapa esquemático. */
  googleMaps: {
    apiKey: env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    mapId: env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
  },
};
