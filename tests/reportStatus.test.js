import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeReport, statusFromTally, tallyVotes } from '../src/domain/reportStatus.js';

const vote = (type, createdAt = '2026-11-01T10:00:00.000Z') => ({ type, createdAt });

test('relato sem votos é "não verificado"', () => {
  assert.equal(statusFromTally({ confirm: 0, incorrect: 0, resolved: 0 }), 'nao_verificado');
});

test('uma confirmação já coloca o relato "em confirmação"', () => {
  assert.equal(statusFromTally({ confirm: 1, incorrect: 0, resolved: 0 }), 'em_confirmacao');
});

test('cinco confirmações tornam o relato "confirmado"', () => {
  assert.equal(statusFromTally({ confirm: 5, incorrect: 1, resolved: 0 }), 'confirmado');
});

test('"resolvido" vence quando supera as confirmações', () => {
  assert.equal(statusFromTally({ confirm: 1, incorrect: 0, resolved: 2 }), 'resolvido');
  assert.equal(statusFromTally({ confirm: 3, incorrect: 0, resolved: 2 }), 'em_confirmacao');
});

test('"incorreto" exige ao menos dois votos e mais que as confirmações', () => {
  assert.equal(statusFromTally({ confirm: 0, incorrect: 1, resolved: 0 }), 'nao_verificado');
  assert.equal(statusFromTally({ confirm: 1, incorrect: 2, resolved: 0 }), 'incorreto');
});

test('tallyVotes conta cada tipo de voto', () => {
  assert.deepEqual(tallyVotes([vote('confirm'), vote('confirm'), vote('incorrect')]), {
    confirm: 2,
    incorrect: 1,
    resolved: 0,
  });
});

test('relato sem atividade há mais de 30 dias fica "possivelmente desatualizado"', () => {
  const now = new Date('2026-11-07T12:00:00.000Z');
  const old = describeReport({ id: 'a', createdAt: '2026-09-21T12:00:00.000Z' }, [], now);
  const fresh = describeReport({ id: 'b', createdAt: '2026-09-21T12:00:00.000Z' }, [vote('confirm', '2026-11-05T12:00:00.000Z')], now);
  assert.equal(old.outdated, true);
  assert.equal(fresh.outdated, false, 'um voto recente renova o relato');
});

test('relatos resolvidos ou incorretos deixam de ser ativos', () => {
  const report = describeReport({ id: 'a', createdAt: '2026-11-01T00:00:00.000Z' }, [vote('resolved'), vote('resolved')]);
  assert.equal(report.status, 'resolvido');
  assert.equal(report.active, false);
});
