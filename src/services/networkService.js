import { routesService, segmentsService } from './routesService.js';
import { reportsService, votesService } from './reportsService.js';

/**
 * Carrega a "rede" necessária para avaliar rotas: trechos, relatos e votos.
 * As chamadas são encadeadas porque cada etapa depende dos ids da anterior.
 */
export async function loadNetwork(routes) {
  const segments = await segmentsService.listByRoutes(routes.map((r) => r.id));
  const reports = await reportsService.listBySegments(segments.map((s) => s.id));
  const votes = await votesService.listByReports(reports.map((r) => r.id));
  return { routes, segments, reports, votes };
}

export const networkService = {
  async loadBetween(originId, destinationId) {
    const routes = await routesService.listBetween(originId, destinationId);
    return loadNetwork(routes);
  },

  async loadRoute(routeId) {
    const route = await routesService.getById(routeId);
    return loadNetwork([{ ...route, reversed: false }]);
  },

  /** Todos os trechos (para localizar o trecho mais próximo de um ponto no mapa). */
  async loadAllSegments() {
    const segments = await segmentsService.listAll();
    const reports = await reportsService.listBySegments(segments.map((s) => s.id));
    const votes = await votesService.listByReports(reports.map((r) => r.id));
    return { segments, reports, votes };
  },
};
