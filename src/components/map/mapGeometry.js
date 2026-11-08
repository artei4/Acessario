/** Utilitários de geometria do mapa. O app usa [lat, lon], que o Leaflet aceita direto. */

/** Converte um L.LatLng ({ lat, lng }) para o formato do app. */
export const fromLatLng = (latLng) => [latLng.lat, latLng.lng];

/** Todos os pontos que o mapa deve enquadrar: o foco, se houver, ou rotas + marcadores. */
export function framePoints({ focus, routes = [], markers = [] }) {
  if (focus?.length) return focus;
  return [...routes.flatMap((r) => r.segments.flatMap((s) => s.path)), ...markers.map((m) => m.point)];
}

/** Chave estável para só reenquadrar o mapa quando os pontos realmente mudam. */
export function pointsKey(points) {
  return points.map(([lat, lon]) => `${lat.toFixed(5)},${lon.toFixed(5)}`).join('|');
}

/** Ponto do meio de um caminho, usado para posicionar o número da rota. */
export function labelPoint(segments) {
  const middle = segments[Math.floor(segments.length / 2)];
  return middle ? middle.path[0] : null;
}
