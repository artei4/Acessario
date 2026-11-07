import { api } from '../api/client.js';

export const placesService = {
  list: () => api.get('/places', { _sort: 'name' }),
  getById: (id) => api.get(`/places/${encodeURIComponent(id)}`),
};
