import { config } from '../config/env.js';
import { ApiError } from '../api/ApiError.js';

/** Área de busca: Botafogo e Copacabana (lon/lat do canto superior esquerdo e inferior direito). */
const VIEWBOX = '-43.200,-22.945,-43.165,-22.975';

/**
 * Geocodificação de endereços com a API pública Nominatim (OpenStreetMap).
 * Política de uso: no máximo 1 requisição por segundo, por isso a busca só
 * acontece quando a pessoa pede, nunca a cada tecla.
 */
export const geocodingService = {
  async search(address) {
    const params = new URLSearchParams({
      q: `${address}, Rio de Janeiro`,
      format: 'jsonv2',
      limit: '5',
      countrycodes: 'br',
      viewbox: VIEWBOX,
      bounded: '1',
      'accept-language': 'pt-BR',
    });
    let response;
    try {
      response = await fetch(`${config.geocodingUrl}/search?${params}`);
    } catch (cause) {
      throw new ApiError('Serviço de endereços indisponível', { status: 0, cause });
    }
    if (!response.ok) throw new ApiError('Serviço de endereços indisponível', { status: response.status });
    const results = await response.json();
    return results.map((item) => ({
      label: item.display_name.split(',').slice(0, 3).join(','),
      lat: Number(item.lat),
      lon: Number(item.lon),
    }));
  },
};
