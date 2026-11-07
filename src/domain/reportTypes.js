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

export function getReportType(report) {
  const catalog = report.kind === 'facilitator' ? FACILITATOR_TYPES : OBSTACLE_TYPES;
  return catalog[report.type] ?? { label: 'Relato', short: 'Relato', points: 0, delayMin: 0, weightKey: null };
}

export const OBSTACLE_OPTIONS = Object.entries(OBSTACLE_TYPES).map(([value, t]) => ({ value, label: t.label }));
export const FACILITATOR_OPTIONS = Object.entries(FACILITATOR_TYPES).map(([value, t]) => ({ value, label: t.label }));
