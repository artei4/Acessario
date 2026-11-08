import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachReportsToSegments } from '../src/domain/geo.js';
import { handleRequest } from '../shared/restCore.js';

// trecho em linha reta na Av. das Américas (~550 m)
const segment = { id: 's-americas', path: [[-23.0103, -43.4685], [-23.0095, -43.4632]] };
const other = { id: 's-outro', path: [[-22.96, -43.18], [-22.961, -43.181]] };

test('relato do próprio trecho continua no trecho', () => {
  const [r] = attachReportsToSegments([{ id: 'a', segmentId: 's-americas' }], [segment]);
  assert.equal(r.segmentId, 's-americas');
  assert.equal(r.attachedBy, undefined);
});

test('relato feito por localização perto da rota entra na avaliação dela', () => {
  const report = { id: 'b', segmentId: null, location: { lat: -23.0099, lon: -43.4660 } };
  const [r] = attachReportsToSegments([report], [other, segment]);
  assert.equal(r.segmentId, 's-americas');
  assert.equal(r.attachedBy, 'location');
  assert.equal(report.segmentId, null, 'não altera o relato original');
});

test('relato de outra rota na mesma rua também vale (rotas compartilham relatos)', () => {
  const report = { id: 'c', segmentId: 's-de-outra-rota', location: { lat: -23.0099, lon: -43.4660 } };
  assert.equal(attachReportsToSegments([report], [segment])[0].segmentId, 's-americas');
});

test('relato longe da rota fica de fora', () => {
  const far = { id: 'd', segmentId: null, location: { lat: -22.9, lon: -43.2 } };
  assert.deepEqual(attachReportsToSegments([far], [segment]), []);
});

test('a API aceita relato só com localização e recusa relato sem trecho nem local', () => {
  const db = { reports: [] };
  const ok = handleRequest(db, { method: 'POST', path: '/reports', body: { type: 'rampa', kind: 'facilitator', userId: 'u', segmentId: null, location: { lat: -23, lon: -43.4 } } });
  assert.equal(ok.status, 201);
  const bad = handleRequest(db, { method: 'POST', path: '/reports', body: { type: 'rampa', kind: 'facilitator', userId: 'u' } });
  assert.equal(bad.status, 422);
  assert.match(bad.body.error, /local/);
});
