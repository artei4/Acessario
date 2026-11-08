import { STATUS } from '../../domain/reportStatus.js';
import { cn } from '../../utils/cn.js';

const TONES = {
  success: 'bg-ok-soft text-ok',
  warning: 'bg-warn-soft text-warn',
  danger: 'bg-bad-soft text-bad',
  info: 'bg-brand-soft text-brand',
  neutral: 'bg-chip text-ink-soft',
};

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap', TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Selo do status de um relato (Confirmado, Em confirmação…). */
export function StatusBadge({ status, suffix }) {
  const info = STATUS[status] ?? STATUS.nao_verificado;
  return (
    <Badge tone={info.tone}>
      {info.label}
      {suffix ? ` · ${suffix}` : ''}
    </Badge>
  );
}

/** Bolinha vermelha de contagem (ex.: relatos pendentes). */
export function CountDot({ count, label }) {
  return (
    <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad-strong px-1.5 text-[11px] font-bold text-white" aria-label={label}>
      {count}
    </span>
  );
}
