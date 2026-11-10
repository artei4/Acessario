import { handleApiRequest } from '../../shared/api.js';
import { buildSeed } from '../../shared/seed.js';
import { ApiError } from './ApiError.js';

const STORAGE_KEY = 'acessario:db:v1';
/** No modo demonstração tudo roda no navegador: o segredo fica no código, então não há segurança real aqui. */
const DEMO_SECRET = 'acessario-modo-demonstracao';

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

  let token = null;

  async function request(method, path, { query, body } = {}) {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
    // clona o corpo para simular a serialização da rede
    const payload = body === undefined ? undefined : JSON.parse(JSON.stringify(body));
    const result = await handleApiRequest(db, { method, path, query, body: payload, token }, { secret: DEMO_SECRET });
    if (result.changed) writeStorage(db);
    if (result.status >= 400) throw new ApiError(result.body?.error ?? 'Erro', { status: result.status, code: result.body?.code });
    return result.body === null ? null : JSON.parse(JSON.stringify(result.body));
  }

  function reset() {
    db = buildSeed();
    writeStorage(db);
  }

  return {
    request,
    reset,
    setToken: (value) => {
      token = value ?? null;
    },
    mode: 'local',
  };
}
