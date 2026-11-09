/**
 * Índice de segurança de um trecho ou rota, calculado só a partir de ocorrências relatadas
 * (assalto, tiroteio, rua escura…) e de pontos que dão segurança (iluminação, movimento…).
 *
 * Princípios:
 *  - baseado em ocorrências, nunca no tipo de bairro (comunidade não é sinônimo de perigo);
 *  - relatos perdem peso com o tempo (`validDays` de cada tipo);
 *  - relatos confirmados pesam mais (mesmo peso de status dos relatos de acessibilidade);
 *  - fica separado da nota de acessibilidade: informa, e a pessoa decide se quer desviar.
 */
import { getReportType, isSafetyReport } from './reportTypes.js';

const DAY = 24 * 60 * 60 * 1000;

export const ATTENTION_FROM = 2.5;
export const ALERT_FROM = 15;
/** Pontos positivos atenuam o risco, mas só pela metade: iluminação não anula um assalto recente. */
export const RELIEF_FACTOR = 0.5;

export const SAFETY_LEVELS = {
  none: { label: 'Sem relatos de segurança', short: 'Sem relatos', tone: 'neutral', rank: 0 },
  low: { label: 'Risco baixo', short: 'Risco baixo', tone: 'success', rank: 1 },
  attention: { label: 'Atenção', short: 'Atenção', tone: 'warning', rank: 2 },
  alert: { label: 'Alerta', short: 'Alerta', tone: 'danger', rank: 3 },
};

/** Quanto do peso o relato ainda tem (1 = novo, 0 = venceu). Votos recentes renovam o relato. */
export function freshness(report, now = new Date()) {
  const { validDays = 30 } = getReportType(report);
  const since = report.lastActivityAt ?? report.createdAt;
  const ageDays = Math.max(0, (now.getTime() - new Date(since).getTime()) / DAY);
  return { ageDays, factor: Math.max(0, 1 - ageDays / validDays), daysLeft: Math.max(0, Math.ceil(validDays - ageDays)) };
}

function levelFor(score, hasItems) {
  if (!hasItems) return 'none';
  if (score >= ALERT_FROM) return 'alert';
  if (score >= ATTENTION_FROM) return 'attention';
  return 'low';
}

/**
 * @param {object[]} reports  relatos já descritos (describeReports), de qualquer tipo
 * @returns {{ level, info, score, risks, positives }}
 */
export function evaluateSafety(reports, now = new Date()) {
  const items = reports
    .filter((r) => isSafetyReport(r) && r.active)
    .map((report) => {
      const { ageDays, factor, daysLeft } = freshness(report, now);
      const type = getReportType(report);
      return { report, type, ageDays, daysLeft, points: type.points * report.weight * factor };
    })
    .filter((item) => item.points > 0)
    .sort((a, b) => a.ageDays - b.ageDays);

  const risks = items.filter((i) => i.report.kind === 'risk');
  const positives = items.filter((i) => i.report.kind === 'safe');
  const riskPoints = risks.reduce((sum, i) => sum + i.points, 0);
  const relief = positives.reduce((sum, i) => sum + i.points, 0) * RELIEF_FACTOR;
  const score = Math.max(0, Math.round((riskPoints - Math.min(relief, riskPoints / 2)) * 10) / 10);
  const level = levelFor(score, items.length > 0);
  return { level, info: SAFETY_LEVELS[level], score, risks, positives };
}

/** Junta os índices dos trechos: vale o pior nível, e as ocorrências são somadas na lista. */
export function combineSafety(evaluations) {
  const worst = evaluations.reduce((acc, e) => (SAFETY_LEVELS[e.level].rank > SAFETY_LEVELS[acc].rank ? e.level : acc), 'none');
  const risks = evaluations.flatMap((e) => e.risks).sort((a, b) => a.ageDays - b.ageDays);
  const positives = evaluations.flatMap((e) => e.positives);
  return { level: worst, info: SAFETY_LEVELS[worst], score: Math.max(0, ...evaluations.map((e) => e.score)), risks, positives };
}

function ageText(days) {
  const d = Math.floor(days);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

/** Frase curta para cartões: "Assalto há 4 dias (em confirmação) · Rua escura". */
export function safetySummary(safety) {
  if (safety.risks.length === 0) {
    return safety.positives.length ? safety.positives.map((p) => p.type.short).join(' · ') : 'Nenhuma ocorrência recente relatada';
  }
  const [latest, ...others] = safety.risks;
  const first = `${latest.type.short} ${ageText(latest.ageDays)} (${latest.report.statusInfo.label.toLowerCase()})`;
  const rest = [...new Set(others.map((o) => o.type.short))].filter((s) => s !== latest.type.short);
  return [first, ...rest].join(' · ');
}

export { ageText as safetyAgeText };
