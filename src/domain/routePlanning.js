/**
 * Converte rotas a pé calculadas pelo roteador do OpenStreetMap (OSRM) no modelo do app:
 * uma rota com vários trechos, um por rua.
 *
 * Os trechos gerados não têm levantamento de acessibilidade (largura, inclinação, escadas…):
 * esses campos ficam `null` e o trecho aparece como "não verificado" até que relatos
 * confirmados das pessoas preencham a informação.
 */

/** Trechos menores que isto são juntados ao anterior (esquinas, travessias curtas). */
export const MIN_SEGMENT_M = 40;
/** Velocidade a pé usada no tempo base (m/min). Um pouco abaixo da média, pensando em mobilidade reduzida. */
export const WALK_SPEED_M_PER_MIN = 65;

const UNNAMED = 'Trecho sem nome';

/** [lon, lat] (GeoJSON) → [lat, lon] (app), com 5 casas (~1 m). */
const toPoint = ([lon, lat]) => [Number(lat.toFixed(5)), Number(lon.toFixed(5))];

function appendPath(target, path) {
  const [first, ...rest] = path;
  const last = target.at(-1);
  if (!last || last[0] !== first[0] || last[1] !== first[1]) target.push(first);
  target.push(...rest);
}

/** Junta passos consecutivos da mesma rua e passos curtos demais. */
export function stepsToSegments(steps) {
  const segments = [];
  for (const step of steps) {
    const coordinates = step.geometry?.coordinates ?? [];
    if (step.distance <= 0 || coordinates.length < 2) continue;
    const street = step.name?.trim() || UNNAMED;
    const path = coordinates.map(toPoint);
    const previous = segments.at(-1);
    if (previous && (previous.street === street || step.distance < MIN_SEGMENT_M)) {
      previous.lengthM += step.distance;
      appendPath(previous.path, path);
      continue;
    }
    segments.push({ street, lengthM: step.distance, path });
  }
  // o primeiro trecho também pode ser curto demais: junta ao seguinte
  if (segments.length > 1 && segments[0].lengthM < MIN_SEGMENT_M) {
    const [first, second] = segments;
    second.lengthM += first.lengthM;
    second.path = [...first.path.slice(0, -1), ...second.path];
    segments.shift();
  }
  return segments;
}

function describeVia(segments) {
  const byLength = new Map();
  for (const s of segments) if (s.street !== UNNAMED) byLength.set(s.street, (byLength.get(s.street) ?? 0) + s.lengthM);
  const main = [...byLength.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
  return main.length ? main.join(' e ') : 'ruas sem nome no mapa';
}

/**
 * @param {object} osrm      resposta do OSRM (com steps=true e geometries=geojson)
 * @param {object} places    { originId, destinationId }
 * @returns {{ route: object, segments: object[] }[]}  rotas prontas para gravar (sem ids)
 */
export function planFromOsrm(osrm, { originId, destinationId }) {
  return (osrm.routes ?? []).map((osrmRoute, index) => {
    const steps = osrmRoute.legs.flatMap((leg) => leg.steps ?? []);
    const segments = stepsToSegments(steps).map((s, i) => ({
      order: i + 1,
      street: s.street,
      lengthM: Math.round(s.lengthM),
      widthM: null,
      slopePct: null,
      hasStairs: null,
      hasRamps: null,
      floor: null,
      tactile: null,
      supportPoints: [],
      surveyedAt: null,
      path: s.path,
    }));
    return {
      route: {
        name: `Rota ${index + 1}`,
        via: describeVia(segments),
        originId,
        destinationId,
        distanceKm: Math.round(osrmRoute.distance / 100) / 10,
        baseMinutes: Math.max(1, Math.round(osrmRoute.distance / WALK_SPEED_M_PER_MIN)),
        source: 'osm',
      },
      segments,
    };
  });
}
