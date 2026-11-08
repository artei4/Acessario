import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Card, Notice, SectionTitle } from '../ui/Card.jsx';
import { ScoreRing, scoreLevel } from '../ui/ScoreRing.jsx';
import { PhotoThumb } from '../reports/PhotoThumb.jsx';
import { ReportSummary } from '../reports/ReportSummary.jsx';
import { getReportType } from '../../domain/reportTypes.js';
import { cn } from '../../utils/cn.js';
import { formatMeters, formatRelativeDays, formatShortDate, formatWidth, signed } from '../../utils/format.js';

function PhotoStrip({ reports }) {
  const items = reports.slice(0, 3);
  while (items.length < 3) items.push(null);
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((report, i) =>
        report ? (
          <PhotoThumb
            key={report.id}
            src={report.photo}
            alt={`Foto: ${getReportType(report).label}`}
            label={`${getReportType(report).short} · ${formatShortDate(report.createdAt)}`}
          />
        ) : (
          <PhotoThumb key={`empty-${i}`} empty />
        ),
      )}
    </div>
  );
}

function Attribute({ label, value }) {
  return (
    <div>
      <dt className="inline text-ink-soft">{label} </dt>
      <dd className="m-0 inline font-bold">{value}</dd>
    </div>
  );
}

/** Detalhe de um trecho na tela de resumo da rota (tela 4). */
export function SegmentDetail({ evaluation, routeName, onReport }) {
  const { segment, code, score, breakdown, reports, delayMin, delayReasons, verified, blocked, blockReasons } = evaluation;
  const level = scoreLevel(score);
  const outdated = reports.filter((r) => r.active && r.outdated);

  return (
    <Card as="section" className="flex flex-col gap-3" aria-labelledby={`seg-${segment.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`seg-${segment.id}`} className="text-[15px] font-bold">
          {routeName} · {code} · {formatMeters(segment.lengthM)}
        </h2>
        {blocked ? <Badge tone="danger">Impedido</Badge> : level !== 'good' ? <Badge tone="warning">Atenção</Badge> : <Badge tone="success">Bom</Badge>}
      </div>
      <p className="-mt-2 mb-0 text-[13px] text-ink-soft">{segment.street}</p>

      <div className="flex items-center gap-3.5">
        <ScoreRing score={score} />
        <dl className="m-0 grid flex-1 grid-cols-2 gap-x-3 gap-y-0.5 text-[13px]">
          <Attribute label="Largura" value={formatWidth(segment.widthM)} />
          <Attribute label="Inclinação" value={`${segment.slopePct}%`} />
          <Attribute label="Escadas" value={segment.hasStairs ? 'Sim' : 'Não'} />
          <Attribute label="Rampas" value={segment.hasRamps ? 'Sim' : 'Não'} />
          <Attribute label="Piso" value={segment.floor === 'regular' ? 'Regular' : 'Irregular'} />
          <Attribute label="Piso tátil" value={segment.tactile ? 'Sim' : 'Não'} />
        </dl>
      </div>

      {blocked && <Notice tone="danger">Trecho impedido para o seu perfil: {blockReasons.join(', ')}.</Notice>}

      <PhotoStrip reports={reports} />

      <div>
        <p className="mt-0 mb-1 text-xs text-ink-soft">Como a nota foi calculada</p>
        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-xs font-semibold" aria-label="Composição da nota">
          {breakdown.map((item) => (
            <li key={`${item.label}-${item.reportId ?? ''}`} className={item.points > 0 ? 'text-ok' : 'text-bad'}>
              {signed(item.points)} {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionTitle as="h3">Relatos deste trecho</SectionTitle>
        {reports.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-soft">Ninguém relatou nada aqui ainda.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {reports.map((report) => (
              <ReportSummary key={report.id} report={report} />
            ))}
          </ul>
        )}
      </div>

      <Button variant="secondary" block onClick={onReport}>
        Confirmar ou relatar problema neste trecho ›
      </Button>

      {outdated.map((r) => (
        <Notice key={r.id} tone="warning">
          <strong>Possivelmente desatualizado:</strong> {getReportType(r).label.toLowerCase()}, relato de {formatShortDate(r.createdAt)}.
        </Notice>
      ))}

      <div className="flex flex-col gap-1">
        <SectionTitle as="h3">Tempo neste trecho</SectionTitle>
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span>{delayReasons.length ? delayReasons.join(' e ') : 'Sem atrasos previstos'}</span>
          <span className={cn('font-bold', delayMin ? 'text-warn' : 'text-ok')}>+{delayMin} min</span>
        </div>
        <p className="m-0 text-xs text-ink-soft">Se o trecho ficar impedido, o app sugere outra rota.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          Confiabilidade: <Badge tone={verified ? 'success' : 'neutral'}>{verified ? 'Verificado' : 'Não verificado'}</Badge>
        </span>
        <span className="text-ink-soft">Última verificação: {formatRelativeDays(segment.surveyedAt)}</span>
      </div>
    </Card>
  );
}
