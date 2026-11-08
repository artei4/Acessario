import { cn } from '../../utils/cn.js';

export const LEVEL_COLORS = {
  good: '#15803d',
  limited: '#d97706',
  bad: '#dc2626',
  unknown: '#94a3b8',
};

export const LEVEL_LABELS = {
  good: 'Boa acessibilidade',
  limited: 'Com limitações',
  bad: 'Dificuldade alta',
  unknown: 'Não verificado',
};

/**
 * Moldura comum aos dois mapas (OpenStreetMap e esquemático): proporção, borda,
 * legenda e conteúdo sobreposto (dicas, botões).
 */
export function MapFrame({ aspect = 1.6, bleed = false, picker = false, showLegend = false, legendPosition = 'left', className, overlay, children }) {
  return (
    <div
      className={cn(
        'relative max-w-full touch-none overflow-hidden bg-map-land',
        bleed ? 'rounded-none' : 'rounded-xl border border-line',
        picker && 'cursor-crosshair',
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {/* isolate: os z-index internos do Leaflet (até 1000) ficam presos aqui, abaixo da legenda e da barra inferior */}
      <div className="relative isolate z-0 size-full">{children}</div>
      {showLegend && <MapLegend position={legendPosition} />}
      {overlay}
    </div>
  );
}

export function LegendDot({ level, className }) {
  return <span className={cn('inline-block size-[9px] flex-none rounded-full', className)} style={{ background: LEVEL_COLORS[level] }} aria-hidden="true" />;
}

function MapLegend({ position }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-2 z-10 grid gap-0.5 rounded-lg bg-glass px-2 py-1.5 text-[11px] text-ink shadow-soft',
        position === 'right' ? 'right-2' : 'left-2',
      )}
    >
      {Object.entries(LEVEL_LABELS).map(([level, text]) => (
        <span key={level} className="flex items-center gap-1.5">
          <LegendDot level={level} />
          {text}
        </span>
      ))}
    </div>
  );
}

/** Dica centralizada na parte de baixo do mapa ("Arraste para ajustar o ponto"). */
export function MapHint({ children }) {
  return (
    <span className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-navy px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-on-navy">
      {children}
    </span>
  );
}
