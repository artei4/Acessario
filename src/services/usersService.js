import { api } from '../api/client.js';

export const usersService = {
  getById: (id) => api.get(`/users/${encodeURIComponent(id)}`),
  update: (id, changes) => api.patch(`/users/${encodeURIComponent(id)}`, changes),
};
