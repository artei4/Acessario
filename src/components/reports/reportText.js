import { formatShortDate, plural } from '../../utils/format.js';

export function tallyText(report) {
  const { confirm, incorrect, resolved } = report.tally;
  if (report.status === 'confirmado' || (incorrect === 0 && resolved === 0)) {
    return plural(confirm, 'confirmação', 'confirmações');
  }
  const parts = [`${confirm} ${confirm === 1 ? 'confirma' : 'confirmam'}`];
  if (incorrect) parts.push(`${incorrect} ${incorrect === 1 ? 'contesta' : 'contestam'}`);
  if (resolved) parts.push(`${resolved} ${resolved === 1 ? 'diz' : 'dizem'} resolvido`);
  return parts.join(' · ');
}

export function reportMeta(report) {
  return `${tallyText(report)} · último relato ${formatShortDate(report.lastActivityAt)} · confiabilidade ${report.statusInfo.reliability}`;
}
