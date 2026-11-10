/**
 * Ponto único entre o transporte HTTP (Node local ou Vercel Function) e o núcleo REST.
 * Carrega o banco da loja, executa a requisição e salva se algo mudou.
 */
import { parseQueryString } from '../shared/restCore.js';
import { handleApiRequest } from '../shared/api.js';

/**
 * Segredo que assina os tokens de sessão. Na Vercel, se AUTH_SECRET não estiver definido,
 * usa o token do Blob (também secreto e só do servidor). Localmente, um valor de desenvolvimento.
 */
export const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BLOB_READ_WRITE_TOKEN || 'acessario-dev-secret';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Serializa as gravações dentro da mesma instância para uma não apagar a outra. */
let queue = Promise.resolve();

export function runApiRequest(store, request) {
  const task = queue.then(async () => {
    const db = await store.load();
    const result = await handleApiRequest(db, request, { secret: AUTH_SECRET });
    if (result.changed) await store.save(db);
    return result;
  });
  queue = task.catch(() => {});
  return task;
}

/** Extrai a rota da API (ex.: "/reports/rep-1") e a query, aceitando a URL original ou a reescrita. */
export function resolveRoute(url) {
  const [pathname, search = ''] = url.split('?');
  const query = parseQueryString(search);
  let path = pathname.replace(/^\/api/, '') || '/';
  if (query.path !== undefined) {
    path = `/${[].concat(query.path)[0]}`;
    delete query.path;
  }
  return { path, query };
}
