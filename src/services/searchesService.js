import { api } from '../api/client.js';

export const searchesService = {
  listByUser: (userId, limit = 5) =>
    api.get('/searches', { userId, _sort: 'createdAt', _order: 'desc', _limit: limit }),

  /** Registra a busca, removendo a repetição do mesmo trajeto para manter a lista limpa. */
  async record({ userId, originId, destinationId }) {
    const duplicates = await api.get('/searches', { userId, originId, destinationId });
    await Promise.all(duplicates.map((item) => api.delete(`/searches/${item.id}`)));
    return api.post('/searches', { userId, originId, destinationId, createdAt: new Date().toISOString() });
  },

  remove: (id) => api.delete(`/searches/${encodeURIComponent(id)}`),
};
