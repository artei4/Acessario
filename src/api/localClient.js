import { handleRequest } from '../../shared/restCore.js';
import { buildSeed } from '../../shared/seed.js';
import { ApiError } from './ApiError.js';

const STORAGE_KEY = 'acessario:db:v1';

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(db) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // armazenamento indisponível (aba anônima, cota cheia): segue só em memória
  }
}

/**
 * Cliente que executa o mesmo núcleo REST do servidor dentro do navegador.
 * Serve para demonstrar o app sem subir a API. Mesma interface do httpClient.
 */
export function createLocalClient({ latencyMs = 150 } = {}) {
  let db = readStorage() ?? buildSeed();

  async function request(method, path, { query, body } = {}) {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
    // clona o corpo para simular a serialização da rede
    const payload = body === undefined ? undefined : JSON.parse(JSON.stringify(body));
    const result = handleRequest(db, { method, path, query, body: payload });
    if (result.changed) writeStorage(db);
    if (result.status >= 400) throw new ApiError(result.body?.error ?? 'Erro', { status: result.status });
    return result.body === null ? null : JSON.parse(JSON.stringify(result.body));
  }

  function reset() {
    db = buildSeed();
    writeStorage(db);
  }

  return { request, reset, mode: 'local' };
}
