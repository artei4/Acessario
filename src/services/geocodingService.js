import { config } from '../config/env.js';
import { ApiError } from '../api/ApiError.js';

/** Município do Rio de Janeiro: minLon, minLat, maxLon, maxLat. */
const RIO_BBOX = '-43.80,-23.09,-43.09,-22.74';
/** Centro aproximado da cidade, para priorizar resultados próximos. */
const RIO_CENTER = { lat: -22.95, lon: -43.35 };
const OSM_TYPES = { N: 'node', W: 'way', R: 'relation' };

const UNAVAILABLE = 'A busca de lugares está indisponível. Tente de novo em instantes.';

/** Nome amigável: o nome do lugar ou, para endereços sem nome, "Rua, número". */
export function placeName(p) {
  if (p.name) return p.name;
  const street = [p.street, p.housenumber].filter(Boolean).join(', ');
  return street || p.district || p.city || 'Local sem nome';
}

/** Converte uma feature GeoJSON do Photon no formato de lugar do app. */
export function fromPhotonFeature(feature) {
  const p = feature.properties ?? {};
  const [lon, lat] = feature.geometry.coordinates;
  const name = placeName(p);
  const street = [p.street, p.housenumber].filter(Boolean).join(', ');
  const neighborhood = p.district || p.locality || p.city || 'Rio de Janeiro';
  const details = [street && street !== name ? street : null, neighborhood].filter(Boolean);
  return {
    name,
    neighborhood,
    label: details.join(' · '),
    lat,
    lon,
    osmId: `${OSM_TYPES[p.osm_type] ?? 'node'}/${p.osm_id}`,
  };
}

/**
 * Busca de lugares e endereços no Rio com o Photon (photon.komoot.io), geocodificador
 * baseado no OpenStreetMap e feito para sugerir enquanto se digita.
 * Uso justo: o app espera a pessoa parar de digitar, cancela buscas antigas e guarda em cache.
 */
export const geocodingService = {
  /** @returns {Promise<{name, neighborhood, label, lat, lon, osmId}[]>} */
  async search(text, { signal } = {}) {
    const params = new URLSearchParams({
      q: text,
      limit: '7',
      bbox: RIO_BBOX,
      lat: String(RIO_CENTER.lat),
      lon: String(RIO_CENTER.lon),
    });
    let response;
    try {
      response = await fetch(`${config.geocodingUrl}/api/?${params}`, { signal });
    } catch (cause) {
      if (cause.name === 'AbortError') throw cause; // busca cancelada: a pessoa continuou digitando
      throw new ApiError('Serviço de busca indisponível', { status: 0, cause, userMessage: UNAVAILABLE });
    }
    if (!response.ok) throw new ApiError('Serviço de busca indisponível', { status: response.status, userMessage: UNAVAILABLE });
    const data = await response.json();
    const places = (data.features ?? []).map(fromPhotonFeature);
    // o Photon pode devolver o mesmo lugar duas vezes (ex.: prédio e ponto de interesse)
    const seen = new Set();
    return places.filter((p) => {
      const key = `${p.name}|${p.lat.toFixed(4)}|${p.lon.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
};
