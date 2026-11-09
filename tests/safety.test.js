import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeReports } from '../src/domain/reportStatus.js';
import { combineSafety, evaluateSafety, freshness, safetySummary } from '../src/domain/safety.js';
import { evaluateRoute, evaluateSegment, rankRoutes } from '../src/domain/scoring.js';
import { buildSeed } from '../shared/seed.js';

const now = new Date('2026-11-09T12:00:00.000Z');
const daysAgo = (d) => new Date(now.getTime() - d * 864e5).toISOString();
const confirms = (reportId, n, d) => Array.from({ length: n }, (_, i) => ({ id: `${reportId}-v${i}`, reportId, type: 'confirm', createdAt: daysAgo(d) }));
const describe = (reports, votes = []) => describeReports(reports, votes, now);

test('assalto perde peso com o tempo e vence em 30 dias', () => {
  const [fresh] = describe([{ id: 'a', kind: 'risk', type: 'assalto', createdAt: daysAgo(0) }]);
  const [old] = describe([{ id: 'b', kind: 'risk', type: 'assalto', createdAt: daysAgo(31) }]);
  assert.equal(freshness(fresh, now).factor, 1);
  assert.equal(freshness(old, now).factor, 0);
  assert.equal(evaluateSafety([old], now).level, 'none', 'relato vencido não conta');
});

test('um relato não verificado só pede atenção; assalto confirmado e tiroteio geram alerta', () => {
  const unverified = describe([{ id: 'a', kind: 'risk', type: 'assalto', createdAt: daysAgo(1) }]);
  assert.equal(evaluateSafety(unverified, now).level, 'attention');
  const shooting = describe([{ id: 't', kind: 'risk', type: 'tiroteio', createdAt: daysAgo(1) }], confirms('t', 5, 1));
  assert.equal(evaluateSafety(shooting, now).level, 'alert');
  const twoRobberies = describe(
    [{ id: 'a', kind: 'risk', type: 'assalto', createdAt: daysAgo(2) }, { id: 'b', kind: 'risk', type: 'assalto', createdAt: daysAgo(3) }],
    [...confirms('a', 5, 2), ...confirms('b', 5, 3)],
  );
  assert.equal(evaluateSafety(twoRobberies, now).level, 'alert');
});

test('pontos positivos atenuam, mas não anulam uma ocorrência recente', () => {
  const reports = describe(
    [
      { id: 'a', kind: 'risk', type: 'assalto', createdAt: daysAgo(1) },
      { id: 'l', kind: 'safe', type: 'bem_iluminado', createdAt: daysAgo(1) },
      { id: 'p', kind: 'safe', type: 'policiamento', createdAt: daysAgo(1) },
    ],
    [...confirms('a', 5, 1), ...confirms('l', 5, 1), ...confirms('p', 5, 1)],
  );
  const safety = evaluateSafety(reports, now);
  assert.ok(safety.score > 0 && safety.score < 12);
  assert.equal(safety.level, 'attention');
});

test('só positivos = risco baixo; sem relatos = sem relatos', () => {
  assert.equal(evaluateSafety(describe([{ id: 'l', kind: 'safe', type: 'bem_iluminado', createdAt: daysAgo(1) }]), now).level, 'low');
  assert.equal(evaluateSafety([], now).level, 'none');
});

test('relatos de segurança não mexem na nota de acessibilidade', () => {
  const segment = { id: 's', order: 1, lengthM: 100, widthM: 1.6, slopePct: 1, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, surveyedAt: daysAgo(1), path: [[0, 0], [0, 0.001]] };
  const risk = describe([{ id: 'a', segmentId: 's', kind: 'risk', type: 'tiroteio', createdAt: daysAgo(1) }], confirms('a', 5, 1));
  const ctx = { profileId: 'cadeirante', now };
  assert.equal(evaluateSegment(segment, risk, ctx).score, evaluateSegment(segment, [], ctx).score);
  assert.equal(evaluateSegment(segment, risk, ctx).safety.level, 'alert');
});

test('o pior trecho define o nível da rota; "Evitar alertas" tira a recomendação', () => {
  const combined = combineSafety([{ level: 'low', score: 1, risks: [], positives: [] }, { level: 'alert', score: 20, risks: [], positives: [] }]);
  assert.equal(combined.level, 'alert');

  const db = buildSeed(now);
  // tiroteio confirmado na Rota 1 (fictício, só para o teste)
  db.reports.push({ id: 'x', segmentId: 'r1-t03', kind: 'risk', type: 'tiroteio', userId: 'u-v01', createdAt: daysAgo(1) });
  db.votes.push(...confirms('x', 5, 1));
  const reports = describeReports(db.reports, db.votes, now);
  const rank = (preferences) =>
    rankRoutes(db.routes.map((r) => evaluateRoute(r, db.segments.filter((s) => s.routeId === r.id), reports, { profileId: 'cadeirante', preferences, now })), preferences);
  assert.equal(rank({ avoidStairs: true })[0].route.id, 'r1', 'sem a preferência, a acessibilidade decide');
  const avoiding = rank({ avoidStairs: true, avoidUnsafe: true });
  assert.equal(avoiding.find((e) => e.route.id === 'r1').badge, 'atencao');
  assert.equal(avoiding.find((e) => e.recommended)?.route.id, 'r2');
});

test('resumo mostra a ocorrência mais recente e o status', () => {
  const reports = describe([{ id: 'a', kind: 'risk', type: 'assalto', createdAt: daysAgo(4) }], confirms('a', 2, 4));
  assert.equal(safetySummary(evaluateSafety(reports, now)), 'Assalto há 4 dias (em confirmação)');
});
