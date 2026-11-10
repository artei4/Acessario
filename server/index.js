/**
 * API REST do AcessaRio — servidor HTTP local, sem dependências externas.
 *
 * Uso: npm run api   (porta padrão 3001, ou PORT=xxxx)
 * O banco fica em server/db.json; se não existir, é criado com os dados de demonstração.
 * Na Vercel, o mesmo núcleo roda como Vercel Function (api/index.js).
 */
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseQueryString } from '../shared/restCore.js';
import { tokenFromHeader } from '../shared/api.js';
import { CORS_HEADERS, runApiRequest } from './handler.js';
import { createFileStore } from './stores.js';

const PORT = Number(process.env.PORT ?? 3001);
const MAX_BODY_BYTES = 2 * 1024 * 1024; // fotos são enviadas reduzidas, em base64
const store = await createFileStore(join(dirname(fileURLToPath(import.meta.url)), 'db.json'));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Corpo da requisição muito grande'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve(undefined);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('JSON inválido'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS });
  res.end(body === null || body === undefined ? '' : JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, null);
  const [path, search = ''] = req.url.split('?');
  try {
    const body = await readBody(req);
    const token = tokenFromHeader(req.headers.authorization);
    const result = await runApiRequest(store, { method: req.method, path, query: parseQueryString(search), body, token });
    console.log(`${req.method} ${req.url} → ${result.status}`);
    send(res, result.status, result.body);
  } catch (error) {
    send(res, error.status ?? 500, { error: error.message });
  }
});

if (!process.env.AUTH_SECRET) console.warn('AUTH_SECRET não definido: usando o segredo de desenvolvimento para assinar os tokens.');

server.listen(PORT, async () => {
  console.log(`API do AcessaRio em http://localhost:${PORT}`);
  console.log(`Coleções: ${Object.keys(await store.load()).join(', ')}`);
});
