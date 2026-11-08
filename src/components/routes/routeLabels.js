import { getReportType } from '../../domain/reportTypes.js';
import { segmentCode } from '../../domain/scoring.js';
import { RECENT_DAYS } from '../../domain/summary.js';

const DAY = 24 * 60 * 60 * 1000;

export const BADGES = {
  recomendada: { label: 'Recomendada', tone: 'success' },
  alternativa: { label: 'Alternativa', tone: 'info' },
  atencao: { label: 'Atenção', tone: 'warning' },
  bloqueada: { label: 'Impedida', tone: 'danger' },
  insuficiente: { label: 'Informações insuficientes', tone: 'neutral' },
};

/** Etiquetas positivas e de problemas exibidas no cartão da rota. */
export function routeChips(evaluation) {
  const positives = [];
  const problems = [];

  if (!evaluation.hasStairs) positives.push('Sem escadas');
  else problems.push({ text: 'Tem escadas', tone: 'danger' });
  if (evaluation.wideSidewalks) positives.push('Calçadas largas');
  if (evaluation.supportPoints.length > 0) positives.push(`Apoio: ${evaluation.supportPoints.join(', ')}`);

  const segmentsById = new Map(evaluation.segments.map((s) => [s.segment.id, s.segment]));
  const seen = new Set();
  for (const report of evaluation.activeReports) {
    if (report.kind !== 'obstacle' || report.weight < 0.5) continue;
    const segment = segmentsById.get(report.segmentId);
    const text = `${getReportType(report).short} · ${segmentCode(segment)}`;
    if (!seen.has(text)) problems.push({ text, tone: 'danger' });
    seen.add(text);
  }
  if (evaluation.maxSlope >= 6) problems.push({ text: `Inclinação ${evaluation.maxSlope}%`, tone: 'warning' });
  if (evaluation.counts.em_confirmacao > 0) {
    problems.push({ text: `Em confirmação · ${evaluation.counts.em_confirmacao}`, tone: 'warning' });
  }
  if (!evaluation.sufficient) problems.unshift({ text: 'Trechos não verificados', tone: 'neutral' });

  return { positives, problems };
}

export function recentObstacleCount(evaluation, now = new Date()) {
  return evaluation.reports.filter(
    (r) => r.kind === 'obstacle' && now.getTime() - new Date(r.createdAt).getTime() <= RECENT_DAYS * DAY,
  ).length;
}
