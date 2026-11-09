import { useMemo, useRef } from 'react';
import { fitViewBox, project, toPoints, unproject } from './projection.js';
import { LEVEL_COLORS, MapFrame } from './MapFrame.jsx';

export { LEVEL_COLORS, LEVEL_LABELS } from './MapFrame.jsx';


/* Elementos de fundo (esquemáticos) em [lat, lon]. */
const SEA = [[-22.9716, -43.195], [-22.97, -43.187], [-22.968, -43.18], [-22.9655, -43.1742], [-22.964, -43.168], [-22.99, -43.168], [-22.99, -43.195]];
const BAY = [[-22.9505, -43.195], [-22.9528, -43.1865], [-22.9533, -43.1785], [-22.9515, -43.168], [-22.94, -43.168], [-22.94, -43.195]];
const HILL = [[-22.9622, -43.1846], [-22.9628, -43.1822], [-22.9618, -43.1785], [-22.9605, -43.1768], [-22.9592, -43.1772], [-22.9586, -43.1805], [-22.959, -43.1838], [-22.9606, -43.1852]];
const STREETS = [
  [[-22.9695, -43.189], [-22.9668, -43.1878], [-22.9635, -43.1795], [-22.9612, -43.1745]],
  [[-22.9688, -43.1858], [-22.9655, -43.1838], [-22.964, -43.18], [-22.9625, -43.175]],
  [[-22.957, -43.1895], [-22.9578, -43.182], [-22.9575, -43.1757], [-22.956, -43.172]],
  [[-22.9545, -43.1872], [-22.9598, -43.1857], [-22.963, -43.1856], [-22.9662, -43.1868], [-22.97, -43.1872]],
];
const LABELS = [
  { text: 'Botafogo', at: [-22.9558, -43.1862] },
  { text: 'Copacabana', at: [-22.9668, -43.1815] },
  { text: 'Enseada de Botafogo', at: [-22.9518, -43.1835] },
  { text: 'Av. Atlântica', at: [-22.9686, -43.1762], rotate: -28 },
];

const STROKE = { selected: 7, normal: 5, muted: 4 };

/**
 * Mapa esquemático em SVG.
 * - routes:  [{ id, label, emphasis: 'selected'|'normal'|'muted', segments: [{ id, path, level, order }] }]
 * - markers: [{ id, point, kind: 'origin'|'destination'|'number'|'pin', label }]
 * - onPick(point): torna o mapa um seletor de ponto (clique/arraste ou setas do teclado)
 */
export function CityMap({
  routes = [],
  markers = [],
  focus,
  aspect = 1.6,
  onSelectRoute,
  onPick,
  highlightSegmentId,
  showLegend = false,
  legendPosition = 'left',
  label = 'Mapa da região',
  className,
  bleed = false,
  children,
}) {
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const viewBox = useMemo(() => {
    const points = focus?.length
      ? focus
      : [...routes.flatMap((r) => r.segments.flatMap((s) => s.path)), ...markers.map((m) => m.point)];
    return fitViewBox(points.length ? points : [[-22.961, -43.181]], { aspect });
  }, [focus, routes, markers, aspect]);

  const scale = viewBox.width / 400; // mantém traços e textos com tamanho visual constante

  const toLatLon = (event) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM().inverse());
    return unproject([local.x, local.y]);
  };

  const pickHandlers = onPick
    ? {
        onPointerDown: (e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          onPick(toLatLon(e));
        },
        onPointerMove: (e) => dragging.current && onPick(toLatLon(e)),
        onPointerUp: () => {
          dragging.current = false;
        },
        onKeyDown: (e) => {
          const pin = markers.find((m) => m.kind === 'pin');
          const step = { ArrowUp: [0, -6], ArrowDown: [0, 6], ArrowLeft: [-6, 0], ArrowRight: [6, 0] }[e.key];
          if (!step || !pin) return;
          e.preventDefault();
          const [x, y] = project(pin.point);
          onPick(unproject([x + step[0] * scale, y + step[1] * scale]));
        },
        tabIndex: 0,
      }
    : {};

  const order = { muted: 0, normal: 1, selected: 2 };
  const sortedRoutes = [...routes].sort((a, b) => order[a.emphasis ?? 'normal'] - order[b.emphasis ?? 'normal']);

  return (
    <MapFrame aspect={aspect} bleed={bleed} picker={Boolean(onPick)} showLegend={showLegend} legendPosition={legendPosition} className={className} overlay={children}>
      <svg
        className="block size-full"
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        role={onPick ? 'application' : 'img'}
        aria-label={label}
        {...pickHandlers}
      >
        <rect x={viewBox.x - 500} y={viewBox.y - 500} width={viewBox.width + 1000} height={viewBox.height + 1000} fill="var(--map-land)" />
        <polygon points={toPoints(SEA)} fill="var(--map-water)" />
        <polygon points={toPoints(BAY)} fill="var(--map-water)" />
        <polygon points={toPoints(HILL)} fill="var(--map-hill)" stroke="var(--map-hill-stroke)" strokeWidth={scale} />
        {STREETS.map((street, i) => (
          <polyline key={i} points={toPoints(street)} fill="none" stroke="var(--map-street)" strokeWidth={9 * scale} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {LABELS.map(({ text, at, rotate }) => {
          const [x, y] = project(at);
          return (
            <text key={text} x={x} y={y} fontSize={10 * scale} fill="var(--map-label)" textAnchor="middle" transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
              {text}
            </text>
          );
        })}

        {sortedRoutes.map((route) => {
          const emphasis = route.emphasis ?? 'normal';
          const width = STROKE[emphasis] * scale;
          const first = route.segments[Math.floor(route.segments.length / 2)];
          const [lx, ly] = first ? project(first.path[0]) : [0, 0];
          return (
            <g
              key={route.id}
              opacity={emphasis === 'muted' ? 0.45 : 1}
              onClick={onSelectRoute ? () => onSelectRoute(route.id) : undefined}
              style={onSelectRoute ? { cursor: 'pointer' } : undefined}
            >
              {route.segments.map((segment) => (
                <g key={segment.id}>
                  {segment.id === highlightSegmentId && (
                    <polyline points={toPoints(segment.path)} fill="none" stroke="var(--blue)" strokeOpacity="0.35" strokeWidth={width + 8 * scale} strokeLinecap="round" />
                  )}
                  <polyline
                    points={toPoints(segment.path)}
                    fill="none"
                    stroke={LEVEL_COLORS[segment.level]}
                    strokeWidth={width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={segment.level === 'unknown' ? `${6 * scale} ${4 * scale}` : undefined}
                  />
                  {/* área de toque maior que o traço visível */}
                  {onSelectRoute && <polyline points={toPoints(segment.path)} fill="none" stroke="transparent" strokeWidth={22 * scale} />}
                </g>
              ))}
              {route.label && (
                <g transform={`translate(${lx} ${ly})`}>
                  <circle r={8 * scale} fill="var(--map-marker-bg)" stroke="var(--map-marker-fg)" strokeWidth={1.5 * scale} />
                  <text fontSize={9 * scale} fontWeight="700" textAnchor="middle" dy={3 * scale} fill="var(--map-marker-fg)">
                    {route.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {markers.map((marker) => {
          const [x, y] = project(marker.point);
          if (marker.kind === 'number') {
            return (
              <g key={marker.id} transform={`translate(${x} ${y})`}>
                <circle r={8 * scale} fill="#0b2a5b" stroke="#fff" strokeWidth={1.5 * scale} />
                <text fontSize={9 * scale} fontWeight="700" textAnchor="middle" dy={3 * scale} fill="#fff">
                  {marker.label}
                </text>
              </g>
            );
          }
          if (marker.kind === 'risk' || marker.kind === 'safe') {
            return (
              <g key={marker.id} transform={`translate(${x} ${y})`}>
                <title>{marker.label}</title>
                <circle r={7 * scale} fill={marker.kind === 'risk' ? '#b91c1c' : '#15803d'} stroke="#fff" strokeWidth={1.5 * scale} />
                <text fontSize={9 * scale} fontWeight="800" textAnchor="middle" dy={3 * scale} fill="#fff">
                  {marker.kind === 'risk' ? '!' : '✓'}
                </text>
              </g>
            );
          }
          if (marker.kind === 'pin') {
            return (
              <g key={marker.id} transform={`translate(${x} ${y}) scale(${scale})`} pointerEvents="none">
                <path d="M0 0c-6-8-10-12-10-17a10 10 0 0 1 20 0c0 5-4 9-10 17Z" fill="#dc2626" stroke="#fff" strokeWidth="2" />
                <text y="-13" fontSize="12" fontWeight="800" textAnchor="middle" fill="#fff">!</text>
              </g>
            );
          }
          const color = marker.kind === 'origin' ? '#15803d' : '#dc2626';
          return <circle key={marker.id} cx={x} cy={y} r={6 * scale} fill={color} stroke="#fff" strokeWidth={2 * scale} />;
        })}
      </svg>

    </MapFrame>
  );
}
