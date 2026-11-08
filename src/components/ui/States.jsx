import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';
import { cn } from '../../utils/cn.js';

export function Skeleton({ className, style }) {
  return (
    <div
      className={cn('animate-shimmer rounded-xl bg-[linear-gradient(90deg,var(--skeleton-a)_0%,var(--skeleton-b)_50%,var(--skeleton-a)_100%)] bg-[length:200%_100%]', className)}
      style={style}
    />
  );
}

export function LoadingState({ lines = 3, height = 96 }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} style={{ height }} />
      ))}
    </div>
  );
}

function StateBox({ children, ...props }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-8 text-center text-ink-soft" {...props}>
      {children}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <StateBox role="alert">
      <Icon name="warning" size={32} />
      <p className="m-0">{error?.userMessage ?? 'Não foi possível carregar.'}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </StateBox>
  );
}

export function EmptyState({ icon = 'map', title, children }) {
  return (
    <StateBox>
      <Icon name={icon} size={32} />
      {title && <p className="m-0 font-bold text-ink">{title}</p>}
      {children}
    </StateBox>
  );
}
