/**
 * Ciclo de vida de um relato, a partir dos votos de outras pessoas.
 *
 *   não verificado ──1 confirmação──▶ em confirmação ──5 confirmações──▶ confirmado
 *          │                                  │
 *          └──── 2+ "resolvido" ou "incorreta" (e mais que as confirmações) ────▶ resolvido / incorreto
 */

const DAY = 24 * 60 * 60 * 1000;

export const CONFIRMED_THRESHOLD = 5;
export const DISMISS_THRESHOLD = 2;
export const OUTDATED_AFTER_DAYS = 30;

export const STATUS = {
  nao_verificado: { label: 'Não verificado', tone: 'neutral', reliability: 'baixa', weight: 0.25 },
  em_confirmacao: { label: 'Em confirmação', tone: 'warning', reliability: 'média', weight: 0.5 },
  confirmado: { label: 'Confirmado', tone: 'success', reliability: 'alta', weight: 1 },
  resolvido: { label: 'Resolvido', tone: 'info', reliability: 'alta', weight: 0 },
  incorreto: { label: 'Incorreto', tone: 'danger', reliability: 'alta', weight: 0 },
};

export function tallyVotes(votes) {
  const tally = { confirm: 0, incorrect: 0, resolved: 0 };
  for (const vote of votes) if (vote.type in tally) tally[vote.type] += 1;
  return tally;
}

export function statusFromTally({ confirm, incorrect, resolved }) {
  if (resolved >= DISMISS_THRESHOLD && resolved > confirm) return 'resolvido';
  if (incorrect >= DISMISS_THRESHOLD && incorrect > confirm) return 'incorreto';
  if (confirm >= CONFIRMED_THRESHOLD) return 'confirmado';
  if (confirm >= 1) return 'em_confirmacao';
  return 'nao_verificado';
}

function latest(dates) {
  return dates.filter(Boolean).reduce((max, d) => (d > max ? d : max), '');
}

/**
 * Enriquece um relato com o estado calculado a partir dos votos.
 * @param {object} report
 * @param {object[]} votes  votos deste relato
 * @param {Date} now
 */
export function describeReport(report, votes, now = new Date()) {
  const tally = tallyVotes(votes);
  const status = statusFromTally(tally);
  const lastActivityAt = latest([report.createdAt, report.updatedAt, ...votes.map((v) => v.createdAt)]);
  const ageDays = (now.getTime() - new Date(lastActivityAt).getTime()) / DAY;
  return {
    ...report,
    tally,
    status,
    statusInfo: STATUS[status],
    weight: STATUS[status].weight,
    active: STATUS[status].weight > 0,
    lastActivityAt,
    outdated: ageDays > OUTDATED_AFTER_DAYS,
  };
}

/** Agrupa votos por relato e descreve todos os relatos. */
export function describeReports(reports, votes, now = new Date()) {
  const byReport = new Map();
  for (const vote of votes) {
    if (!byReport.has(vote.reportId)) byReport.set(vote.reportId, []);
    byReport.get(vote.reportId).push(vote);
  }
  return reports.map((report) => describeReport(report, byReport.get(report.id) ?? [], now));
}
