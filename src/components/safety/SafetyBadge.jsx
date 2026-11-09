import { Badge } from '../ui/Badge.jsx';
import { Icon } from '../ui/Icon.jsx';
import { safetySummary } from '../../domain/safety.js';

/** Selo do índice de segurança: "Segurança: atenção". */
export function SafetyBadge({ safety }) {
  if (!safety) return null;
  return (
    <Badge tone={safety.info.tone}>
      <Icon name="shield" size={13} />
      Segurança: {safety.info.short.toLowerCase()}
    </Badge>
  );
}

/** Linha de segurança dos cartões de rota: selo + resumo das ocorrências recentes. */
export function SafetyLine({ safety }) {
  if (!safety) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SafetyBadge safety={safety} />
      <span className="text-xs text-ink-soft">{safetySummary(safety)}</span>
    </div>
  );
}
