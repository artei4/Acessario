import { config } from '../config/env.js';
import { ApiError } from '../api/ApiError.js';

/**
 * Cálculo de rotas a pé com o OSRM, o roteador do ecossistema OpenStreetMap.
 * Usa o servidor público da FOSSGIS (o mesmo do site openstreetmap.org), com perfil a pé.
 * Política de uso justo: só calcula quando a pessoa busca um trajeto novo.
 */
export const routingService = {
  /**
   * @param {{lat:number, lon:number}} origin
   * @param {{lat:number, lon:number}} destination
   * @returns resposta do OSRM com até 3 alternativas
   */
  async walkingRoutes(origin, destination) {
    const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    const params = new URLSearchParams({ alternatives: '3', steps: 'true', geometries: 'geojson', overview: 'false' });
    let response;
    try {
      response = await fetch(`${config.routingUrl}/route/v1/driving/${coords}?${params}`);
    } catch (cause) {
      throw new ApiError('Serviço de rotas indisponível', { status: 0, cause, userMessage: 'Não foi possível calcular a rota agora. Verifique a internet e tente de novo.' });
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.code !== 'Ok' || !data.routes?.length) {
      throw new ApiError('Nenhuma rota a pé encontrada', {
        status: response.ok ? 422 : response.status,
        userMessage: 'Não encontramos um caminho a pé entre esses lugares.',
      });
    }
    return data;
  },
};
