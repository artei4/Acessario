import { config } from '../config/env.js';
import { createHttpClient } from './httpClient.js';
import { createLocalClient } from './localClient.js';

/** Cliente único usado por todos os serviços. Trocar o modo não muda nada acima desta camada. */
export const apiClient =
  config.apiMode === 'local' ? createLocalClient() : createHttpClient(config.apiUrl);

export const api = {
  get: (path, query, options) => apiClient.request('GET', path, { query, ...options }),
  post: (path, body) => apiClient.request('POST', path, { body }),
  put: (path, body) => apiClient.request('PUT', path, { body }),
  patch: (path, body) => apiClient.request('PATCH', path, { body }),
  delete: (path) => apiClient.request('DELETE', path),
};

/** Define o token da conta ativa (ou null para visitante). Vale para todas as requisições seguintes. */
export const setAuthToken = (token) => apiClient.setToken(token);
