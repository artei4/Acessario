import { useTheme } from '../../context/ThemeContext.jsx';
import { cn } from '../../utils/cn.js';
import { Icon } from './Icon.jsx';

const OPTIONS = [
  { id: 'light', label: 'Claro', icon: 'sun' },
  { id: 'dark', label: 'Escuro', icon: 'moon' },
  { id: 'system', label: 'Automático', icon: 'auto' },
];

/** Botão rápido que alterna entre claro e escuro. `onDark` para usar sobre fundo azul-marinho. */
export function ThemeToggleButton({ onDark = false, className }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const toDark = resolvedTheme !== 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={toDark ? 'Mudar para o modo escuro' : 'Mudar para o modo claro'}
      title={toDark ? 'Modo escuro' : 'Modo claro'}
      className={cn(
        'grid size-11 flex-none cursor-pointer place-items-center rounded-full border-[1.5px]',
        onDark ? 'border-white/35 bg-white/12 text-on-navy hover:bg-white/20' : 'border-line bg-surface text-ink hover:border-brand hover:text-brand',
        className,
      )}
    >
      <Icon name={toDark ? 'moon' : 'sun'} size={20} />
    </button>
  );
}

/** Escolha completa do tema (claro, escuro ou automático), usada no Perfil. */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <fieldset className="m-0 grid grid-cols-3 gap-1.5 border-0 p-0">
      <legend className="sr-only">Tema da tela</legend>
      {OPTIONS.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-[1.5px] border-line px-1 py-2.5 text-[13px] font-semibold text-ink-soft has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
        >
          <input type="radio" name="theme" value={option.id} className="sr-only" checked={theme === option.id} onChange={() => setTheme(option.id)} />
          <Icon name={option.icon} size={18} />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
