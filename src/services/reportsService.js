import { api } from '../api/client.js';

export const reportsService = {
  listBySegments: (segmentIds) =>
    segmentIds.length === 0 ? Promise.resolve([]) : api.get('/reports', { segmentId: segmentIds }),
  listByUser: (userId) => api.get('/reports', { userId, _sort: 'createdAt', _order: 'desc' }),
  getById: (id) => api.get(`/reports/${encodeURIComponent(id)}`),
  create: (report) => api.post('/reports', { ...report, createdAt: report.createdAt ?? new Date().toISOString() }),
  update: (id, changes) => api.patch(`/reports/${encodeURIComponent(id)}`, { ...changes, updatedAt: new Date().toISOString() }),
  remove: (id) => api.delete(`/reports/${encodeURIComponent(id)}`),
};

export const votesService = {
  listByReports: (reportIds) =>
    reportIds.length === 0 ? Promise.resolve([]) : api.get('/votes', { reportId: reportIds }),

  /** Um voto por pessoa por relato: atualiza o voto existente ou cria um novo. */
  async cast({ reportId, userId, type }) {
    const [existing] = await api.get('/votes', { reportId, userId });
    const createdAt = new Date().toISOString();
    if (existing) return api.patch(`/votes/${existing.id}`, { type, createdAt });
    return api.post('/votes', { reportId, userId, type, createdAt });
  },

  remove: (id) => api.delete(`/votes/${encodeURIComponent(id)}`),
};
