import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFICIENCIES,
  buildTest,
  classifyVision,
  contrastRatio,
  deltaE,
  linearToSrgb,
  paintPlate,
  plateColors,
  plateLayout,
  rgbToHex,
  simulate,
} from '../src/domain/colorVision.js';
import { VISION_PALETTES, levelColors, levelDash, paletteCss } from '../src/domain/visionPalettes.js';

const hex = (lin) => rgbToHex(lin.map(linearToSrgb));

/** Diferença entre número e fundo de uma prancha, para alguém com o tipo `type` (null = visão típica). */
function plateContrast(plateType, strength, type, severity = 1) {
  const { figure, background } = plateColors(plateType, strength);
  return deltaE(simulate(hex(figure), type, severity), simulate(hex(background), type, severity));
}

/**
 * "Pessoa simulada" fazendo o teste: acerta quando a diferença de cor passa do ruído de brilho
 * das bolinhas (cerca de 10 de luminosidade L* entre a mais clara e a mais escura), senão responde "não vejo".
 */
const NOISE_DELTA_E = 8;
function simulatedAnswers(plates, type, severity = 1) {
  return Object.fromEntries(plates.map((p) => [p.id, plateContrast(p.type, p.strength, type, severity) > NOISE_DELTA_E ? p.digit : null]));
}

test('cada prancha some para o tipo de daltonismo que ela testa e aparece na visão típica', () => {
  for (const type of DEFICIENCIES) {
    assert.ok(plateContrast(type, 'strong', type) < 2, `${type}: prancha forte invisível para ${type}`);
    assert.ok(plateContrast(type, 'weak', type) < 2, `${type}: prancha sutil invisível para ${type}`);
    assert.ok(plateContrast(type, 'strong', null) > 40, `${type}: prancha forte bem visível`);
    assert.ok(plateContrast(type, 'weak', null) > 10, `${type}: prancha sutil ainda visível acima do ruído de brilho`);
  }
  // a prancha de controle aparece para todo mundo
  for (const type of [null, ...DEFICIENCIES]) assert.ok(plateContrast('control', 'strong', type) > 15);
  // tipos diferentes enxergam as pranchas uns dos outros (é isso que separa protan, deutan e tritan)
  assert.ok(plateContrast('tritan', 'strong', 'deutan') > 40);
  assert.ok(plateContrast('deutan', 'strong', 'protan') > 15);
});

test('prancha: bolinhas sem sobreposição, número formado por parte delas e mesma semente = mesma prancha', () => {
  const dots = plateLayout(5, 1234);
  assert.ok(dots.length > 300, `poucas bolinhas: ${dots.length}`);
  const share = dots.filter((d) => d.figure).length / dots.length;
  assert.ok(share > 0.08 && share < 0.45, `parte do número: ${share}`);
  for (let i = 0; i < 200; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      assert.ok(Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y) >= dots[i].r + dots[j].r, 'bolinhas se sobrepõem');
    }
  }
  assert.deepEqual(plateLayout(5, 1234), dots);
  const painted = paintPlate(dots, plateColors('deutan', 'strong'), 1234);
  assert.ok(painted.every((d) => /^#[0-9a-f]{6}$/.test(d.color)));
  // brilho varia: o número não pode aparecer por claro/escuro
  assert.ok(new Set(painted.map((d) => d.color)).size > 50);
});

test('o teste tem 10 pranchas: controle primeiro e 3 de cada tipo, com o número certo entre as opções', () => {
  const plates = buildTest(42);
  assert.equal(plates.length, 10);
  assert.equal(plates[0].type, 'control');
  for (const type of DEFICIENCIES) assert.equal(plates.filter((p) => p.type === type).length, 3);
  for (const plate of plates) {
    assert.equal(plate.options.length, 4);
    assert.equal(new Set(plate.options).size, 4);
    assert.ok(plate.options.includes(plate.digit));
  }
  assert.notDeepEqual(buildTest(43).map((p) => p.digit), plates.map((p) => p.digit), 'sorteio muda com a semente');
});

test('resultado: pessoas simuladas recebem a paleta certa', () => {
  const plates = buildTest(7);
  assert.equal(classifyVision(plates, simulatedAnswers(plates, null)).mode, 'none');
  for (const [type, mode] of [['protan', 'red-green'], ['deutan', 'red-green'], ['tritan', 'blue-yellow']]) {
    const result = classifyVision(plates, simulatedAnswers(plates, type));
    assert.equal(result.mode, mode, type);
    assert.equal(result.types[0], type, `tipo principal ${type}`);
    assert.equal(result.severity, 'strong');
  }
  // daltonismo parcial (anomalia): erra só as pranchas sutis
  const mild = classifyVision(plates, simulatedAnswers(plates, 'deutan', 0.6));
  assert.equal(mild.mode, 'red-green');
  assert.equal(mild.severity, 'mild');
});

test('resultado: controle errado não conclui; um erro isolado numa prancha sutil não muda as cores; errar tudo vira "sem cores"', () => {
  const plates = buildTest(9);
  const all = Object.fromEntries(plates.map((p) => [p.id, p.digit]));
  assert.equal(classifyVision(plates, { ...all, [plates[0].id]: null }).valid, false);
  const weak = plates.find((p) => p.strength === 'weak');
  assert.equal(classifyVision(plates, { ...all, [weak.id]: null }).mode, 'none');
  const none = Object.fromEntries(plates.map((p) => [p.id, p.type === 'control' ? p.digit : null]));
  assert.equal(classifyVision(plates, none).mode, 'mono');
});

test('paletas: os três níveis continuam distintos para quem tem aquele daltonismo e têm contraste com o fundo', () => {
  const surface = { light: '#ffffff', dark: '#0f1729' };
  const cases = { 'red-green': ['protan', 'deutan'], 'blue-yellow': ['tritan'] };
  const minDistance = (colors, type) => {
    const [g, l, b] = colors.map((c) => simulate(c, type));
    return Math.min(deltaE(g, l), deltaE(g, b), deltaE(l, b));
  };
  for (const [mode, types] of Object.entries(cases)) {
    for (const theme of ['light', 'dark']) {
      const { good, limited, bad } = levelColors(mode, theme);
      for (const type of [null, ...types]) assert.ok(minDistance([good, limited, bad], type) > 30, `${mode}/${theme}/${type}`);
      for (const color of [good, limited, bad]) assert.ok(contrastRatio(color, surface[theme]) >= 3, `${mode}/${theme} contraste ${color}`);
      // textos de status (verde/âmbar/vermelho do tema) também ficam legíveis
      const tokens = VISION_PALETTES[mode][theme];
      for (const key of ['green', 'amber', 'red']) assert.ok(contrastRatio(tokens[key], surface[theme]) >= 4.4, `${mode}/${theme} texto ${key}`);
    }
  }
  // por que trocar: na paleta padrão, verde e vermelho quase se confundem na protanopia
  const standard = levelColors('none', 'light');
  assert.ok(deltaE(simulate(standard.good, 'protan'), simulate(standard.bad, 'protan')) < 15);
});

test('paletas: CSS só fora do padrão, e o nível também vira padrão de traço', () => {
  assert.equal(paletteCss('none'), '');
  const css = paletteCss('red-green');
  assert.match(css, /:root\[data-vision='red-green'\] \{[^}]*--level-good: #1d4ed8/);
  assert.match(css, /\[data-theme='dark'\]/);
  assert.equal(levelDash('none', 'bad'), null);
  assert.ok(levelDash('red-green', 'limited'));
  assert.notDeepEqual(levelDash('mono', 'limited'), levelDash('mono', 'bad'));
  assert.ok(levelDash('none', 'unknown'), 'não verificado é sempre tracejado');
});
