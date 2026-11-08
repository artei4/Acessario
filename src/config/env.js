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
  /**
   * Mapa: "osm" (padrão) usa o OpenStreetMap com Leaflet, sem chave e sem custo;
   * "schematic" usa o mapa esquemático em SVG, que funciona sem internet.
   */
  mapProvider: env.VITE_MAP_PROVIDER === 'schematic' ? 'schematic' : 'osm',
};
