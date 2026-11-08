import { cn } from '../../utils/cn.js';

const CARD_VARIANTS = {
  default: 'border border-line bg-surface',
  highlight: 'border-2 border-brand bg-surface',
  warning: 'border-2 border-warn-strong bg-warn-card',
  soft: 'border border-transparent bg-surface-alt',
};

/** Superfície com borda. `as` permite usar section, article, li… */
export function Card({ as: Tag = 'div', variant = 'default', className, children, ...props }) {
  return (
    <Tag className={cn('rounded-xl p-3.5', CARD_VARIANTS[variant], className)} {...props}>
      {children}
    </Tag>
  );
}

const NOTICE_TONES = {
  info: 'bg-brand-soft text-notice-ink',
  warning: 'border border-warn-line bg-warn-soft text-warn-ink',
  success: 'bg-ok-soft text-ok',
  danger: 'bg-bad-soft text-bad',
};

/** Aviso em bloco (texto curto com fundo colorido). */
export function Notice({ tone = 'info', className, children, ...props }) {
  return (
    <p className={cn('m-0 rounded-lg px-3 py-2.5 text-[13px]', NOTICE_TONES[tone], className)} {...props}>
      {children}
    </p>
  );
}

/** Título pequeno em caixa alta usado em seções. */
export function SectionTitle({ as: Tag = 'h2', className, children, ...props }) {
  return (
    <Tag className={cn('text-xs font-bold tracking-[0.06em] text-ink-soft uppercase', className)} {...props}>
      {children}
    </Tag>
  );
}
