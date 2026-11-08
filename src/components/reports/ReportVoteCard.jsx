import { Button } from '../ui/Button.jsx';
import { StatusBadge } from '../ui/Badge.jsx';
import { getReportType } from '../../domain/reportTypes.js';
import { segmentCode } from '../../domain/scoring.js';
import { formatShortDate } from '../../utils/format.js';
import { reportMeta, tallyText } from './reportText.js';

const VOTES = [
  { type: 'confirm', long: 'Confirmo que essa informação está correta', short: 'Confirmo', variant: 'success' },
  { type: 'resolved', long: 'O problema foi resolvido', short: 'Resolvido', variant: 'secondary' },
  { type: 'incorrect', long: 'Essa informação está incorreta', short: 'Incorreta', variant: 'danger' },
];

const VOTE_LABEL = { confirm: 'confirmou', resolved: 'disse que foi resolvido', incorrect: 'disse que está incorreta' };

/** Cartão da aba "Confirmar relato" (tela 5A): mostra o relato e os três votos possíveis. */
export function ReportVoteCard({ report, segment, myVote, onVote, onUndo, busy, featured = false, isOwn = false }) {
  const type = getReportType(report);
  const { confirm, incorrect, resolved } = report.tally;
  const total = confirm + incorrect + resolved || 1;

  return (
    <article className={`card stack ${featured ? 'card--warning' : ''}`} style={{ gap: 8 }} aria-busy={busy || undefined}>
      <div className="row row--between">
        <h3 style={{ fontSize: 15 }}>
          {type.label}
          {!featured && segment && ` · ${segmentCode(segment)}`}
        </h3>
        <StatusBadge status={report.status} />
      </div>

      {featured && (
        <div className="row" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
          <div className="photo-thumb" style={{ width: 96, flex: 'none' }}>
            {report.photo && <img src={report.photo} alt={`Foto do relato: ${type.label}`} />}
            <span className="photo-thumb__label">{report.photo ? 'Foto' : 'Sem foto'} · {formatShortDate(report.createdAt)}</span>
          </div>
          <div className="stack" style={{ gap: 6, flex: 1, justifyContent: 'center' }}>
            <div className="vote-bar" aria-hidden="true">
              <span className="vote-bar__confirm" style={{ width: `${(confirm / total) * 100}%` }} />
              <span className="vote-bar__contest" style={{ width: `${((incorrect + resolved) / total) * 100}%`, marginLeft: 'auto' }} />
            </div>
            <span className="small strong">{tallyText(report)}</span>
          </div>
        </div>
      )}

      <span className="tiny muted">
        {featured ? reportMeta(report) : `${tallyText(report)} · relato de ${formatShortDate(report.createdAt)} · confiabilidade ${report.statusInfo.reliability}`}
        {segment && featured && ` · ${segmentCode(segment)}`}
      </span>
      {report.description && <span className="small">“{report.description}”</span>}
      {report.outdated && (
        <span className="tiny strong" style={{ color: 'var(--amber)' }}>
          Possivelmente desatualizado: sem confirmações há mais de 30 dias.
        </span>
      )}

      {isOwn ? (
        <p className="tiny muted" style={{ margin: 0 }}>Este relato é seu. Outras pessoas precisam confirmá-lo.</p>
      ) : (
        <>
          {featured && <p className="small strong" style={{ margin: 0 }}>Você viu esse problema?</p>}
          <div className={featured ? 'stack' : 'grid-2'} style={featured ? { gap: 8 } : { gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {VOTES.map((vote) => (
              <Button
                key={vote.type}
                variant={vote.variant}
                size={featured ? undefined : 'sm'}
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
            <p className="tiny muted" style={{ margin: 0 }}>
              Você {VOTE_LABEL[myVote.type]} em {formatShortDate(myVote.createdAt)}.{' '}
              <button type="button" className="link-button tiny" onClick={() => onUndo(myVote.id, report.id)} disabled={busy}>
                Desfazer voto
              </button>
            </p>
          )}
        </>
      )}
    </article>
  );
}
