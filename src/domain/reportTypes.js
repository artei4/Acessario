/**
 * Tipos de relato. Cada tipo diz qual característica do perfil ele afeta (`weightKey`),
 * quanto pesa na nota, quanto tempo acrescenta e se pode impedir a passagem.
 */
export const OBSTACLE_TYPES = {
  buraco: { label: 'Buraco na calçada', short: 'Buraco', points: 10, delayMin: 1, weightKey: 'floor' },
  rampa_bloqueada: { label: 'Rampa bloqueada', short: 'Rampa bloqueada', points: 15, delayMin: 3, weightKey: 'ramps', blocks: ['cadeirante'] },
  calcada_estreita: { label: 'Calçada estreita', short: 'Calçada estreita', points: 12, delayMin: 1, weightKey: 'width' },
  // já medida no levantamento quando a inclinação do trecho é alta: não é contada duas vezes
  inclinacao: { label: 'Inclinação acentuada', short: 'Inclinação', points: 8, delayMin: 1, weightKey: 'slope', coveredBy: (segment) => segment.slopePct >= 6 },
  escadas: { label: 'Escadas', short: 'Escadas', points: 30, delayMin: 2, weightKey: 'stairs', blocks: ['cadeirante'] },
  obra: { label: 'Obra ou interdição', short: 'Obra', points: 12, delayMin: 3, weightKey: null },
  outro_obstaculo: { label: 'Outro obstáculo', short: 'Obstáculo', points: 5, delayMin: 1, weightKey: null },
};

export const FACILITATOR_TYPES = {
  rampa: { label: 'Rampa de acesso', short: 'Rampa', points: 8, weightKey: 'ramps' },
  calcada_larga: { label: 'Calçada larga', short: 'Calçada', points: 6, weightKey: 'width' },
  piso_regular: { label: 'Piso regular', short: 'Piso regular', points: 4, weightKey: 'floor' },
  travessia: { label: 'Travessia acessível', short: 'Travessia', points: 6, weightKey: null },
  piso_tatil: { label: 'Piso tátil', short: 'Piso tátil', points: 6, weightKey: 'tactile' },
  outro_facilitador: { label: 'Outro', short: 'Outro', points: 3, weightKey: null },
};

/**
 * Segurança: ocorrências (`risk`) e pontos que dão segurança (`safe`).
 * Descrevem o que aconteceu no lugar, nunca pessoas. Não entram na nota de acessibilidade:
 * formam o índice de segurança (domain/safety.js). `validDays` é quanto tempo o relato
 * continua valendo: o peso cai até zero nesse prazo, porque um assalto de meses atrás diz pouco sobre hoje.
 */
export const SAFETY_RISK_TYPES = {
  assalto: { label: 'Assalto ou roubo', short: 'Assalto', points: 12, validDays: 30 },
  tiroteio: { label: 'Tiroteio', short: 'Tiroteio', points: 20, validDays: 15 },
  rua_escura: { label: 'Rua escura ou sem iluminação', short: 'Rua escura', points: 6, validDays: 90 },
  local_deserto: { label: 'Local deserto', short: 'Deserto', points: 4, validDays: 60 },
  outro_risco: { label: 'Outro risco', short: 'Risco', points: 4, validDays: 30 },
};

export const SAFETY_OK_TYPES = {
  bem_iluminado: { label: 'Bem iluminado', short: 'Iluminado', points: 4, validDays: 90 },
  comercio_aberto: { label: 'Comércio aberto e movimento', short: 'Movimentado', points: 3, validDays: 60 },
  policiamento: { label: 'Policiamento ou segurança', short: 'Policiamento', points: 3, validDays: 30 },
};

/** Relato de acessibilidade (entra na nota) ou de segurança (entra no índice de segurança). */
export const isAccessibilityReport = (report) => report.kind === 'obstacle' || report.kind === 'facilitator';
export const isSafetyReport = (report) => report.kind === 'risk' || report.kind === 'safe';

const CATALOGS = { obstacle: OBSTACLE_TYPES, facilitator: FACILITATOR_TYPES, risk: SAFETY_RISK_TYPES, safe: SAFETY_OK_TYPES };

export function getReportType(report) {
  const catalog = CATALOGS[report.kind] ?? OBSTACLE_TYPES;
  return catalog[report.type] ?? { label: 'Relato', short: 'Relato', points: 0, delayMin: 0, weightKey: null };
}

export const OBSTACLE_OPTIONS = Object.entries(OBSTACLE_TYPES).map(([value, t]) => ({ value, label: t.label }));
export const FACILITATOR_OPTIONS = Object.entries(FACILITATOR_TYPES).map(([value, t]) => ({ value, label: t.label }));
export const SAFETY_RISK_OPTIONS = Object.entries(SAFETY_RISK_TYPES).map(([value, t]) => ({ value, label: t.label, kind: 'risk' }));
export const SAFETY_OK_OPTIONS = Object.entries(SAFETY_OK_TYPES).map(([value, t]) => ({ value, label: t.label, kind: 'safe' }));
