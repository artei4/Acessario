import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_SECRET, resolveRoute, runApiRequest } from '../server/handler.js';
import { createToken } from '../shared/auth.js';
import { createBlobStore, createMemoryStore } from '../server/stores.js';

test('resolveRoute aceita a URL original e a reescrita pelo vercel.json', () => {
  assert.deepEqual(resolveRoute('/api/reports/rep-1?userId=u'), { path: '/reports/rep-1', query: { userId: 'u' } });
  assert.deepEqual(resolveRoute('/api?path=reports/rep-1&userId=u'), { path: '/reports/rep-1', query: { userId: 'u' } });
  assert.deepEqual(resolveRoute('/api?segmentId=a&segmentId=b&path=reports'), { path: '/reports', query: { segmentId: ['a', 'b'] } });
});

test('runApiRequest salva na loja só quando algo muda', async () => {
  const store = createMemoryStore({ reports: [] });
  let saves = 0;
  const save = store.save;
  store.save = async (db) => { saves += 1; return save(db); };
  await runApiRequest(store, { method: 'GET', path: '/reports' });
  const token = await createToken('u', AUTH_SECRET);
  await runApiRequest(store, { method: 'POST', path: '/reports', token, body: { segmentId: 's', type: 'obra', kind: 'obstacle', userId: 'u' } });
  assert.equal(saves, 1);
  assert.equal((await store.load()).reports.length, 1);
});

/** Vercel Blob falso: guarda os arquivos num Map. */
function fakeBlob() {
  const files = new Map();
  return {
    files,
    put: async (pathname, body) => { files.set(pathname, body); return { url: `blob://${pathname}`, pathname }; },
    list: async ({ prefix }) => ({ blobs: [...files.keys()].filter((p) => p.startsWith(prefix)).map((pathname) => ({ pathname, url: `blob://${pathname}` })) }),
    del: async (urls) => urls.forEach((u) => files.delete(u.replace('blob://', ''))),
    fetch: async (url) => ({ ok: true, json: async () => JSON.parse(files.get(url.replace('blob://', ''))) }),
  };
}

test('blobStore cria o banco com os dados de demonstração e lê sempre a versão mais nova', async () => {
  const blob = fakeBlob();
  const first = createBlobStore({ blob, cacheMs: 0, fetchImpl: blob.fetch });
  const db = await first.load();
  assert.ok(db.reports.length > 0, 'semeia o banco na primeira leitura');
  assert.equal(blob.files.size, 1);

  db.reports.push({ id: 'novo' });
  await new Promise((r) => setTimeout(r, 2));
  await first.save(db);
  // outra instância da função enxerga a gravação
  const second = createBlobStore({ blob, cacheMs: 0, fetchImpl: blob.fetch });
  assert.ok((await second.load()).reports.some((r) => r.id === 'novo'));
});
