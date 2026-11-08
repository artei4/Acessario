import { cn } from '../../utils/cn.js';
import { Icon } from './Icon.jsx';

/** Botão só com ícone. O rótulo é obrigatório para leitores de tela. */
export function IconButton({ icon, label, size = 16, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn('grid size-8 flex-none cursor-pointer place-items-center rounded-full text-ink-soft hover:bg-surface-alt hover:text-ink', className)}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
