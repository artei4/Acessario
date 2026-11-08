/**
 * Regras de negócio: nota de acessibilidade (0–100), tempo estimado e recomendação de rotas.
 *
 * Funções puras: recebem dados já carregados e devolvem avaliações. Não sabem nada de React
 * nem da API, o que permite testá-las isoladamente (ver tests/).
 */
import { getProfile } from './profiles.js';
import { getReportType } from './reportTypes.js';

const DAY = 24 * 60 * 60 * 1000;

export const BASE_SCORE = 65;
/** Peso do pior trecho na nota da rota: um trecho ruim compromete o caminho inteiro. */
export const BOTTLENECK_WEIGHT = 0.15;
/** Fração mínima do comprimento com dados verificados para a rota receber nota. */
export const MIN_VERIFIED_SHARE = 0.5;
/** Levantamentos mais antigos que isso não contam como verificados. */
export const SURVEY_VALID_DAYS = 180;
export const ATTENTION_BELOW = 75;

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const round = (n) => Math.round(n);

function weightFor(profile, key) {
  return key ? profile.weights[key] ?? 1 : 1;
}

export function segmentCode(segment) {
  return `Trecho ${String(segment.order).padStart(2, '0')}`;
}

/** Pontos vindos do levantamento base do trecho (atributos físicos). */
export function attributeBreakdown(segment, profile, preferences = {}) {
  const w = profile.weights;
  const slopeWeight = w.slope * (preferences.preferFlat ? 1.5 : 1);
  const items = [];
  const add = (label, points) => {
    const value = round(points);
    if (value !== 0) items.push({ label, points: value, source: 'levantamento' });
  };

  if (segment.hasStairs) add('Escadas', -45 * w.stairs);
  else add('Sem escadas', 8 * w.stairs);

  if (segment.hasRamps) add('Rampa adequada', 10 * w.ramps);
  else add('Sem rampa', -6 * w.ramps);

  if (segment.widthM >= 1.4) add('Calçada larga', 6 * w.width);
  else if (segment.widthM < 1.2) add('Calçada estreita', -15 * w.width);

  if (segment.floor === 'regular') add('Piso regular', 4 * w.floor);
  else add('Piso irregular', -8 * w.floor);

  if (segment.tactile) add('Piso tátil', 10 * w.tactile);
  else add('Sem piso tátil', -5 * w.tactile);

  const excessSlope = Math.max(0, segment.slopePct - 2);
  add(`Inclinação ${segment.slopePct}%`, -excessSlope * 1.5 * slopeWeight);

  return items;
}

/** Efeito de cada relato ativo, ponderado pela confiabilidade (status) e pelo perfil. */
export function reportEffect(report, segment, profile) {
  const type = getReportType(report);
  if (!report.active) return { points: 0, delayMin: 0, blocks: false };
  if (type.coveredBy?.(segment)) return { points: 0, delayMin: 0, blocks: false };

  const sign = report.kind === 'facilitator' ? 1 : -1;
  const points = sign * type.points * weightFor(profile, type.weightKey) * report.weight;
  const trusted = report.weight >= 0.5;
  return {
    points,
    delayMin: report.kind === 'obstacle' && trusted ? type.delayMin ?? 0 : 0,
    blocks: report.kind === 'obstacle' && trusted && (type.blocks ?? []).includes(profile.id),
  };
}

function isSurveyValid(segment, now) {
  if (!segment.surveyedAt) return false;
  return now.getTime() - new Date(segment.surveyedAt).getTime() <= SURVEY_VALID_DAYS * DAY;
}

/**
 * Avalia um trecho para um perfil.
 * @param {object}   segment
 * @param {object[]} reports  relatos do trecho já descritos (ver describeReports)
 * @param {object}   context  { profileId, preferences, now }
 */
export function evaluateSegment(segment, reports, { profileId, preferences = {}, now = new Date() } = {}) {
  const profile = getProfile(profileId);
  const attributes = attributeBreakdown(segment, profile, preferences);
  const baseScore = clamp(BASE_SCORE + attributes.reduce((sum, i) => sum + i.points, 0));

  const reportItems = [];
  let delayMin = 0;
  const delayReasons = new Set();
  const blockReasons = [];

  if (segment.slopePct >= 6) {
    delayMin += round((segment.slopePct - 5) * 0.7 * profile.weights.slope);
    delayReasons.add('inclinação');
  }
  if (segment.floor !== 'regular') {
    delayMin += round(2 * profile.weights.floor);
    delayReasons.add('piso irregular');
  }
  if (segment.hasStairs && profile.blockedByStairs) blockReasons.push('Escadas sem rampa');

  for (const report of reports) {
    const effect = reportEffect(report, segment, profile);
    if (effect.points !== 0) {
      reportItems.push({ label: `${getReportType(report).short} (relato)`, points: effect.points, source: 'relato', reportId: report.id });
    }
    if (effect.delayMin > 0) {
      delayMin += effect.delayMin;
      delayReasons.add(getReportType(report).short.toLowerCase());
    }
    if (effect.blocks) blockReasons.push(getReportType(report).label);
  }

  const reportPoints = reportItems.reduce((sum, i) => sum + i.points, 0);
  const verified = isSurveyValid(segment, now) || reports.some((r) => r.status === 'confirmado');

  return {
    segment,
    code: segmentCode(segment),
    baseScore: round(baseScore),
    score: round(clamp(baseScore + reportPoints)),
    breakdown: [...attributes, ...reportItems.map((i) => ({ ...i, points: Math.round(i.points) }))]
      .filter((i) => i.points !== 0)
      .sort((a, b) => b.points - a.points),
    delayMin,
    delayReasons: [...delayReasons],
    blocked: blockReasons.length > 0,
    blockReasons,
    verified,
    reports: [...reports].sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1)),
  };
}

function combineScores(evaluations, key) {
  const total = evaluations.reduce((sum, e) => sum + e.segment.lengthM, 0) || 1;
  const average = evaluations.reduce((sum, e) => sum + e[key] * e.segment.lengthM, 0) / total;
  const worst = Math.min(...evaluations.map((e) => e[key]));
  return round((1 - BOTTLENECK_WEIGHT) * average + BOTTLENECK_WEIGHT * worst);
}

function reliabilityFromShare(share) {
  if (share >= 0.8) return 'alta';
  if (share >= MIN_VERIFIED_SHARE) return 'média';
  return 'baixa';
}

/**
 * Avalia uma rota completa.
 * @param {object}   route
 * @param {object[]} segments   trechos desta rota
 * @param {object[]} reports    relatos descritos (pode conter relatos de outras rotas)
 * @param {object}   context    { profileId, preferences, now }
 */
export function evaluateRoute(route, segments, reports, context = {}) {
  const now = context.now ?? new Date();
  const ordered = [...segments].sort((a, b) => a.order - b.order);
  if (route.reversed) ordered.reverse();

  const segmentEvaluations = ordered.map((segment) =>
    evaluateSegment(segment, reports.filter((r) => r.segmentId === segment.id), { ...context, now }),
  );

  const totalLength = ordered.reduce((sum, s) => sum + s.lengthM, 0) || 1;
  const verifiedLength = segmentEvaluations.filter((e) => e.verified).reduce((sum, e) => sum + e.segment.lengthM, 0);
  const verifiedShare = verifiedLength / totalLength;
  const sufficient = verifiedShare >= MIN_VERIFIED_SHARE;

  const routeReports = segmentEvaluations.flatMap((e) => e.reports);
  const activeReports = routeReports.filter((r) => r.active);
  const delayMin = segmentEvaluations.reduce((sum, e) => sum + e.delayMin, 0);
  const delayReasons = [...new Set(segmentEvaluations.flatMap((e) => e.delayReasons))];
  const estimatedScore = combineScores(segmentEvaluations, 'score');
  const originalScore = combineScores(segmentEvaluations, 'baseScore');
  const maxSlope = Math.max(...ordered.map((s) => s.slopePct));
  const steepLength = ordered.filter((s) => s.slopePct >= 6).reduce((sum, s) => sum + s.lengthM, 0);
  const surveyDates = ordered.map((s) => s.surveyedAt).filter(Boolean).sort();

  const countBy = (status) => activeReports.filter((r) => r.status === status).length;

  return {
    route,
    segments: segmentEvaluations,
    score: sufficient ? estimatedScore : null,
    estimatedScore,
    originalScore,
    scoreDelta: estimatedScore - originalScore,
    minutes: route.baseMinutes + delayMin,
    originalMinutes: route.baseMinutes,
    delayMin,
    delayReasons,
    distanceKm: route.distanceKm,
    sufficient,
    verifiedShare,
    reliability: reliabilityFromShare(verifiedShare),
    lastVerifiedAt: surveyDates.at(-1) ?? null,
    blocked: segmentEvaluations.some((e) => e.blocked),
    hasStairs: ordered.some((s) => s.hasStairs),
    maxSlope,
    flatAndRegular: steepLength / totalLength < 0.05 && ordered.every((s) => s.floor === 'regular'),
    wideSidewalks: ordered.every((s) => s.widthM >= 1.4),
    supportPoints:
      context.preferences?.includeSupportPoints === false
        ? []
        : [...new Set(ordered.flatMap((s) => s.supportPoints ?? []))],
    reports: routeReports,
    activeReports,
    confirmations: activeReports.reduce((sum, r) => sum + r.tally.confirm, 0),
    counts: {
      confirmado: countBy('confirmado'),
      em_confirmacao: countBy('em_confirmacao'),
      nao_verificado: countBy('nao_verificado'),
    },
    outdatedReports: activeReports.filter((r) => r.outdated),
  };
}

/**
 * Ordena as rotas e marca a recomendada.
 * Rotas sem dados suficientes, bloqueadas ou com escadas (quando a pessoa quer evitá-las)
 * não podem ser recomendadas.
 */
export function rankRoutes(evaluations, preferences = {}) {
  const eligible = (e) => e.sufficient && !e.blocked && !(preferences.avoidStairs && e.hasStairs);
  const sorted = [...evaluations].sort((a, b) => {
    if (eligible(a) !== eligible(b)) return eligible(a) ? -1 : 1;
    if (a.sufficient !== b.sufficient) return a.sufficient ? -1 : 1;
    if (a.estimatedScore !== b.estimatedScore) return b.estimatedScore - a.estimatedScore;
    return a.minutes - b.minutes;
  });

  const fastest = Math.min(...evaluations.filter(eligible).map((e) => e.minutes));
  const recommendedId = sorted.find(eligible)?.route.id ?? null;

  return sorted.map((e) => {
    let badge;
    if (!e.sufficient) badge = 'insuficiente';
    else if (e.blocked) badge = 'bloqueada';
    else if (e.route.id === recommendedId) badge = 'recomendada';
    else if (e.estimatedScore < ATTENTION_BELOW || (preferences.avoidStairs && e.hasStairs)) badge = 'atencao';
    else badge = 'alternativa';
    return { ...e, recommended: e.route.id === recommendedId, fastest: eligible(e) && e.minutes === fastest, badge };
  });
}

/** Quanto um relato mexe na nota do trecho (ex.: "seu relato somou +4 pontos"). */
export function reportImpact(segment, segmentReports, reportId, context) {
  const withReport = evaluateSegment(segment, segmentReports, context).score;
  const without = evaluateSegment(segment, segmentReports.filter((r) => r.id !== reportId), context).score;
  return withReport - without;
}
