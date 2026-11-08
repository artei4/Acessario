import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planFromOsrm, stepsToSegments } from '../src/domain/routePlanning.js';
import { evaluateRoute, evaluateSegment } from '../src/domain/scoring.js';
import { handleRequest } from '../shared/restCore.js';

const step = (name, distance, coords) => ({ name, distance, geometry: { coordinates: coords } });

// Resposta no formato do OSRM: coordenadas em [lon, lat]
const osrm = {
  code: 'Ok',
  routes: [
    {
      distance: 1320,
      legs: [
        {
          steps: [
            step('Avenida das Américas', 800, [[-43.47, -23.0], [-43.465, -23.001]]),
            step('Avenida das Américas', 200, [[-43.465, -23.001], [-43.463, -23.002]]),
            step('', 15, [[-43.463, -23.002], [-43.4629, -23.0021]]),
            step('Rua Silvia Pozzana', 305, [[-43.4629, -23.0021], [-43.46, -23.004]]),
            step('Rua Silvia Pozzana', 0, [[-43.46, -23.004]]),
          ],
        },
      ],
    },
    { distance: 1500, legs: [{ steps: [step('Rua A', 1500, [[-43.47, -23.0], [-43.46, -23.004]])] }] },
  ],
};

test('junta passos da mesma rua e passos curtos, e ignora a chegada', () => {
  const segments = stepsToSegments(osrm.routes[0].legs[0].steps);
  assert.deepEqual(segments.map((s) => [s.street, s.lengthM]), [
    ['Avenida das Américas', 1015],
    ['Rua Silvia Pozzana', 305],
  ]);
  assert.deepEqual(segments[0].path[0], [-23, -43.47], 'converte [lon, lat] para [lat, lon]');
  assert.equal(segments[0].path.length, 4, 'não repete o ponto de emenda');
});

test('gera rotas com trechos sem levantamento, tempo e descrição', () => {
  const plans = planFromOsrm(osrm, { originId: 'p-a', destinationId: 'p-b' });
  assert.equal(plans.length, 2);
  const [{ route, segments }] = plans;
  assert.equal(route.name, 'Rota 1');
  assert.equal(route.via, 'Avenida das Américas e Rua Silvia Pozzana');
  assert.equal(route.distanceKm, 1.3);
  assert.equal(route.baseMinutes, 20);
  assert.deepEqual(segments.map((s) => s.order), [1, 2]);
  assert.equal(segments[0].widthM, null);
  assert.equal(segments[0].surveyedAt, null);
});

test('trecho sem levantamento fica neutro: nota base, sem atraso e não verificado', () => {
  const [{ route, segments }] = planFromOsrm(osrm, { originId: 'p-a', destinationId: 'p-b' });
  const evaluation = evaluateSegment({ ...segments[0], id: 's1' }, [], { profileId: 'cadeirante' });
  assert.equal(evaluation.score, 65);
  assert.equal(evaluation.delayMin, 0);
  assert.equal(evaluation.verified, false);
  assert.equal(evaluation.blocked, false);
  const routeEvaluation = evaluateRoute({ ...route, id: 'r' }, segments.map((s, i) => ({ ...s, id: `s${i}` })), [], { profileId: 'cadeirante' });
  assert.equal(routeEvaluation.sufficient, false, 'sem dados verificados, a rota fica com "Informações insuficientes"');
  assert.equal(routeEvaluation.maxSlope, 0);
});

test('a API grava lugares, rotas e trechos e apaga em cascata rota → trechos → relatos → votos', () => {
  const db = { places: [], routes: [], segments: [], reports: [], votes: [] };
  const place = handleRequest(db, { method: 'POST', path: '/places', body: { name: 'Americas Shopping', lat: -23, lon: -43.47 } });
  assert.equal(place.status, 201);
  assert.equal(handleRequest(db, { method: 'POST', path: '/places', body: { name: 'Sem coordenada' } }).status, 422);
  const route = handleRequest(db, { method: 'POST', path: '/routes', body: { originId: place.body.id, destinationId: 'x' } }).body;
  const segment = handleRequest(db, { method: 'POST', path: '/segments', body: { routeId: route.id, path: [[0, 0], [0, 1]] } }).body;
  const report = handleRequest(db, { method: 'POST', path: '/reports', body: { segmentId: segment.id, type: 'obra', kind: 'obstacle', userId: 'u' } }).body;
  handleRequest(db, { method: 'POST', path: '/votes', body: { reportId: report.id, userId: 'v', type: 'confirm' } });
  handleRequest(db, { method: 'DELETE', path: `/routes/${route.id}` });
  assert.deepEqual([db.routes.length, db.segments.length, db.reports.length, db.votes.length], [0, 0, 0, 0]);
});
