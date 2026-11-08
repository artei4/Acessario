import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { scoreLevel } from '../ui/ScoreRing.jsx';
import { cn } from '../../utils/cn.js';
import { formatKm, formatRelativeDays, formatShortDate, plural } from '../../utils/format.js';
import { BADGES, recentObstacleCount, routeChips } from './routeLabels.js';

const SCORE_COLORS = { good: 'text-ok', limited: 'text-warn', bad: 'text-bad', unknown: 'text-mute' };

function TimeComparison({ evaluation }) {
  const max = Math.max(evaluation.minutes, evaluation.originalMinutes);
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[96px_1fr_auto] items-center gap-x-2 gap-y-1 text-xs" aria-hidden="true">
        <span className="text-ink-soft">Original {evaluation.originalMinutes} min</span>
        <span className="h-2 rounded-full bg-mute-line" style={{ width: `${(evaluation.originalMinutes / max) * 100}%` }} />
        <span />
        <span className="font-bold text-warn">Agora {evaluation.minutes} min</span>
        <span className="h-2 rounded-full bg-warn-strong" style={{ width: `${(evaluation.minutes / max) * 100}%` }} />
        <span className="font-bold text-warn">+{evaluation.delayMin}</span>
      </div>
      <p className="m-0 text-xs font-bold text-warn">
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
  const recommended = evaluation.badge === 'recomendada';

  const summary = `${evaluation.route.name}, ${badge.label}. ${
    evaluation.sufficient ? `Nota ${evaluation.score} de 100` : 'Sem nota'
  }, ${formatKm(evaluation.distanceKm)}, ${evaluation.minutes} minutos.`;

  return (
    <Card as="article" variant={selected ? 'highlight' : 'default'} className="flex flex-col gap-2" onMouseEnter={() => onSelect?.(evaluation.route.id)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold">{evaluation.route.name}</h3>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <p className="m-0 text-xs text-ink-soft">via {evaluation.route.via}</p>

      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-[34px] leading-none font-extrabold tabular-nums', SCORE_COLORS[level])}>{evaluation.score ?? '–'}</span>
        <span className="text-[13px] text-ink-soft">
          {evaluation.sufficient && '/100 · '}
          {formatKm(evaluation.distanceKm)} · {evaluation.minutes} min
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {evaluation.sufficient && positives.map((text) => <Badge key={text} tone="success">{text}</Badge>)}
        {recommended && evaluation.confirmations > 0 && (
          <Badge tone="success">Confirmado · {plural(evaluation.confirmations, 'confirmação', 'confirmações')}</Badge>
        )}
        {recommended && (evaluation.flatAndRegular || evaluation.fastest) && (
          <Badge tone="success">
            {[evaluation.flatAndRegular && 'Plano e regular', evaluation.fastest && 'menor tempo'].filter(Boolean).join(' · ')}
          </Badge>
        )}
        {!recommended && problems.map((p) => <Badge key={p.text} tone={p.tone}>{p.text}</Badge>)}
      </div>

      {evaluation.sufficient && evaluation.scoreDelta <= -3 && (
        <p className="m-0 text-xs text-ink-soft">
          Nota caiu de {evaluation.originalScore} para {evaluation.estimatedScore}
          {recent > 0 && ` após ${plural(recent, 'novo relato', 'novos relatos')}`}
        </p>
      )}

      {showTime && <TimeComparison evaluation={evaluation} />}

      {outdated && (
        <p className="m-0">
          <Badge tone="warning">Relato de {formatShortDate(outdated.createdAt)} · pode estar desatualizado</Badge>
        </p>
      )}

      <p className="m-0 text-xs text-ink-soft">
        {evaluation.sufficient
          ? `Confiabilidade ${evaluation.reliability} · última verificação ${formatRelativeDays(evaluation.lastVerifiedAt)}`
          : `Só ${Math.round(evaluation.verifiedShare * 100)}% do caminho foi verificado. Nota estimada: ${evaluation.estimatedScore}.`}
      </p>

      <Button variant="secondary" size="sm" onClick={() => onOpen(evaluation)} aria-label={`Ver resumo: ${summary}`}>
        Ver resumo da rota
      </Button>
    </Card>
  );
}
