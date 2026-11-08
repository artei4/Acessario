/** Conversões entre o formato do app ([lat, lon]) e o do Google Maps ({ lat, lng }). */

export const toLatLng = ([lat, lon]) => ({ lat, lng: lon });

export const fromLatLng = (latLng) =>
  typeof latLng.lat === 'function' ? [latLng.lat(), latLng.lng()] : [latLng.lat, latLng.lng];

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
