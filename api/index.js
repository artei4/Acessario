/**
 * API REST do AcessaRio na Vercel (Vercel Function, Node.js).
 *
 * O vercel.json reescreve /api/<rota> para esta função. O núcleo REST é o mesmo do
 * servidor local; muda só onde o banco fica:
 *   - com BLOB_READ_WRITE_TOKEN (Blob conectado ao projeto): Vercel Blob, dados persistem;
 *   - sem ele: memória da função, os dados voltam ao início de tempos em tempos.
 */
import * as blob from '@vercel/blob';
import { CORS_HEADERS, resolveRoute, runApiRequest } from '../server/handler.js';
import { createBlobStore, createMemoryStore } from '../server/stores.js';

const store = process.env.BLOB_READ_WRITE_TOKEN ? createBlobStore({ blob }) : createMemoryStore();

export default async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.setHeader('X-AcessaRio-Store', store.kind);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { path, query } = resolveRoute(req.url);
  try {
    const body = typeof req.body === 'string' && req.body ? JSON.parse(req.body) : req.body;
    const result = await runApiRequest(store, { method: req.method, path, query, body });
    if (result.body === null) return res.status(result.status).end();
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
