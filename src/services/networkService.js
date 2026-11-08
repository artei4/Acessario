import { routesService, saveRoutePlan, segmentsService } from './routesService.js';
import { placesService } from './placesService.js';
import { routingService } from './routingService.js';
import { planFromOsrm } from '../domain/routePlanning.js';
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

/** Cálculos em andamento por par de lugares: pedidos simultâneos reaproveitam o mesmo (evita rotas duplicadas). */
const planning = new Map();

async function planAndSave(originId, destinationId) {
  const [origin, destination] = await Promise.all([placesService.getById(originId), placesService.getById(destinationId)]);
  const osrm = await routingService.walkingRoutes(origin, destination);
  const saved = [];
  for (const routePlan of planFromOsrm(osrm, { originId, destinationId })) saved.push(await saveRoutePlan(routePlan));
  return saved.map((s) => ({ ...s.route, reversed: false }));
}

function planOnce(originId, destinationId) {
  const key = [originId, destinationId].sort().join('|');
  if (!planning.has(key)) {
    planning.set(key, planAndSave(originId, destinationId).finally(() => planning.delete(key)));
  }
  return planning.get(key);
}

export const networkService = {
  /**
   * Rotas entre dois lugares. Com `plan: true`, se ainda não houver rota salva,
   * calcula rotas a pé no roteador do OpenStreetMap e grava rotas e trechos na API
   * (assim as pessoas podem relatar e confirmar problemas nelas).
   */
  async loadBetween(originId, destinationId, { plan = false } = {}) {
    let routes = await routesService.listBetween(originId, destinationId);
    if (routes.length === 0 && plan) {
      const planned = await planOnce(originId, destinationId);
      // se o cálculo foi no sentido contrário, as rotas valem invertidas
      routes = planned.map((r) => ({ ...r, reversed: r.originId !== originId }));
    }
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
