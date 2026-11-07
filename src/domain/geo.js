/** Geometria simples para distâncias curtas dentro da cidade (aproximação equiretangular). */

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Converte [lat, lon] para metros num plano local centrado em `origin`. */
function toLocal([lat, lon], [lat0, lon0]) {
  return {
    x: toRad(lon - lon0) * Math.cos(toRad(lat0)) * EARTH_RADIUS_M,
    y: toRad(lat - lat0) * EARTH_RADIUS_M,
  };
}

export function distanceM(a, b) {
  const { x, y } = toLocal(b, a);
  return Math.hypot(x, y);
}

/** Distância de um ponto até um segmento de reta AB, em metros. */
function distanceToLine(point, a, b) {
  const p = toLocal(point, a);
  const q = toLocal(b, a);
  const lengthSq = q.x * q.x + q.y * q.y;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (p.x * q.x + p.y * q.y) / lengthSq));
  return Math.hypot(p.x - t * q.x, p.y - t * q.y);
}

export function distanceToPath(point, path) {
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i += 1) best = Math.min(best, distanceToLine(point, path[i], path[i + 1]));
  return best;
}

/**
 * Trecho mais próximo de um ponto. Devolve null se nenhum estiver a menos de `maxDistanceM`.
 * @param {[number, number]} point  [lat, lon]
 */
export function nearestSegment(point, segments, maxDistanceM = 150) {
  let nearest = null;
  for (const segment of segments) {
    const d = distanceToPath(point, segment.path);
    if (d <= maxDistanceM && (!nearest || d < nearest.distanceM)) nearest = { segment, distanceM: d };
  }
  return nearest;
}

/** Ponto do meio de um caminho (usado como posição padrão de um relato). */
export function pathMidpoint(path) {
  if (path.length === 1) return path[0];
  const mid = Math.floor((path.length - 1) / 2);
  const [a, b] = [path[mid], path[mid + 1]];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
