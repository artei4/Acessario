/**
 * Dados fictícios de demonstração.
 *
 * As datas são relativas ao momento em que o banco é gerado, para que textos como
 * "última verificação há 5 dias" ou "possivelmente desatualizado" continuem coerentes
 * em qualquer dia em que o projeto for executado.
 */

const DAY = 24 * 60 * 60 * 1000;

const places = [
  {
    id: 'p-siqueira',
    name: 'Rua Siqueira Campos',
    neighborhood: 'Copacabana',
    lat: -22.9662,
    lon: -43.1868,
  },
  {
    id: 'p-riosul',
    name: 'Shopping Rio Sul',
    neighborhood: 'Botafogo',
    lat: -22.9566,
    lon: -43.1768,
  },
  {
    id: 'p-arcoverde',
    name: 'Metrô Cardeal Arcoverde',
    neighborhood: 'Copacabana',
    lat: -22.9643,
    lon: -43.1803,
  },
];

/** Rotas cadastradas entre dois lugares. Uma rota vale nos dois sentidos. */
const routes = [
  {
    id: 'r1',
    name: 'Rota 1',
    via: 'Av. Princesa Isabel e Túnel Novo',
    originId: 'p-siqueira',
    destinationId: 'p-riosul',
    distanceKm: 1.8,
    baseMinutes: 25,
  },
  {
    id: 'r2',
    name: 'Rota 2',
    via: 'Túnel Velho e Rua Real Grandeza',
    originId: 'p-siqueira',
    destinationId: 'p-riosul',
    distanceKm: 1.2,
    baseMinutes: 19,
  },
  {
    id: 'r3',
    name: 'Rota 3',
    via: 'Rua Barata Ribeiro e Rua Lauro Müller',
    originId: 'p-siqueira',
    destinationId: 'p-riosul',
    distanceKm: 1.5,
    baseMinutes: 22,
  },
];

/**
 * Trechos das rotas. Os atributos (largura, inclinação, escadas, rampas, piso)
 * representam o levantamento base — feito por câmeras e visão computacional —
 * e `surveyedDaysAgo` é a última verificação desse levantamento (null = nunca).
 */
const segmentDefs = [
  // Rota 1
  { id: 'r1-t01', routeId: 'r1', order: 1, street: 'Rua Siqueira Campos', lengthM: 380, widthM: 1.8, slopePct: 1, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: [], surveyedDaysAgo: 5, path: [[-22.9662, -43.1868], [-22.9655, -43.1838]] },
  { id: 'r1-t02', routeId: 'r1', order: 2, street: 'Av. N. S. de Copacabana', lengthM: 420, widthM: 2.2, slopePct: 0, hasStairs: false, hasRamps: true, floor: 'regular', tactile: true, supportPoints: ['Banco'], surveyedDaysAgo: 5, path: [[-22.9655, -43.1838], [-22.9640, -43.1800]] },
  { id: 'r1-t03', routeId: 'r1', order: 3, street: 'Av. Princesa Isabel', lengthM: 450, widthM: 2.0, slopePct: 1, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: ['Farmácia'], surveyedDaysAgo: 5, path: [[-22.9640, -43.1800], [-22.9612, -43.1762]] },
  { id: 'r1-t04', routeId: 'r1', order: 4, street: 'Acesso ao Túnel Novo', lengthM: 42, widthM: 1.4, slopePct: 8, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: [], surveyedDaysAgo: 5, path: [[-22.9612, -43.1762], [-22.9603, -43.1758]] },
  { id: 'r1-t05', routeId: 'r1', order: 5, street: 'Túnel Novo e Av. Lauro Sodré', lengthM: 508, widthM: 1.6, slopePct: 2, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: [], surveyedDaysAgo: 5, path: [[-22.9603, -43.1758], [-22.9580, -43.1757], [-22.9566, -43.1768]] },
  // Rota 2
  { id: 'r2-t01', routeId: 'r2', order: 1, street: 'Rua Siqueira Campos (subida)', lengthM: 300, widthM: 1.5, slopePct: 3, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: ['Farmácia'], surveyedDaysAgo: 12, path: [[-22.9662, -43.1868], [-22.9630, -43.1856]] },
  { id: 'r2-t02', routeId: 'r2', order: 2, street: 'Túnel Velho', lengthM: 290, widthM: 1.1, slopePct: 4, hasStairs: false, hasRamps: false, floor: 'irregular', tactile: false, supportPoints: [], surveyedDaysAgo: 12, path: [[-22.9630, -43.1856], [-22.9598, -43.1857]] },
  { id: 'r2-t03', routeId: 'r2', order: 3, street: 'Rua Real Grandeza', lengthM: 380, widthM: 1.3, slopePct: 8, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: ['Banco'], surveyedDaysAgo: 30, path: [[-22.9598, -43.1857], [-22.9578, -43.1820]] },
  { id: 'r2-t04', routeId: 'r2', order: 4, street: 'Rua Voluntários da Pátria', lengthM: 230, widthM: 1.8, slopePct: 2, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: [], surveyedDaysAgo: 30, path: [[-22.9578, -43.1820], [-22.9566, -43.1768]] },
  // Rota 3
  { id: 'r3-t01', routeId: 'r3', order: 1, street: 'Rua Barata Ribeiro', lengthM: 500, widthM: 1.6, slopePct: 2, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: [], surveyedDaysAgo: null, path: [[-22.9662, -43.1868], [-22.9628, -43.1822]] },
  { id: 'r3-t02', routeId: 'r3', order: 2, street: 'Rua Lauro Müller (desvio de obra)', lengthM: 600, widthM: 1.2, slopePct: 5, hasStairs: false, hasRamps: false, floor: 'irregular', tactile: false, supportPoints: [], surveyedDaysAgo: null, path: [[-22.9628, -43.1822], [-22.9592, -43.1795]] },
  { id: 'r3-t03', routeId: 'r3', order: 3, street: 'Acesso ao Rio Sul', lengthM: 400, widthM: 1.8, slopePct: 1, hasStairs: false, hasRamps: true, floor: 'regular', tactile: false, supportPoints: [], surveyedDaysAgo: 60, path: [[-22.9592, -43.1795], [-22.9566, -43.1768]] },
];

/** Relatos e quantos votos cada um recebeu (confirmam / contestam / dizem que foi resolvido). */
const reportDefs = [
  { id: 'rep-001', segmentId: 'r1-t04', type: 'inclinacao', kind: 'obstacle', description: 'Rampa de acesso ao túnel é bem íngreme.', daysAgo: 5, userId: 'u-v01', votes: { confirm: 12 } },
  { id: 'rep-002', segmentId: 'r1-t04', type: 'buraco', kind: 'obstacle', description: 'Buraco perto da guia rebaixada, lado direito.', daysAgo: 2, userId: 'u-v02', votes: { confirm: 3, incorrect: 1 } },
  { id: 'rep-003', segmentId: 'r1-t04', type: 'piso_regular', kind: 'facilitator', description: 'Piso novo no começo do trecho.', daysAgo: 1, userId: 'u-v03', votes: {} },
  { id: 'rep-004', segmentId: 'r1-t05', type: 'obra', kind: 'obstacle', description: 'Obra parcial na calçada do lado do túnel.', daysAgo: 47, userId: 'u-v04', votes: {} },
  { id: 'rep-005', segmentId: 'r2-t02', type: 'buraco', kind: 'obstacle', description: 'Buraco grande no passeio dentro do túnel.', daysAgo: 1, userId: 'u-v05', votes: { confirm: 3 } },
  { id: 'rep-006', segmentId: 'r2-t02', type: 'calcada_estreita', kind: 'obstacle', description: 'Passeio do túnel muito estreito para cadeira de rodas.', daysAgo: 1, userId: 'u-v06', votes: {} },
  { id: 'rep-007', segmentId: 'r3-t02', type: 'obra', kind: 'obstacle', description: 'Obra com desvio de cerca de 180 m.', daysAgo: 47, userId: 'u-v07', votes: { confirm: 1 } },
  // Relatos do usuário José
  { id: 'rep-101', segmentId: 'r3-t01', type: 'buraco', kind: 'obstacle', description: 'Buraco na esquina com a Rua Siqueira Campos.', daysAgo: 20, userId: 'u-jose', votes: { confirm: 5 } },
  { id: 'rep-102', segmentId: 'r2-t02', type: 'rampa', kind: 'facilitator', description: 'Rampa de acesso nova na saída do túnel.', daysAgo: 3, userId: 'u-jose', votes: { confirm: 2 } },
  { id: 'rep-103', segmentId: 'r1-t02', type: 'calcada_larga', kind: 'facilitator', description: 'Calçada larga e sem obstáculos.', daysAgo: 1, userId: 'u-jose', votes: {} },
];

const voterIds = Array.from({ length: 15 }, (_, i) => `u-v${String(i + 1).padStart(2, '0')}`);

export function buildSeed(now = new Date()) {
  const t = now.getTime();
  const iso = (daysAgo, minutesOffset = 0) => new Date(t - daysAgo * DAY + minutesOffset * 60000).toISOString();

  const users = [
    {
      id: 'u-jose',
      name: 'José',
      profile: null,
      preferences: { avoidStairs: true, preferFlat: true, includeSupportPoints: true },
      createdAt: iso(90),
    },
    ...voterIds.map((id, i) => ({
      id,
      name: `Colaborador ${i + 1}`,
      profile: ['cadeirante', 'mobilidade_reduzida', 'deficiencia_visual', 'idoso'][i % 4],
      preferences: { avoidStairs: true, preferFlat: false, includeSupportPoints: true },
      createdAt: iso(120),
    })),
  ];

  const segments = segmentDefs.map(({ surveyedDaysAgo, ...segment }) => ({
    ...segment,
    surveyedAt: surveyedDaysAgo === null ? null : iso(surveyedDaysAgo),
  }));

  const reports = [];
  const votes = [];
  let voteSeq = 1;

  for (const { daysAgo, votes: counts, ...report } of reportDefs) {
    reports.push({ ...report, photo: null, location: null, createdAt: iso(daysAgo) });

    const pool = voterIds.filter((id) => id !== report.userId);
    let cursor = 0;
    for (const [type, amount] of Object.entries(counts)) {
      for (let i = 0; i < amount; i += 1) {
        votes.push({
          id: `vot-${String(voteSeq++).padStart(3, '0')}`,
          reportId: report.id,
          userId: pool[cursor++ % pool.length],
          type,
          // votos chegam algumas horas depois do relato, sem passar de "agora"
          createdAt: iso(daysAgo, Math.min(daysAgo * 24 * 60 - 1, 60 * (i + 1))),
        });
      }
    }
  }

  const searches = [
    { id: 'src-001', userId: 'u-jose', originId: 'p-siqueira', destinationId: 'p-riosul', createdAt: iso(2) },
    { id: 'src-002', userId: 'u-jose', originId: 'p-riosul', destinationId: 'p-siqueira', createdAt: iso(4) },
  ];

  return { users, places, routes, segments, reports, votes, searches };
}
