/**
 * API REST do AcessaRio — servidor HTTP sem dependências externas.
 *
 * Uso: npm run api   (porta padrão 3001, ou PORT=xxxx)
 * O banco fica em server/db.json; se não existir, é criado a partir dos dados de demonstração.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { handleRequest, parseQueryString } from '../shared/restCore.js';
import { buildSeed } from '../shared/seed.js';

const PORT = Number(process.env.PORT ?? 3001);
const MAX_BODY_BYTES = 2 * 1024 * 1024; // fotos são enviadas reduzidas, em base64
const DB_PATH = join(dirname(fileURLToPath(import.meta.url)), 'db.json');

function loadDb() {
  if (!existsSync(DB_PATH)) {
    const seed = buildSeed();
    writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    console.log('Banco criado com dados de demonstração em server/db.json');
    return seed;
  }
  return JSON.parse(readFileSync(DB_PATH, 'utf8'));
}

const db = loadDb();

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
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body === null || body === undefined ? '' : JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, null);

  const [path, search = ''] = req.url.split('?');
  try {
    const body = await readBody(req);
    const result = handleRequest(db, { method: req.method, path, query: parseQueryString(search), body });
    if (result.changed) writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log(`${req.method} ${req.url} → ${result.status}`);
    send(res, result.status, result.body);
  } catch (error) {
    send(res, error.status ?? 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`API do AcessaRio em http://localhost:${PORT}`);
  console.log(`Coleções: ${Object.keys(db).join(', ')}`);
});
