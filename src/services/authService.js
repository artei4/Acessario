import { api } from '../api/client.js';

/** Contas: cadastro, entrada e definição de senha de contas antigas. Devolvem { user, token }. */
export const authService = {
  register: (name, password) => api.post('/auth/register', { name, password }),
  login: (name, password) => api.post('/auth/login', { name, password }),
  /** Define a senha de uma conta criada antes das senhas existirem. */
  claim: (name, password) => api.post('/auth/claim', { name, password }),
  /** Confere o token salvo e devolve a conta dele. */
  me: () => api.get('/auth/me'),
};
