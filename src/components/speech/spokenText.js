/**
 * Textos falados pelo guia por voz. Frases curtas e completas, na ordem em que a pessoa precisa
 * da informação: primeiro o que é a tela, depois o mais importante, por fim o que dá para fazer.
 */
import { BADGES } from '../routes/routeLabels.js';
import { getReportType } from '../../domain/reportTypes.js';
import { formatKm, formatMeters, plural } from '../../utils/format.js';

const spokenKm = (km) => formatKm(km).replace('km', 'quilômetros').replace(' m', ' metros');
const spokenMeters = (m) => formatMeters(m).replace(' km', ' quilômetros').replace(' m', ' metros');

/** Problemas da rota em linguagem falada: "buraco no trecho 01", "inclinação de 8 por cento". */
function spokenProblems(evaluation) {
  const byKey = new Map();
  for (const segment of evaluation.segments) {
    for (const report of segment.reports) {
      if (!report.active || report.kind !== 'obstacle' || report.weight < 0.5) continue;
      const label = getReportType(report).label.toLowerCase();
      byKey.set(label, [...(byKey.get(label) ?? []), segment.code.toLowerCase()]);
    }
  }
  const items = [...byKey].map(([label, codes]) => `${label} no ${[...new Set(codes)].join(' e no ')}`);
  if (evaluation.hasStairs) items.push('tem escadas');
  if (evaluation.maxSlope >= 6) items.push(`inclinação de ${evaluation.maxSlope} por cento`);
  const pending = evaluation.counts?.em_confirmacao ?? 0;
  if (pending > 0) items.push(plural(pending, 'relato em confirmação', 'relatos em confirmação'));
  return items;
}

/** Uma rota em uma ou duas frases (cartão da lista de rotas). */
export function speakRoute(evaluation) {
  const badge = BADGES[evaluation.badge]?.label ?? '';
  const score = evaluation.sufficient ? `Nota ${evaluation.score} de 100` : 'Ainda sem nota';
  const problems = spokenProblems(evaluation);
  const issues = problems.length ? ` Atenção: ${problems.join('; ')}.` : ' Sem problemas relatados.';
  const safety = evaluation.safety?.level && evaluation.safety.level !== 'none' ? ` Segurança: ${evaluation.safety.info.label}.` : '';
  return `${evaluation.route.name}, ${badge}. ${score}, ${spokenKm(evaluation.distanceKm)}, ${evaluation.minutes} minutos a pé, via ${evaluation.route.via}.${issues}${safety}`;
}

/** Tela de rotas: quantas, de onde para onde e a recomendada. */
export function speakRoutesScreen({ evaluations, origin, destination, loading }) {
  const trip = origin && destination ? ` de ${origin.name} para ${destination.name}` : '';
  if (loading) return `Procurando rotas${trip}.`;
  if (evaluations.length === 0) return `Não encontrei rotas${trip}.`;
  const best = evaluations.find((e) => e.badge === 'recomendada') ?? evaluations[0];
  return `${plural(evaluations.length, 'rota encontrada', 'rotas encontradas')}${trip}. ${speakRoute(best)} Use Tab para ouvir as outras rotas e abrir o resumo.`;
}

/** Um trecho: rua, extensão, nota e problemas. */
export function speakSegment(segmentEvaluation) {
  const { segment, code } = segmentEvaluation;
  const obstacles = segmentEvaluation.reports.filter((r) => r.active && r.kind === 'obstacle').map((r) => getReportType(r).label.toLowerCase());
  const parts = [`${code}, ${segment.street}, ${spokenMeters(segment.lengthM)}.`];
  parts.push(segmentEvaluation.verified ? `Nota ${segmentEvaluation.score} de 100.` : 'Ainda não verificado.');
  if (segmentEvaluation.blocked) parts.push(`Impedido para o seu perfil: ${segmentEvaluation.blockReasons.join(', ').toLowerCase()}.`);
  if (obstacles.length) parts.push(`Problemas relatados: ${obstacles.join(', ')}.`);
  if (segment.slopePct >= 6) parts.push(`Inclinação de ${segment.slopePct} por cento.`);
  if (segment.hasStairs) parts.push('Tem escadas.');
  const risks = segmentEvaluation.safety?.risks ?? [];
  if (risks.length) parts.push(`Segurança: ${[...new Set(risks.map((r) => r.type.label.toLowerCase()))].join(', ')} relatado recentemente.`);
  return parts.join(' ');
}

/** Resumo da rota (tela 4). */
export function speakRouteSummary(evaluation) {
  const score = evaluation.sufficient ? `Nota ${evaluation.score} de 100.` : 'Ainda sem nota.';
  const attention = evaluation.segments.filter((s) => s.reports.some((r) => r.active && r.kind === 'obstacle'));
  const problems = attention.length
    ? `${plural(attention.length, 'trecho tem', 'trechos têm')} problemas relatados: ${attention.map((s) => s.code).join(', ')}.`
    : 'Nenhum trecho com problema relatado.';
  const support = evaluation.supportPoints.length ? ` Pontos de apoio: ${evaluation.supportPoints.join(', ')}.` : '';
  const action = evaluation.blocked ? ' Esta rota está impedida para o seu perfil.' : ' Para ser guiado trecho a trecho, use o botão Iniciar navegação.';
  return `Resumo da ${evaluation.route.name}: ${evaluation.minutes} minutos, ${spokenKm(evaluation.distanceKm)}, ${plural(evaluation.segments.length, 'trecho', 'trechos')}. ${score} ${problems}${support}${action}`;
}

/** Instrução de um passo da navegação. */
export function speakNavigationStep(evaluation, step) {
  const current = evaluation.segments[step];
  const last = step === evaluation.segments.length - 1;
  const parts = [`Trecho ${step + 1} de ${evaluation.segments.length}. Siga pela ${current.segment.street} por ${spokenMeters(current.segment.lengthM)}.`];
  const warnings = current.reports.filter((r) => r.active && r.kind === 'obstacle').map((r) => getReportType(r).label.toLowerCase());
  if (warnings.length) parts.push(`Atenção: ${warnings.join(', ')}.`);
  if (current.segment.slopePct >= 6) parts.push(`Inclinação de ${current.segment.slopePct} por cento.`);
  const risks = current.safety?.risks ?? [];
  if (risks.length) parts.push(`Segurança: ${[...new Set(risks.map((r) => r.type.label.toLowerCase()))].join(', ')} relatado recentemente.`);
  parts.push(last ? 'É o último trecho. Ao chegar, toque em Cheguei.' : 'Ao terminar, toque em Próximo trecho.');
  return parts.join(' ');
}
