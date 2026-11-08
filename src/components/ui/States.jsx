import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';

export function LoadingState({ lines = 3, height = 96 }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state" role="alert">
      <Icon name="warning" size={32} />
      <p>{error?.userMessage ?? 'Não foi possível carregar.'}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'map', title, children }) {
  return (
    <div className="state">
      <Icon name={icon} size={32} />
      {title && <p className="strong" style={{ color: 'var(--text)', margin: 0 }}>{title}</p>}
      {children}
    </div>
  );
}
