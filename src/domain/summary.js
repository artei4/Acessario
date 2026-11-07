/** Resumos usados em telas que olham vários relatos de uma vez. */

const DAY = 24 * 60 * 60 * 1000;
export const RECENT_DAYS = 3;

/** Relatos novos (últimos dias) em um conjunto, contados por status. */
export function summarizeRecentReports(reports, now = new Date(), days = RECENT_DAYS) {
  const recent = reports.filter((r) => now.getTime() - new Date(r.createdAt).getTime() <= days * DAY);
  const count = (status) => recent.filter((r) => r.status === status).length;
  return {
    total: recent.length,
    confirmado: count('confirmado'),
    em_confirmacao: count('em_confirmacao'),
    nao_verificado: count('nao_verificado'),
  };
}

/** Cor do trecho no mapa conforme a nota e a confiabilidade. */
export function segmentLevel(evaluation) {
  if (!evaluation.verified) return 'unknown';
  if (evaluation.blocked || evaluation.score < 50) return 'bad';
  if (evaluation.score < 75) return 'limited';
  return 'good';
}
