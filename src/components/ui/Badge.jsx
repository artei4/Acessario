import { STATUS } from '../../domain/reportStatus.js';

export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`badge badge--${tone} ${className}`}>{children}</span>;
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
