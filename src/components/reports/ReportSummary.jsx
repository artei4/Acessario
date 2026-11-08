import { StatusBadge } from '../ui/Badge.jsx';
import { getReportType } from '../../domain/reportTypes.js';
import { reportMeta } from './reportText.js';

/** Linha de relato na lista "Relatos deste trecho". */
export function ReportSummary({ report }) {
  const type = getReportType(report);
  return (
    <li className="report-item">
      <div className="row row--between">
        <span className="small strong">
          {report.kind === 'facilitator' ? '＋ ' : ''}
          {type.label}
        </span>
        <StatusBadge status={report.status} />
      </div>
      <span className="tiny muted">{reportMeta(report)}</span>
      {report.description && <span className="tiny">{report.description}</span>}
    </li>
  );
}
