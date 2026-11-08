import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { ScoreRing, scoreLevel } from '../ui/ScoreRing.jsx';
import { ReportSummary } from '../reports/ReportSummary.jsx';
import { getReportType } from '../../domain/reportTypes.js';
import { formatMeters, formatRelativeDays, formatShortDate, formatWidth, signed } from '../../utils/format.js';

function PhotoStrip({ reports }) {
  const items = reports.slice(0, 3);
  while (items.length < 3) items.push(null);
  return (
    <div className="grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {items.map((report, i) =>
        report ? (
          <div key={report.id} className="photo-thumb">
            {report.photo && <img src={report.photo} alt={`Foto: ${getReportType(report).label}`} />}
            <span className="photo-thumb__label">
              {getReportType(report).short} · {formatShortDate(report.createdAt)}
            </span>
          </div>
        ) : (
          <div key={`empty-${i}`} className="photo-thumb photo-thumb--empty">Sem foto</div>
        ),
      )}
    </div>
  );
}

/** Detalhe de um trecho na tela de resumo da rota (tela 4). */
export function SegmentDetail({ evaluation, routeName, onReport }) {
  const { segment, code, score, breakdown, reports, delayMin, delayReasons, verified, blocked, blockReasons } = evaluation;
  const level = scoreLevel(score);
  const outdated = reports.filter((r) => r.active && r.outdated);

  return (
    <section className="card stack" aria-labelledby={`seg-${segment.id}`} style={{ gap: 12 }}>
      <div className="row row--between">
        <h2 id={`seg-${segment.id}`} style={{ fontSize: 15 }}>
          {routeName} · {code} · {formatMeters(segment.lengthM)}
        </h2>
        {blocked ? (
          <Badge tone="danger">Impedido</Badge>
        ) : level !== 'good' ? (
          <Badge tone="warning">Atenção</Badge>
        ) : (
          <Badge tone="success">Bom</Badge>
        )}
      </div>
      <p className="small muted" style={{ margin: '-8px 0 0' }}>{segment.street}</p>

      <div className="row" style={{ flexWrap: 'nowrap', gap: 14 }}>
        <ScoreRing score={score} />
        <dl className="attr-grid" style={{ margin: 0, flex: 1 }}>
          <div><dt className="muted" style={{ display: 'inline' }}>Largura </dt><dd className="strong" style={{ display: 'inline', margin: 0 }}>{formatWidth(segment.widthM)}</dd></div>
          <div><dt className="muted" style={{ display: 'inline' }}>Inclinação </dt><dd className="strong" style={{ display: 'inline', margin: 0 }}>{segment.slopePct}%</dd></div>
          <div><dt className="muted" style={{ display: 'inline' }}>Escadas </dt><dd className="strong" style={{ display: 'inline', margin: 0 }}>{segment.hasStairs ? 'Sim' : 'Não'}</dd></div>
          <div><dt className="muted" style={{ display: 'inline' }}>Rampas </dt><dd className="strong" style={{ display: 'inline', margin: 0 }}>{segment.hasRamps ? 'Sim' : 'Não'}</dd></div>
          <div><dt className="muted" style={{ display: 'inline' }}>Piso </dt><dd className="strong" style={{ display: 'inline', margin: 0 }}>{segment.floor === 'regular' ? 'Regular' : 'Irregular'}</dd></div>
          <div><dt className="muted" style={{ display: 'inline' }}>Piso tátil </dt><dd className="strong" style={{ display: 'inline', margin: 0 }}>{segment.tactile ? 'Sim' : 'Não'}</dd></div>
        </dl>
      </div>

      {blocked && (
        <p className="notice notice--danger" style={{ margin: 0 }}>
          Trecho impedido para o seu perfil: {blockReasons.join(', ')}.
        </p>
      )}

      <PhotoStrip reports={reports} />

      <div>
        <p className="tiny muted" style={{ margin: '0 0 4px' }}>Como a nota foi calculada</p>
        <ul className="breakdown list-plain" style={{ flexDirection: 'row' }} aria-label="Composição da nota">
          {breakdown.map((item) => (
            <li key={`${item.label}-${item.reportId ?? ''}`} className={item.points > 0 ? 'breakdown__pos' : 'breakdown__neg'}>
              {signed(item.points)} {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <h3 className="section-title">Relatos deste trecho</h3>
        {reports.length === 0 ? (
          <p className="small muted" style={{ margin: 0 }}>Ninguém relatou nada aqui ainda.</p>
        ) : (
          <ul className="list-plain">
            {reports.map((report) => <ReportSummary key={report.id} report={report} />)}
          </ul>
        )}
      </div>

      <Button variant="secondary" block onClick={onReport}>
        Confirmar ou relatar problema neste trecho ›
      </Button>

      {outdated.map((r) => (
        <p key={r.id} className="notice notice--warning" style={{ margin: 0 }}>
          <strong>Possivelmente desatualizado:</strong> {getReportType(r).label.toLowerCase()}, relato de {formatShortDate(r.createdAt)}.
        </p>
      ))}

      <div className="stack" style={{ gap: 4 }}>
        <h3 className="section-title">Tempo neste trecho</h3>
        <div className="row row--between small">
          <span>{delayReasons.length ? delayReasons.join(' e ') : 'Sem atrasos previstos'}</span>
          <span className="strong" style={{ color: delayMin ? 'var(--amber)' : 'var(--green)' }}>+{delayMin} min</span>
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>Se o trecho ficar impedido, o app sugere outra rota.</p>
      </div>

      <div className="row row--between tiny">
        <span>
          Confiabilidade: <Badge tone={verified ? 'success' : 'neutral'}>{verified ? 'Verificado' : 'Não verificado'}</Badge>
        </span>
        <span className="muted">Última verificação: {formatRelativeDays(segment.surveyedAt)}</span>
      </div>
    </section>
  );
}
