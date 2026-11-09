import { api } from '../api/client.js';

/** Compara nomes sem diferenciar maiúsculas, acentos e espaços extras. */
export function normalizeName(name) {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export const DEFAULT_PREFERENCES = { avoidStairs: true, preferFlat: false, includeSupportPoints: true, avoidUnsafe: false };

export const usersService = {
  getById: (id) => api.get(`/users/${encodeURIComponent(id)}`),
  update: (id, changes) => api.patch(`/users/${encodeURIComponent(id)}`, changes),

  /** Conta com esse nome (sem diferenciar maiúsculas e acentos), ou null. */
  async findByName(name) {
    const wanted = normalizeName(name);
    // busca na lista inteira: o filtro de texto da API diferencia acentos ("jose" não acharia "José")
    const candidates = await api.get('/users');
    return candidates.find((u) => normalizeName(u.name) === wanted) ?? null;
  },

  /** Cria uma conta nova. O perfil de mobilidade fica em branco: a tela de boas-vindas pergunta. */
  create: (name) =>
    api.post('/users', { name: name.trim().replace(/\s+/g, ' '), profile: null, preferences: DEFAULT_PREFERENCES, createdAt: new Date().toISOString() }),
};
