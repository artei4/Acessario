import { cn } from '../../utils/cn.js';

/** Miniatura de foto de relato, com etiqueta. Sem foto, mostra um fundo ilustrativo. */
export function PhotoThumb({ src, alt, label, empty = false, className }) {
  if (empty) {
    return <div className={cn('grid h-16 place-items-center rounded-lg bg-track text-xs text-ink-soft', className)}>Sem foto</div>;
  }
  return (
    <div
      className={cn(
        'relative h-16 overflow-hidden rounded-lg bg-[linear-gradient(180deg,var(--map-water)_0_45%,var(--map-hill)_45%_70%,var(--track)_70%)]',
        className,
      )}
    >
      {src && <img src={src} alt={alt} className="size-full object-cover" />}
      {label && (
        <span className="absolute bottom-1 left-1 rounded bg-glass px-1.5 py-px text-[11px] font-semibold text-ink">{label}</span>
      )}
    </div>
  );
}
