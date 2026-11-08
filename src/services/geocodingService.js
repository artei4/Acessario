import { config } from '../config/env.js';
import { ApiError } from '../api/ApiError.js';

/** Área de busca: município do Rio de Janeiro (lon/lat do canto noroeste e sudeste). */
const RIO_VIEWBOX = '-43.80,-22.74,-43.09,-23.09';

function neighborhoodOf(address = {}) {
  return address.suburb || address.neighbourhood || address.city_district || address.quarter || address.city || 'Rio de Janeiro';
}

/**
 * Busca de lugares e endereços com a API pública Nominatim (OpenStreetMap).
 * Política de uso: no máximo 1 requisição por segundo e nada de autocompletar,
 * por isso a busca só acontece quando a pessoa pede.
 */
export const geocodingService = {
  /** @returns {Promise<{name, neighborhood, label, lat, lon, osmId}[]>} */
  async search(text) {
    const params = new URLSearchParams({
      q: text,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '6',
      countrycodes: 'br',
      viewbox: RIO_VIEWBOX,
      bounded: '1',
      'accept-language': 'pt-BR',
    });
    let response;
    try {
      response = await fetch(`${config.geocodingUrl}/search?${params}`);
    } catch (cause) {
      throw new ApiError('Serviço de endereços indisponível', { status: 0, cause, userMessage: 'A busca de endereços está indisponível. Tente de novo em instantes.' });
    }
    if (!response.ok) throw new ApiError('Serviço de endereços indisponível', { status: response.status, userMessage: 'A busca de endereços está indisponível. Tente de novo em instantes.' });
    const results = await response.json();
    return results.map((item) => {
      const name = item.name || item.display_name.split(',')[0];
      return {
        name,
        neighborhood: neighborhoodOf(item.address),
        label: item.display_name.split(',').slice(0, 3).join(','),
        lat: Number(item.lat),
        lon: Number(item.lon),
        osmId: `${item.osm_type}/${item.osm_id}`,
      };
    });
  },
};
