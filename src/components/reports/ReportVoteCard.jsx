import { Button } from '../ui/Button.jsx';
import { StatusBadge } from '../ui/Badge.jsx';
import { Card } from '../ui/Card.jsx';
import { PhotoThumb } from './PhotoThumb.jsx';
import { getReportType, isSafetyReport } from '../../domain/reportTypes.js';
import { segmentCode } from '../../domain/scoring.js';
import { cn } from '../../utils/cn.js';
import { formatShortDate } from '../../utils/format.js';
import { reportMeta, tallyText } from './reportText.js';

const VOTES = [
  { type: 'confirm', long: 'Confirmo que essa informação está correta', short: 'Confirmo', variant: 'success' },
  { type: 'resolved', long: 'O problema foi resolvido', short: 'Resolvido', variant: 'secondary' },
  { type: 'incorrect', long: 'Essa informação está incorreta', short: 'Incorreta', variant: 'danger' },
];

/** Em relatos de segurança, "resolvido" vira "não está mais assim" (ex.: rua voltou a ser iluminada). */
const SAFETY_VOTES = VOTES.map((v) =>
  v.type === 'resolved' ? { ...v, long: 'Não está mais assim', short: 'Não vale mais' } : v,
);

const VOTE_LABEL = { confirm: 'confirmou', resolved: 'disse que foi resolvido', incorrect: 'disse que está incorreta' };

/** Cartão da aba "Confirmar relato" (tela 5A): mostra o relato e os três votos possíveis. */
export function ReportVoteCard({ report, segment, myVote, onVote, onUndo, busy, featured = false, isOwn = false, canVote = true }) {
  const type = getReportType(report);
  const { confirm, incorrect, resolved } = report.tally;
  const total = confirm + incorrect + resolved || 1;

  return (
    <Card as="article" variant={featured ? 'warning' : 'default'} className="flex flex-col gap-2" aria-busy={busy || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold">
          {type.label}
          {!featured && segment && ` · ${segmentCode(segment)}`}
        </h3>
        <StatusBadge status={report.status} />
      </div>

      {featured && (
        <div className="flex items-stretch gap-2">
          <PhotoThumb
            className="w-24 flex-none"
            src={report.photo}
            alt={`Foto do relato: ${type.label}`}
            label={`${report.photo ? 'Foto' : 'Sem foto'} · ${formatShortDate(report.createdAt)}`}
          />
          <div className="flex flex-1 flex-col justify-center gap-1.5">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
              <span className="bg-ok" style={{ width: `${(confirm / total) * 100}%` }} />
              <span className="ml-auto bg-bad-strong" style={{ width: `${((incorrect + resolved) / total) * 100}%` }} />
            </div>
            <span className="text-[13px] font-bold">{tallyText(report)}</span>
          </div>
        </div>
      )}

      <span className="text-xs text-ink-soft">
        {featured
          ? `${reportMeta(report)}${segment ? ` · ${segmentCode(segment)}` : ''}`
          : `${tallyText(report)} · relato de ${formatShortDate(report.createdAt)} · confiabilidade ${report.statusInfo.reliability}`}
      </span>
      {report.description && <span className="text-[13px]">“{report.description}”</span>}
      {report.outdated && <span className="text-xs font-bold text-warn">Possivelmente desatualizado: sem confirmações há mais de 30 dias.</span>}

      {isOwn ? (
        <p className="m-0 text-xs text-ink-soft">Este relato é seu. Outras pessoas precisam confirmá-lo.</p>
      ) : !canVote ? (
        <p className="m-0 text-xs text-ink-soft">Entre com uma conta para confirmar ou contestar este relato.</p>
      ) : (
        <>
          {featured && <p className="m-0 text-[13px] font-bold">Você viu esse problema?</p>}
          <div className={cn(featured ? 'flex flex-col gap-2' : 'grid grid-cols-3 gap-1.5')}>
            {(isSafetyReport(report) ? SAFETY_VOTES : VOTES).map((vote) => (
              <Button
                key={vote.type}
                variant={vote.variant}
                size={featured ? 'md' : 'sm'}
                selected={myVote?.type === vote.type}
                aria-pressed={myVote?.type === vote.type}
                disabled={busy}
                onClick={() => onVote(report.id, vote.type)}
              >
                {myVote?.type === vote.type && '✓ '}
                {featured ? vote.long : vote.short}
              </Button>
            ))}
          </div>
          {myVote && (
            <p className="m-0 text-xs text-ink-soft">
              Você {VOTE_LABEL[myVote.type]} em {formatShortDate(myVote.createdAt)}.{' '}
              <button type="button" className="cursor-pointer font-semibold text-brand" onClick={() => onUndo(myVote.id, report.id)} disabled={busy}>
                Desfazer voto
              </button>
            </p>
          )}
        </>
      )}
    </Card>
  );
}
