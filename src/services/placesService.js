import { api } from '../api/client.js';

export const placesService = {
  list: () => api.get('/places', { _sort: 'name' }),
  getById: (id) => api.get(`/places/${encodeURIComponent(id)}`),

  /**
   * Garante que um lugar exista na API e devolve o lugar salvo.
   * Lugares que vieram da busca de endereços (sem id) são reaproveitados pelo osmId.
   */
  async ensure(place) {
    if (place.id) return place;
    if (place.osmId) {
      const [existing] = await api.get('/places', { osmId: place.osmId });
      if (existing) return existing;
    }
    const { name, neighborhood, lat, lon, osmId } = place;
    return api.post('/places', { name, neighborhood, lat, lon, osmId, createdAt: new Date().toISOString() });
  },
};
