import { Icon } from '../ui/Icon.jsx';

export function TopBar({ title, subtitle, onBack, action }) {
  return (
    <header className="topbar">
      {onBack && (
        <button type="button" className="topbar__back" onClick={onBack} aria-label="Voltar">
          <Icon name="back" size={22} />
        </button>
      )}
      <div style={{ flex: 1 }}>
        <h1 className="topbar__title">{title}</h1>
        {subtitle && <p className="topbar__subtitle" style={{ margin: 0 }}>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
