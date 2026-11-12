/**
 * Visão de cores: simulação de daltonismo, geração das pranchas do teste e classificação do resultado.
 *
 * Tudo aqui é matemática pura (sem tela), por isso pode ser testado.
 *
 * Como as pranchas funcionam
 * --------------------------
 * Cada prancha é um círculo de bolinhas. As bolinhas do número usam uma cor e as do fundo outra.
 * As duas cores diferem só numa direção que um tipo de daltonismo NÃO enxerga
 * (a "linha de confusão" daquele tipo). Assim:
 *  - quem tem visão de cores típica vê o número;
 *  - quem tem aquele tipo de daltonismo vê as bolinhas todas iguais.
 * A direção vem do próprio modelo de simulação (Machado, Oliveira e Fernandes, 2009):
 * é o vetor que a matriz do tipo "apaga". O brilho de cada bolinha varia ao acaso,
 * para que o número não apareça por diferença de claro/escuro.
 *
 * Isto é uma triagem, não um diagnóstico: a cor da tela, o brilho e a luz do ambiente interferem.
 */

// ---------------------------------------------------------------------------
// Cores: sRGB <-> linear <-> CIELAB

export function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(v) {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex(rgb) {
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const toLinear = (hex) => hexToRgb(hex).map(srgbToLinear);
const fromLinear = (lin) => rgbToHex(lin.map(linearToSrgb));

const mul = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

/** Luminância relativa (WCAG). */
export function luminance(hex) {
  const [r, g, b] = toLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre duas cores (1 a 21). */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function linearToLab(lin) {
  const xyz = mul(
    [
      [0.4124, 0.3576, 0.1805],
      [0.2126, 0.7152, 0.0722],
      [0.0193, 0.1192, 0.9505],
    ],
    lin,
  );
  const white = [0.95047, 1, 1.08883];
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const [fx, fy, fz] = xyz.map((v, i) => f(v / white[i]));
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Diferença de cor percebida (ΔE CIE76): ~2 mal se nota, ~10 é clara, 40+ é muito diferente. */
export function deltaE(a, b) {
  const [l1, a1, b1] = linearToLab(typeof a === 'string' ? toLinear(a) : a);
  const [l2, a2, b2] = linearToLab(typeof b === 'string' ? toLinear(b) : b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

// ---------------------------------------------------------------------------
// Simulação em RGB linear.
// Protan e deutan: matrizes de Machado, Oliveira e Fernandes (2009), gravidade máxima.
// Tritan: projeção nos cones (Viénot/Brettel): o cone S é refeito a partir de L e M,
// mantendo o branco e o vermelho como estão.

const RGB_TO_LMS = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
];

function invert3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

const matMul = (x, y) => x.map((row) => y[0].map((_, j) => row.reduce((sum, v, k) => sum + v * y[k][j], 0)));

function tritanMatrix() {
  const white = mul(RGB_TO_LMS, [1, 1, 1]);
  const red = mul(RGB_TO_LMS, [1, 0, 0]);
  // S = a·L + b·M passando pelo branco e pelo vermelho
  const det = white[0] * red[1] - white[1] * red[0];
  const a = (white[2] * red[1] - white[1] * red[2]) / det;
  const b = (white[0] * red[2] - white[2] * red[0]) / det;
  const project = [
    [1, 0, 0],
    [0, 1, 0],
    [a, b, 0],
  ];
  return matMul(invert3(RGB_TO_LMS), matMul(project, RGB_TO_LMS));
}

export const DEFICIENCIES = ['protan', 'deutan', 'tritan'];

const SIMULATION = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: tritanMatrix(),
};

const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** Matriz de simulação com gravidade de 0 (visão típica) a 1 (dicromacia). */
function simulationMatrix(type, severity = 1) {
  const full = SIMULATION[type];
  return full.map((row, i) => row.map((v, j) => IDENTITY[i][j] + (v - IDENTITY[i][j]) * severity));
}

/** Como uma cor aparece para quem tem o tipo de daltonismo indicado. */
export function simulate(hex, type, severity = 1) {
  if (!type || type === 'none') return hex;
  return fromLinear(mul(simulationMatrix(type, severity), toLinear(hex)));
}

/** Direção de cor que o tipo não enxerga: vetor que a matriz de simulação leva a ~zero. */
export function confusionAxis(type) {
  const [r0, r1] = SIMULATION[type];
  // produto vetorial de duas linhas = vetor perpendicular a ambas (núcleo da matriz de posto ~2)
  const v = [r0[1] * r1[2] - r0[2] * r1[1], r0[2] * r1[0] - r0[0] * r1[2], r0[0] * r1[1] - r0[1] * r1[0]];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

// ---------------------------------------------------------------------------
// Pranchas do teste

/** Gerador pseudoaleatório com semente: a mesma semente gera a mesma prancha. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Desenho de cada número como traços (caixa de 0 a 1, y para baixo). */
const DIGIT_STROKES = {
  0: [[[0.5, 0.05], [0.8, 0.2], [0.85, 0.5], [0.8, 0.8], [0.5, 0.95], [0.2, 0.8], [0.15, 0.5], [0.2, 0.2], [0.5, 0.05]]],
  1: [[[0.3, 0.25], [0.55, 0.05], [0.55, 0.95]]],
  2: [[[0.18, 0.25], [0.35, 0.07], [0.65, 0.07], [0.82, 0.25], [0.78, 0.45], [0.18, 0.93], [0.85, 0.93]]],
  3: [[[0.18, 0.12], [0.75, 0.12], [0.45, 0.45], [0.75, 0.55], [0.82, 0.75], [0.6, 0.93], [0.18, 0.88]]],
  4: [[[0.65, 0.95], [0.65, 0.05], [0.15, 0.68], [0.88, 0.68]]],
  5: [[[0.82, 0.07], [0.25, 0.07], [0.2, 0.45], [0.6, 0.4], [0.82, 0.6], [0.75, 0.85], [0.5, 0.95], [0.18, 0.85]]],
  6: [[[0.75, 0.07], [0.4, 0.2], [0.2, 0.55], [0.25, 0.85], [0.5, 0.95], [0.78, 0.82], [0.78, 0.6], [0.5, 0.47], [0.22, 0.58]]],
  7: [[[0.15, 0.07], [0.85, 0.07], [0.4, 0.95]]],
  8: [
    [[0.5, 0.48], [0.25, 0.32], [0.3, 0.1], [0.5, 0.05], [0.7, 0.1], [0.75, 0.32], [0.5, 0.48], [0.2, 0.68], [0.28, 0.9], [0.5, 0.95], [0.72, 0.9], [0.8, 0.68], [0.5, 0.48]],
  ],
  9: [[[0.78, 0.42], [0.5, 0.53], [0.22, 0.4], [0.25, 0.15], [0.5, 0.05], [0.75, 0.15], [0.78, 0.42], [0.72, 0.75], [0.5, 0.95], [0.25, 0.92]]],
};

export const DIGITS = Object.keys(DIGIT_STROKES).map(Number);

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** O ponto (coordenadas do círculo, de -1 a 1) fica sobre o traço do número? */
export function insideDigit(digit, x, y, thickness = 0.11) {
  // o número ocupa a área central do círculo
  const u = (x + 0.62) / 1.24;
  const v = (y + 0.7) / 1.4;
  if (u < -0.1 || u > 1.1 || v < -0.1 || v > 1.1) return false;
  return DIGIT_STROKES[digit].some((line) =>
    line.slice(1).some((point, i) => distanceToSegment(u, v, line[i], point) < thickness),
  );
}

/**
 * Bolinhas de uma prancha: [{ x, y, r, figure }] num círculo de raio 1.
 * Bolinhas de tamanhos variados, sem se sobrepor (como nas pranchas impressas).
 */
export function plateLayout(digit, seed, { attempts = 5000 } = {}) {
  const random = seededRandom(seed);
  const dots = [];
  const cell = 0.1;
  const grid = new Map();
  const key = (gx, gy) => `${gx},${gy}`;
  for (let i = 0; i < attempts; i++) {
    const r = 0.016 + random() * 0.034;
    const angle = random() * Math.PI * 2;
    const dist = Math.sqrt(random()) * (1 - r);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    let free = true;
    for (let ox = -1; ox <= 1 && free; ox++) {
      for (let oy = -1; oy <= 1 && free; oy++) {
        for (const d of grid.get(key(gx + ox, gy + oy)) ?? []) {
          if (Math.hypot(d.x - x, d.y - y) < d.r + r + 0.008) {
            free = false;
            break;
          }
        }
      }
    }
    if (!free) continue;
    const dot = { x, y, r, figure: insideDigit(digit, x, y) };
    dots.push(dot);
    const list = grid.get(key(gx, gy)) ?? [];
    list.push(dot);
    grid.set(key(gx, gy), list);
  }
  return dots;
}

/** Cor base das pranchas (cinza quente) e variação de brilho de cada bolinha. */
const PLATE_BASE = [0.2, 0.18, 0.15];
const BRIGHTNESS_JITTER = [0.72, 1.18];

/**
 * Intensidade da diferença de cor: "strong" é quase o máximo que a tela mostra; "weak" é sutil.
 * A prancha sutil de azul-amarelo é mais forte porque o olho percebe pior essa diferença em pontos pequenos.
 */
export const PLATE_STRENGTH = { strong: 1, weak: 0.26 };
const WEAK_BY_TYPE = { protan: 0.26, deutan: 0.26, tritan: 0.45 };

/** Maior passo na direção `axis` que mantém fundo e número dentro das cores da tela. */
function maxStep(axis) {
  const top = 1 / BRIGHTNESS_JITTER[1];
  let k = Infinity;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(axis[i]) < 1e-9) continue;
    k = Math.min(k, (top - PLATE_BASE[i]) / Math.abs(axis[i]), PLATE_BASE[i] / Math.abs(axis[i]));
  }
  return k * 0.95;
}

/**
 * Duas cores (RGB linear) para o número e o fundo de uma prancha.
 * - `type` protan, deutan ou tritan: diferença que aquele tipo não percebe;
 * - `type` 'control': diferença de claro/escuro que todos percebem.
 */
export function plateColors(type, strength = 'strong') {
  if (type === 'control') {
    return { figure: PLATE_BASE.map((v) => v * 0.42), background: PLATE_BASE.map((v) => v * 1.25) };
  }
  const axis = confusionAxis(type);
  const k = maxStep(axis) * (strength === 'weak' ? WEAK_BY_TYPE[type] : PLATE_STRENGTH.strong);
  return {
    figure: PLATE_BASE.map((v, i) => v + k * axis[i]),
    background: PLATE_BASE.map((v, i) => v - k * axis[i]),
  };
}

/** Pinta as bolinhas: cor do número ou do fundo, com brilho variando ao acaso. */
export function paintPlate(dots, colors, seed) {
  const random = seededRandom(seed ^ 0x9e3779b9);
  const [lo, hi] = BRIGHTNESS_JITTER;
  return dots.map((dot) => {
    const base = dot.figure ? colors.figure : colors.background;
    const factor = lo + random() * (hi - lo);
    return { ...dot, color: fromLinear(base.map((v) => v * factor)) };
  });
}

/**
 * Sequência do teste: 1 prancha de controle (todos veem) e, para cada tipo,
 * 1 prancha forte e 2 sutis, em ordem embaralhada.
 */
export function buildTest(seed = Date.now()) {
  const random = seededRandom(seed);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const plates = [{ type: 'control', strength: 'strong' }];
  const rest = [];
  for (const type of DEFICIENCIES) {
    rest.push({ type, strength: 'strong' }, { type, strength: 'weak' }, { type, strength: 'weak' });
  }
  // embaralha (Fisher-Yates)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  plates.push(...rest);
  let previous = null;
  return plates.map((plate, index) => {
    let digit;
    do digit = pick(DIGITS.filter((d) => d !== 1)); // o 1 é fino demais para ler entre as bolinhas
    while (digit === previous);
    previous = digit;
    const options = [digit];
    while (options.length < 4) {
      const d = pick(DIGITS);
      if (!options.includes(d)) options.push(d);
    }
    options.sort((a, b) => a - b);
    return { id: `p${index}`, ...plate, digit, options, seed: Math.floor(random() * 2 ** 31) };
  });
}

// ---------------------------------------------------------------------------
// Resultado

export const VISION_MODES = {
  none: { id: 'none', label: 'Cores padrão', short: 'Padrão' },
  'red-green': { id: 'red-green', label: 'Vermelho e verde (protanopia ou deuteranopia)', short: 'Vermelho-verde' },
  'blue-yellow': { id: 'blue-yellow', label: 'Azul e amarelo (tritanopia)', short: 'Azul-amarelo' },
  mono: { id: 'mono', label: 'Poucas ou nenhuma cor (acromatopsia)', short: 'Sem cores' },
};

const TYPE_NAMES = {
  protan: 'protan (dificuldade com o vermelho)',
  deutan: 'deutan (dificuldade com o verde)',
  tritan: 'tritan (dificuldade com azul e amarelo)',
};

/**
 * Lê as respostas e sugere como adaptar as cores.
 * @param {object[]} plates   pranchas de buildTest
 * @param {object}   answers  { [plateId]: número escolhido | null (não vi) }
 * @returns {{ valid, mode, types, severity, scores, summary }}
 */
export function classifyVision(plates, answers) {
  const control = plates.find((p) => p.type === 'control');
  if (control && answers[control.id] !== control.digit) {
    return {
      valid: false,
      mode: null,
      types: [],
      severity: null,
      scores: {},
      summary: 'Não deu para concluir: a prancha de controle, que todo mundo vê, não foi acertada. Tente de novo com a tela mais clara.',
    };
  }
  const scores = Object.fromEntries(DEFICIENCIES.map((t) => [t, 0]));
  const strongMissed = new Set();
  for (const plate of plates) {
    if (plate.type === 'control') continue;
    if (answers[plate.id] === plate.digit) continue;
    scores[plate.type] += plate.strength === 'strong' ? 2 : 1;
    if (plate.strength === 'strong') strongMissed.add(plate.type);
  }
  // 2 pontos = errou a prancha forte, ou as duas sutis do mesmo tipo
  const types = DEFICIENCIES.filter((t) => scores[t] >= 2).sort((a, b) => scores[b] - scores[a]);
  if (types.length === 0) {
    return {
      valid: true,
      mode: 'none',
      types: [],
      severity: null,
      scores,
      summary: 'Você viu os números das pranchas. Não encontramos dificuldade para distinguir as cores do app.',
    };
  }
  const severity = types.some((t) => strongMissed.has(t)) ? 'strong' : 'mild';
  const redGreen = types.filter((t) => t !== 'tritan');
  // errou muito de todos os tipos: pouca percepção de cor em geral
  const mode =
    types.length === 3 && severity === 'strong' ? 'mono' : redGreen.length > 0 && scores[redGreen[0]] >= scores.tritan ? 'red-green' : 'blue-yellow';
  const main = types[0];
  const summary =
    mode === 'mono'
      ? 'Você teve dificuldade em todas as pranchas coloridas. Vamos deixar o app sem depender de cores, com contraste alto.'
      : `As respostas indicam daltonismo ${severity === 'strong' ? '' : 'leve '}do tipo ${TYPE_NAMES[main]}. Vamos trocar as cores do app para combinações que você distingue.`;
  return { valid: true, mode, types, severity, scores, summary };
}
