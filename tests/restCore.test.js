import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, parseQueryString } from '../shared/restCore.js';
import { nearestSegment } from '../src/domain/geo.js';
import { buildSeed } from '../shared/seed.js';

const freshDb = () => ({
  reports: [{ id: 'r1', segmentId: 's1', type: 'buraco', kind: 'obstacle', userId: 'u1' }],
  votes: [{ id: 'v1', reportId: 'r1', userId: 'u2', type: 'confirm' }],
});

test('CRUD completo de relatos', () => {
  const db = freshDb();
  const created = handleRequest(db, {
    method: 'POST', path: '/reports',
    body: { segmentId: 's2', type: 'obra', kind: 'obstacle', userId: 'u1' },
  });
  assert.equal(created.status, 201);
  assert.ok(created.body.id);

  const list = handleRequest(db, { method: 'GET', path: '/reports', query: { segmentId: ['s1', 's2'] } });
  assert.equal(list.body.length, 2);

  const patched = handleRequest(db, { method: 'PATCH', path: `/reports/${created.body.id}`, body: { description: 'ok' } });
  assert.equal(patched.body.description, 'ok');

  const removed = handleRequest(db, { method: 'DELETE', path: `/reports/${created.body.id}` });
  assert.equal(removed.status, 204);
  assert.equal(db.reports.length, 1);
});

test('remover um relato remove os votos dele', () => {
  const db = freshDb();
  handleRequest(db, { method: 'DELETE', path: '/reports/r1' });
  assert.equal(db.votes.length, 0);
});

test('valida campos obrigatórios e coleções desconhecidas', () => {
  const db = freshDb();
  assert.equal(handleRequest(db, { method: 'POST', path: '/reports', body: { type: 'x' } }).status, 422);
  assert.equal(handleRequest(db, { method: 'GET', path: '/nada' }).status, 404);
  assert.equal(handleRequest(db, { method: 'GET', path: '/reports/inexistente' }).status, 404);
});

test('parseQueryString agrupa chaves repetidas', () => {
  assert.deepEqual(parseQueryString('?a=1&a=2&b=3'), { a: ['1', '2'], b: '3' });
});

test('nearestSegment encontra o trecho mais próximo do ponto tocado no mapa', () => {
  const { segments } = buildSeed();
  const near = nearestSegment([-22.9607, -43.1760], segments);
  assert.equal(near.segment.id, 'r1-t04');
  assert.equal(nearestSegment([-22.90, -43.10], segments), null);
});
