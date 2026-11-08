import { Icon } from '../ui/Icon.jsx';

export function TopBar({ title, subtitle, onBack, action }) {
  return (
    <header className="flex items-start gap-2">
      {onBack && (
        <button
          type="button"
          className="-ml-2 grid size-10 flex-none cursor-pointer place-items-center rounded-full hover:bg-surface-alt"
          onClick={onBack}
          aria-label="Voltar"
        >
          <Icon name="back" size={22} />
        </button>
      )}
      <div className="flex-1">
        <h1 className="pt-1.5 text-[22px] leading-tight font-extrabold text-balance">{title}</h1>
        {subtitle && <p className="m-0 text-[13px] text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** Botão redondo de voltar que flutua sobre o mapa. */
export function MapBackButton({ onClick, label = 'Voltar' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute top-2.5 left-2.5 z-10 grid size-10 cursor-pointer place-items-center rounded-full bg-surface text-ink shadow-soft"
    >
      <Icon name="back" size={20} />
    </button>
  );
}
