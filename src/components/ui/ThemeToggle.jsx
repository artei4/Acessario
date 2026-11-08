import { useTheme } from '../../context/ThemeContext.jsx';
import { Icon } from './Icon.jsx';

const OPTIONS = [
  { id: 'light', label: 'Claro', icon: 'sun' },
  { id: 'dark', label: 'Escuro', icon: 'moon' },
  { id: 'system', label: 'Automático', icon: 'auto' },
];

/** Botão rápido que alterna entre claro e escuro. */
export function ThemeToggleButton({ className = '' }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const toDark = resolvedTheme !== 'dark';
  return (
    <button
      type="button"
      className={`theme-button ${className}`}
      onClick={toggleTheme}
      aria-label={toDark ? 'Mudar para o modo escuro' : 'Mudar para o modo claro'}
      title={toDark ? 'Modo escuro' : 'Modo claro'}
    >
      <Icon name={toDark ? 'moon' : 'sun'} size={20} />
    </button>
  );
}

/** Escolha completa do tema (claro, escuro ou automático), usada no Perfil. */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <fieldset className="theme-selector">
      <legend className="sr-only">Tema da tela</legend>
      {OPTIONS.map((option) => (
        <label key={option.id} className="theme-selector__option">
          <input type="radio" name="theme" value={option.id} checked={theme === option.id} onChange={() => setTheme(option.id)} />
          <Icon name={option.icon} size={18} />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
