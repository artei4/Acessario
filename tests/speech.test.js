import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpeech } from '../src/services/speech.js';
import { speakNavigationStep, speakRoute, speakRouteSummary, speakRoutesScreen, speakSegment } from '../src/components/speech/spokenText.js';
import { buildSeed } from '../shared/seed.js';
import { describeReports } from '../src/domain/reportStatus.js';
import { evaluateRoute, rankRoutes } from '../src/domain/scoring.js';

function fakeSynth(voices = [{ lang: 'en-US' }, { lang: 'pt-BR', localService: true, name: 'Luciana' }]) {
  const spoken = [];
  let cancels = 0;
  return {
    spoken,
    get cancels() {
      return cancels;
    },
    getVoices: () => voices,
    speak: (u) => spoken.push(u),
    cancel: () => {
      cancels += 1;
    },
  };
}
class Utterance {
  constructor(text) {
    this.text = text;
  }
}

test('voz: fala em português, com a velocidade escolhida, e interrompe a fala anterior', () => {
  const synth = fakeSynth();
  const speech = createSpeech(synth, { Utterance });
  speech.setRate(1.3);
  speech.speak('Olá');
  assert.equal(synth.spoken[0].text, 'Olá');
  assert.equal(synth.spoken[0].lang, 'pt-BR');
  assert.equal(synth.spoken[0].voice.name, 'Luciana');
  assert.equal(synth.spoken[0].rate, 1.3);
  assert.equal(synth.cancels, 1);
  speech.speak('depois', { interrupt: false });
  assert.equal(synth.cancels, 1, 'fila não cancela');
  speech.setRate(9);
  assert.equal(speech.rate, 2, 'velocidade limitada');
});

test('voz: antes do primeiro toque na página, guarda o texto e fala depois', () => {
  const synth = fakeSynth();
  let active = false;
  let activate;
  const speech = createSpeech(synth, { Utterance, hasUserActivation: () => active, onFirstActivation: (cb) => (activate = cb) });
  speech.speak('Tela de entrada.');
  speech.speak('Botão Entrar.', { interrupt: false });
  assert.equal(synth.spoken.length, 0);
  active = true;
  activate();
  assert.equal(synth.spoken.length, 1);
  assert.equal(synth.spoken[0].text, 'Tela de entrada. Botão Entrar.');
});

test('voz: sem síntese no navegador, nada quebra', () => {
  const speech = createSpeech(null);
  assert.equal(speech.supported, false);
  assert.doesNotThrow(() => speech.speak('oi'));
  assert.doesNotThrow(() => speech.stop());
});

test('textos falados das rotas: frases completas, sem abreviações de tela', () => {
  const now = new Date('2026-11-07T12:00:00.000Z');
  const context = { profileId: 'cadeirante', preferences: { avoidStairs: true }, now };
  const db = buildSeed(now);
  const reports = describeReports(db.reports, db.votes, now);
  const ranked = rankRoutes(
    db.routes.map((route) => evaluateRoute(route, db.segments.filter((s) => s.routeId === route.id), reports, context)),
    context.preferences,
  );
  const screen = speakRoutesScreen({ evaluations: ranked, origin: { name: 'Rua Siqueira Campos' }, destination: { name: 'Shopping Rio Sul' } });
  assert.match(screen, /^3 rotas encontradas de Rua Siqueira Campos para Shopping Rio Sul\. Rota 1, Recomendada\. Nota \d+ de 100/);
  assert.doesNotMatch(screen, /\bkm\b|·/, 'unidades por extenso e sem separadores visuais');

  const r2 = ranked.find((e) => e.route.id === 'r2');
  const r2Text = speakRoute(r2);
  assert.match(r2Text, /Atenção: buraco na calçada no trecho 01 e no trecho 02; calçada estreita no trecho 02; /);
  assert.match(r2Text, /inclinação de \d+ por cento/);
  assert.doesNotMatch(r2Text, /%|Trecho Trecho/);
  assert.match(speakRouteSummary(ranked[0]), /^Resumo da Rota 1: \d+ minutos, .+ quilômetros?, \d+ trechos\./);
  assert.match(speakSegment(r2.segments[0]), /^Trecho 01, .+, \d+ metros\./);

  const last = r2.segments.length - 1;
  assert.match(speakNavigationStep(r2, 0), /^Trecho 1 de \d+\. Siga pela .+ Próximo trecho\.$/);
  assert.match(speakNavigationStep(r2, last), /último trecho/);
  assert.equal(speakRoutesScreen({ evaluations: [], loading: true }), 'Procurando rotas.');
});
