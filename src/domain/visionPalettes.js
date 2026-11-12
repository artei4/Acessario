/**
 * Paletas para cada tipo de visão de cores.
 *
 * Os valores substituem as variáveis CSS de status (verde = bom, âmbar = atenção, vermelho = ruim)
 * e as cores dos trechos no mapa. Foram escolhidos por cálculo (ver tests/colorVision.test.js):
 * as três cores de nível continuam bem diferentes na simulação do tipo de daltonismo
 * e mantêm contraste com o fundo.
 */
export const LEVELS = ['good', 'limited', 'bad', 'unknown'];

const DEFAULT = {
  light: {
    green: '#15803d', 'green-50': '#e7f6ec',
    amber: '#b45309', 'amber-500': '#d97706', 'amber-50': '#fef3c7',
    red: '#b91c1c', 'red-500': '#dc2626', 'red-50': '#fdecec',
    'level-good': '#15803d', 'level-limited': '#d97706', 'level-bad': '#dc2626', 'level-unknown': '#94a3b8',
    'toast-ok': '#15803d', 'toast-bad': '#b91c1c',
  },
  dark: {
    green: '#4ade80', 'green-50': '#10291b',
    amber: '#fbbf24', 'amber-500': '#f59e0b', 'amber-50': '#2c220b',
    red: '#f87171', 'red-500': '#ef4444', 'red-50': '#2f1515',
    'level-good': '#15803d', 'level-limited': '#d97706', 'level-bad': '#dc2626', 'level-unknown': '#94a3b8',
    'toast-ok': '#15803d', 'toast-bad': '#b91c1c',
  },
};

export const VISION_PALETTES = {
  none: DEFAULT,
  // protanopia e deuteranopia: azul no lugar do verde e vinho no lugar do vermelho
  'red-green': {
    light: {
      green: '#1d4ed8', 'green-50': '#e8efff',
      amber: '#b45309', 'amber-500': '#d97706', 'amber-50': '#fef3c7',
      red: '#9d174d', 'red-500': '#be185d', 'red-50': '#fce7f3',
      'level-good': '#1d4ed8', 'level-limited': '#d97706', 'level-bad': '#9d174d', 'level-unknown': '#94a3b8',
      'toast-ok': '#1d4ed8', 'toast-bad': '#9d174d',
    },
    dark: {
      green: '#2dd4bf', 'green-50': '#0d2e2a',
      amber: '#fbbf24', 'amber-500': '#f59e0b', 'amber-50': '#2c220b',
      red: '#c084fc', 'red-500': '#a855f7', 'red-50': '#26153a',
      'level-good': '#2dd4bf', 'level-limited': '#f59e0b', 'level-bad': '#a855f7', 'level-unknown': '#94a3b8',
      'toast-ok': '#1d4ed8', 'toast-bad': '#9d174d',
    },
  },
  // tritanopia: verde-azulado no lugar do verde; laranja e vermelho continuam distintos
  'blue-yellow': {
    light: {
      green: '#0f766e', 'green-50': '#e0f2f1',
      amber: '#b45309', 'amber-500': '#c47900', 'amber-50': '#fef3c7',
      red: '#b91c1c', 'red-500': '#dc2626', 'red-50': '#fdecec',
      'level-good': '#0f766e', 'level-limited': '#c47900', 'level-bad': '#dc2626', 'level-unknown': '#94a3b8',
      'toast-ok': '#0f766e', 'toast-bad': '#b91c1c',
    },
    dark: {
      green: '#5eead4', 'green-50': '#0d2e2a',
      amber: '#fbbf24', 'amber-500': '#f59e0b', 'amber-50': '#2c220b',
      red: '#f87171', 'red-500': '#ef4444', 'red-50': '#2f1515',
      'level-good': '#38bdf8', 'level-limited': '#fbbf24', 'level-bad': '#f87171', 'level-unknown': '#94a3b8',
      'toast-ok': '#0f766e', 'toast-bad': '#b91c1c',
    },
  },
  // pouca ou nenhuma cor: a diferença vem do claro/escuro e dos padrões das linhas
  mono: {
    light: {
      green: '#1f2937', 'green-50': '#f1f5f9',
      amber: '#374151', 'amber-500': '#6b7280', 'amber-50': '#f1f5f9',
      red: '#000000', 'red-500': '#111827', 'red-50': '#e5e7eb',
      'level-good': '#1f2937', 'level-limited': '#6b7280', 'level-bad': '#000000', 'level-unknown': '#9ca3af',
      'toast-ok': '#1f2937', 'toast-bad': '#000000',
    },
    dark: {
      green: '#f3f4f6', 'green-50': '#1f2937',
      amber: '#d1d5db', 'amber-500': '#9ca3af', 'amber-50': '#1f2937',
      red: '#ffffff', 'red-500': '#ffffff', 'red-50': '#374151',
      'level-good': '#e5e7eb', 'level-limited': '#9ca3af', 'level-bad': '#ffffff', 'level-unknown': '#6b7280',
      'toast-ok': '#1f2937', 'toast-bad': '#000000',
    },
  },
};

/** Cores dos níveis de acessibilidade no mapa para o modo e o tema. */
export function levelColors(mode = 'none', theme = 'light') {
  const palette = (VISION_PALETTES[mode] ?? DEFAULT)[theme === 'dark' ? 'dark' : 'light'];
  return Object.fromEntries(LEVELS.map((level) => [level, palette[`level-${level}`]]));
}

/**
 * Padrão de traço de cada nível (multiplicado pela espessura da linha).
 * Fora do modo padrão, o nível também aparece no desenho da linha, não só na cor.
 */
export function levelDash(mode, level) {
  if (level === 'unknown') return [1.5, 1.5];
  if (!mode || mode === 'none') return null;
  return { good: null, limited: [3, 1.6], bad: [0.1, 1.8] }[level] ?? null;
}

const declarations = (tokens) =>
  Object.entries(tokens)
    .map(([name, value]) => `--${name}: ${value};`)
    .join(' ');

/**
 * CSS que aplica a paleta, respeitando o tema claro/escuro do app.
 * O seletor [data-vision] vence as regras de tema do index.css (mesma lógica de especificidade).
 */
export function paletteCss(mode) {
  const palette = VISION_PALETTES[mode];
  if (!palette || mode === 'none') return '';
  const root = `:root[data-vision='${mode}']`;
  return [
    `${root} { ${declarations(palette.light)} }`,
    `@media (prefers-color-scheme: dark) { ${root}:not([data-theme='light']) { ${declarations(palette.dark)} } }`,
    `${root}[data-theme='dark'] { ${declarations(palette.dark)} }`,
  ].join('\n');
}
