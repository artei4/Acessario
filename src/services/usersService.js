import { api } from '../api/client.js';

/** Compara nomes sem diferenciar maiúsculas, acentos e espaços extras. */
export function normalizeName(name) {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export const DEFAULT_PREFERENCES = { avoidStairs: true, preferFlat: false, includeSupportPoints: true, avoidUnsafe: false };

/** Leitura e edição da própria conta (criar conta é pelo authService). */
export const usersService = {
  getById: (id) => api.get(`/users/${encodeURIComponent(id)}`),
  update: (id, changes) => api.patch(`/users/${encodeURIComponent(id)}`, changes),
};
