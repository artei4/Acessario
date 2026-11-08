/**
 * Onde a API guarda o banco (um objeto { colecao: [itens] }).
 * Todas as lojas têm a mesma interface: load() → db, save(db).
 *
 *  - fileStore:   server/db.json (servidor local, npm run api)
 *  - memoryStore: só na memória (testes, ou Vercel sem Blob configurado: volta ao início de tempos em tempos)
 *  - blobStore:   Vercel Blob (produção na Vercel)
 */
import { buildSeed } from '../shared/seed.js';

export function createMemoryStore(initial = buildSeed()) {
  let db = initial;
  return {
    kind: 'memory',
    load: async () => db,
    save: async (next) => {
      db = next;
    },
  };
}

export async function createFileStore(path) {
  const { existsSync, readFileSync, writeFileSync } = await import('node:fs');
  let db;
  return {
    kind: 'file',
    async load() {
      if (db) return db;
      if (!existsSync(path)) writeFileSync(path, JSON.stringify(buildSeed(), null, 2));
      db = JSON.parse(readFileSync(path, 'utf8'));
      return db;
    },
    async save(next) {
      db = next;
      writeFileSync(path, JSON.stringify(next, null, 2));
    },
  };
}

const BLOB_PREFIX = 'acessario-db/';
const KEEP_VERSIONS = 20;

/**
 * Banco no Vercel Blob. Cada gravação cria um arquivo novo (acessario-db/<timestamp>.json)
 * em vez de sobrescrever o mesmo: arquivos públicos ficam em cache na CDN, então um nome novo
 * a cada versão garante que a leitura nunca pegue dado velho. As versões antigas são apagadas aos poucos.
 *
 * Limitação: duas gravações exatamente ao mesmo tempo em instâncias diferentes — vale a última.
 */
export function createBlobStore({ blob, cacheMs = 2000, fetchImpl = fetch } = {}) {
  let cache = null;
  let cachedAt = 0;
  let saves = 0;

  const newestFirst = (blobs) => [...blobs].sort((a, b) => b.pathname.localeCompare(a.pathname));

  async function save(next) {
    const pathname = `${BLOB_PREFIX}${String(Date.now()).padStart(15, '0')}.json`;
    await blob.put(pathname, JSON.stringify(next), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    cache = next;
    cachedAt = Date.now();
    saves += 1;
    if (saves % 10 === 1) {
      const { blobs } = await blob.list({ prefix: BLOB_PREFIX });
      const old = newestFirst(blobs).slice(KEEP_VERSIONS);
      if (old.length > 0) await blob.del(old.map((b) => b.url));
    }
  }

  async function load() {
    if (cache && Date.now() - cachedAt < cacheMs) return cache;
    const { blobs } = await blob.list({ prefix: BLOB_PREFIX });
    const [latest] = newestFirst(blobs);
    if (!latest) {
      await save(buildSeed());
      return cache;
    }
    const response = await fetchImpl(latest.url);
    if (!response.ok) throw new Error(`Falha ao ler o banco (${response.status})`);
    cache = await response.json();
    cachedAt = Date.now();
    return cache;
  }

  return { kind: 'blob', load, save };
}
