import { ApiError } from './ApiError.js';

/** Monta "?a=1&a=2&b=3" a partir de { a: [1, 2], b: 3 }, ignorando valores vazios. */
export function toQueryString(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    [].concat(value).forEach((v) => params.append(key, v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Cliente HTTP para a API REST. Mesma interface do localClient:
 *   request(method, path, { query, body }) -> Promise<dados>
 */
export function createHttpClient(baseUrl, { timeoutMs = 10000 } = {}) {
  async function request(method, path, { query, body, signal } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    signal?.addEventListener('abort', () => controller.abort());

    let response;
    try {
      response = await fetch(`${baseUrl}${path}${toQueryString(query)}`, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (cause) {
      throw new ApiError('Falha de rede', { status: 0, cause });
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(data?.error ?? `Erro ${response.status}`, { status: response.status });
    }
    return data;
  }

  return { request, mode: 'http' };
}
