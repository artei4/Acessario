import { api } from '../api/client.js';

export const routesService = {
  getById: (id) => api.get(`/routes/${encodeURIComponent(id)}`),

  /**
   * Rotas cadastradas entre dois lugares, nos dois sentidos.
   * Cada rota volta marcada com `reversed` quando foi cadastrada no sentido contrário.
   */
  async listBetween(originId, destinationId) {
    const [forward, backward] = await Promise.all([
      api.get('/routes', { originId, destinationId }),
      api.get('/routes', { originId: destinationId, destinationId: originId }),
    ]);
    return [
      ...forward.map((route) => ({ ...route, reversed: false })),
      ...backward.map((route) => ({ ...route, reversed: true })),
    ];
  },
};

/** Grava uma rota planejada e seus trechos. */
export async function saveRoutePlan({ route, segments }) {
  const created = await api.post('/routes', { ...route, createdAt: new Date().toISOString() });
  const savedSegments = [];
  // um por vez, para manter a ordem e não sobrecarregar a API
  for (const segment of segments) {
    savedSegments.push(await api.post('/segments', { ...segment, routeId: created.id }));
  }
  return { route: created, segments: savedSegments };
}

export const segmentsService = {
  listByRoutes: (routeIds) =>
    routeIds.length === 0 ? Promise.resolve([]) : api.get('/segments', { routeId: routeIds, _sort: 'order' }),
  listAll: () => api.get('/segments'),
};
