import { StatusBadge } from '../ui/Badge.jsx';
import { getReportType } from '../../domain/reportTypes.js';
import { reportMeta } from './reportText.js';

/** Linha de relato na lista "Relatos deste trecho". */
export function ReportSummary({ report }) {
  const type = getReportType(report);
  return (
    <li className="flex flex-col gap-0.5 rounded-lg border border-line px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-bold">
          {report.kind === 'facilitator' ? '＋ ' : ''}
          {type.label}
        </span>
        <StatusBadge status={report.status} />
      </div>
      <span className="text-xs text-ink-soft">{reportMeta(report)}</span>
      {report.description && <span className="text-xs">{report.description}</span>}
    </li>
  );
}
