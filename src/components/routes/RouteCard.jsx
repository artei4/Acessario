import { Badge } from '../ui/Badge.jsx';
import { scoreLevel } from '../ui/ScoreRing.jsx';
import { formatKm, formatRelativeDays, formatShortDate, plural } from '../../utils/format.js';
import { BADGES, recentObstacleCount, routeChips } from './routeLabels.js';

function TimeComparison({ evaluation }) {
  const max = Math.max(evaluation.minutes, evaluation.originalMinutes);
  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="time-bars" aria-hidden="true">
        <span className="muted">Original {evaluation.originalMinutes} min</span>
        <span className="time-bar" style={{ width: `${(evaluation.originalMinutes / max) * 100}%` }} />
        <span />
        <span className="strong" style={{ color: 'var(--amber)' }}>Agora {evaluation.minutes} min</span>
        <span className="time-bar time-bar--now" style={{ width: `${(evaluation.minutes / max) * 100}%` }} />
        <span className="strong" style={{ color: 'var(--amber)' }}>+{evaluation.delayMin}</span>
      </div>
      <p className="tiny strong" style={{ margin: 0, color: 'var(--amber)' }}>
        +{evaluation.delayMin} min: {evaluation.delayReasons.join(', ')}
      </p>
    </div>
  );
}

/** Cartão de rota da tela "Rotas para você" (tela 3 do protótipo). */
export function RouteCard({ evaluation, selected, onSelect, onOpen }) {
  const badge = BADGES[evaluation.badge];
  const level = evaluation.sufficient ? scoreLevel(evaluation.score) : 'unknown';
  const { positives, problems } = routeChips(evaluation);
  const recent = recentObstacleCount(evaluation);
  const outdated = evaluation.outdatedReports[0];
  const showTime = evaluation.delayMin > 0 && evaluation.badge !== 'recomendada';

  const summary = `${evaluation.route.name}, ${badge.label}. ${
    evaluation.sufficient ? `Nota ${evaluation.score} de 100` : 'Sem nota'
  }, ${formatKm(evaluation.distanceKm)}, ${evaluation.minutes} minutos.`;

  return (
    <article
      className={`card route-card ${selected ? 'card--highlight' : ''}`}
      onMouseEnter={() => onSelect?.(evaluation.route.id)}
    >
      <div className="row row--between">
        <h3 style={{ fontSize: 16 }}>{evaluation.route.name}</h3>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>via {evaluation.route.via}</p>

      <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
        <span className={`route-card__score route-card__score--${level}`}>{evaluation.score ?? '–'}</span>
        <span className="muted small">
          {evaluation.sufficient && '/100 · '}
          {formatKm(evaluation.distanceKm)} · {evaluation.minutes} min
        </span>
      </div>

      <div className="row" style={{ gap: 6 }}>
        {evaluation.sufficient && positives.map((text) => <Badge key={text} tone="success">{text}</Badge>)}
        {evaluation.badge === 'recomendada' && evaluation.confirmations > 0 && (
          <Badge tone="success">Confirmado · {plural(evaluation.confirmations, 'confirmação', 'confirmações')}</Badge>
        )}
        {evaluation.badge === 'recomendada' && (evaluation.flatAndRegular || evaluation.fastest) && (
          <Badge tone="success">
            {[evaluation.flatAndRegular && 'Plano e regular', evaluation.fastest && 'menor tempo'].filter(Boolean).join(' · ')}
          </Badge>
        )}
        {evaluation.badge !== 'recomendada' &&
          problems.map((p) => <Badge key={p.text} tone={p.tone}>{p.text}</Badge>)}
      </div>

      {evaluation.sufficient && evaluation.scoreDelta <= -3 && (
        <p className="tiny muted" style={{ margin: 0 }}>
          Nota caiu de {evaluation.originalScore} para {evaluation.estimatedScore}
          {recent > 0 && ` após ${plural(recent, 'novo relato', 'novos relatos')}`}
        </p>
      )}

      {showTime && <TimeComparison evaluation={evaluation} />}

      {outdated && (
        <p className="tiny" style={{ margin: 0 }}>
          <Badge tone="warning">Relato de {formatShortDate(outdated.createdAt)} · pode estar desatualizado</Badge>
        </p>
      )}

      {evaluation.sufficient ? (
        <p className="tiny muted" style={{ margin: 0 }}>
          Confiabilidade {evaluation.reliability} · última verificação {formatRelativeDays(evaluation.lastVerifiedAt)}
        </p>
      ) : (
        <p className="tiny muted" style={{ margin: 0 }}>
          Só {Math.round(evaluation.verifiedShare * 100)}% do caminho foi verificado. Nota estimada:{' '}
          {evaluation.estimatedScore}.
        </p>
      )}

      <button type="button" className="btn btn--secondary btn--sm" onClick={() => onOpen(evaluation)} aria-label={`Ver resumo: ${summary}`}>
        Ver resumo da rota
      </button>
    </article>
  );
}
