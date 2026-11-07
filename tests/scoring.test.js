import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSeed } from '../shared/seed.js';
import { describeReports } from '../src/domain/reportStatus.js';
import { evaluateRoute, evaluateSegment, rankRoutes, reportImpact } from '../src/domain/scoring.js';

const now = new Date('2026-11-07T12:00:00.000Z');
const context = { profileId: 'cadeirante', preferences: { avoidStairs: true, preferFlat: true }, now };

const segment = {
  id: 's1', routeId: 'r', order: 1, lengthM: 100, widthM: 1.6, slopePct: 1,
  hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: [],
  surveyedAt: '2026-11-01T00:00:00.000Z', path: [[0, 0], [0, 0.001]],
};

const report = (overrides) => ({
  id: 'x', segmentId: 's1', kind: 'obstacle', type: 'buraco',
  createdAt: '2026-11-06T00:00:00.000Z', ...overrides,
});

test('escadas bloqueiam o trecho para cadeirante, mas não para deficiência visual', () => {
  const stairs = { ...segment, hasStairs: true };
  assert.equal(evaluateSegment(stairs, [], context).blocked, true);
  assert.equal(evaluateSegment(stairs, [], { ...context, profileId: 'deficiencia_visual' }).blocked, false);
});

test('relato confirmado pesa mais que relato não verificado', () => {
  const unverified = describeReports([report({ id: 'a' })], [], now);
  const confirmed = describeReports(
    [report({ id: 'a' })],
    Array.from({ length: 5 }, (_, i) => ({ id: `v${i}`, reportId: 'a', type: 'confirm', createdAt: '2026-11-06T01:00:00.000Z' })),
    now,
  );
  const base = evaluateSegment(segment, [], context).score;
  const withUnverified = evaluateSegment(segment, unverified, context).score;
  const withConfirmed = evaluateSegment(segment, confirmed, context).score;
  assert.ok(withConfirmed < withUnverified && withUnverified < base);
});

test('relato de rampa em confirmação soma 4 pontos para cadeirante', () => {
  const reports = describeReports(
    [report({ id: 'r', kind: 'facilitator', type: 'rampa' })],
    [{ id: 'v', reportId: 'r', type: 'confirm', createdAt: '2026-11-06T01:00:00.000Z' }],
    now,
  );
  const narrow = { ...segment, hasRamps: false };
  assert.equal(reportImpact(narrow, reports, 'r', context), 4);
});

test('inclinação já medida no levantamento não é penalizada de novo pelo relato', () => {
  const steep = { ...segment, slopePct: 8 };
  const reports = describeReports([report({ type: 'inclinacao' })], [], now);
  assert.equal(evaluateSegment(steep, reports, context).score, evaluateSegment(steep, [], context).score);
});

test('preferir rotas planas aumenta a penalidade da inclinação', () => {
  const steep = { ...segment, slopePct: 8 };
  const flatPref = evaluateSegment(steep, [], context).score;
  const noPref = evaluateSegment(steep, [], { ...context, preferences: {} }).score;
  assert.ok(flatPref < noPref);
});

test('com os dados de demonstração, a Rota 1 é recomendada e a Rota 3 não tem dados suficientes', () => {
  const db = buildSeed(now);
  const reports = describeReports(db.reports, db.votes, now);
  const ranked = rankRoutes(
    db.routes.map((route) => evaluateRoute(route, db.segments.filter((s) => s.routeId === route.id), reports, context)),
    context.preferences,
  );
  assert.equal(ranked[0].route.id, 'r1');
  assert.equal(ranked[0].badge, 'recomendada');
  const r2 = ranked.find((e) => e.route.id === 'r2');
  assert.ok(r2.scoreDelta < 0, 'relatos novos derrubam a nota da Rota 2');
  assert.ok(r2.minutes > r2.originalMinutes, 'e aumentam o tempo estimado');
  const r3 = ranked.find((e) => e.route.id === 'r3');
  assert.equal(r3.score, null);
  assert.equal(r3.badge, 'insuficiente');
});

test('rota invertida percorre os trechos na ordem contrária', () => {
  const db = buildSeed(now);
  const route = { ...db.routes[0], reversed: true };
  const evaluation = evaluateRoute(route, db.segments.filter((s) => s.routeId === route.id), [], context);
  assert.deepEqual(evaluation.segments.map((s) => s.segment.order), [5, 4, 3, 2, 1]);
});
