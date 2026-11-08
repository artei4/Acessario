/**
 * Projeção plana para a área de Botafogo/Copacabana. 1 unidade do SVG ≈ 4 metros.
 * Suficiente para um mapa esquemático; trocar por Leaflet/MapLibre não muda o resto do app.
 */
const WEST = -43.19;
const NORTH = -22.954;
const UNITS_PER_DEG_LON = 25625; // 102.5 km/° de longitude nesta latitude ÷ 4 m
const UNITS_PER_DEG_LAT = 27830; // 111.3 km/° de latitude ÷ 4 m

export function project([lat, lon]) {
  return [(lon - WEST) * UNITS_PER_DEG_LON, (NORTH - lat) * UNITS_PER_DEG_LAT];
}

export function unproject([x, y]) {
  return [NORTH - y / UNITS_PER_DEG_LAT, WEST + x / UNITS_PER_DEG_LON];
}

/** viewBox que enquadra os pontos com margem, respeitando a proporção desejada. */
export function fitViewBox(points, { aspect = 1.6, padding = 28, minSize = 120 } = {}) {
  const projected = points.map(project);
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  let minX = Math.min(...xs) - padding;
  let maxX = Math.max(...xs) + padding;
  let minY = Math.min(...ys) - padding;
  let maxY = Math.max(...ys) + padding;

  let width = Math.max(maxX - minX, minSize);
  let height = Math.max(maxY - minY, minSize / aspect);
  if (width / height > aspect) height = width / aspect;
  else width = height * aspect;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { x: cx - width / 2, y: cy - height / 2, width, height };
}

export const toPoints = (path) => path.map(project).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
