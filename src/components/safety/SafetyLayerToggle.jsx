import { Icon } from '../ui/Icon.jsx';
import { cn } from '../../utils/cn.js';

/** Botão sobre o mapa que liga/desliga a camada de segurança (ocorrências e pontos seguros). */
export function SafetyLayerToggle({ on, onChange, count }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={cn(
        'absolute bottom-2 left-2 z-10 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-soft',
        on ? 'border-bad bg-bad-soft text-bad' : 'border-line bg-surface text-ink-soft',
      )}
    >
      <Icon name="shield" size={14} />
      Segurança{count > 0 ? ` · ${count}` : ''}
    </button>
  );
}
