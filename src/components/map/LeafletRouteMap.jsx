import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLayerGroup, useLeafletMap, useMapEvent } from '../../hooks/useLeafletMap.js';
import { LEVEL_COLORS, MapFrame } from './MapFrame.jsx';
import { framePoints, fromLatLng, labelPoint, pointsKey } from './mapGeometry.js';

const STROKE = { selected: 7, normal: 5, muted: 4 };
const OPACITY = { selected: 1, normal: 0.95, muted: 0.45 };
const ORDER = { muted: 0, normal: 1, selected: 2 };
const ARROWS = { ArrowUp: [0, -12], ArrowDown: [0, 12], ArrowLeft: [-12, 0], ArrowRight: [12, 0] };

const PIN_SVG =
  '<svg width="28" height="36" viewBox="-14 -34 28 36" aria-hidden="true"><path d="M0 0c-6-8-12-13-12-20a12 12 0 0 1 24 0c0 7-6 12-12 20Z" fill="#dc2626" stroke="#fff" stroke-width="2"/><text y="-16" font-size="13" font-weight="800" text-anchor="middle" fill="#fff">!</text></svg>';

function htmlIcon(className, html = '', size = 22) {
  return L.divIcon({ className: '', html: `<div class="${className}">${html}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function markerIcon(marker) {
  if (marker.kind === 'number') return htmlIcon('marker-number', marker.label);
  if (marker.kind === 'route-label') return htmlIcon('marker-route-label', marker.label);
  if (marker.kind === 'risk') return htmlIcon('marker-risk', '!', 20);
  if (marker.kind === 'safe') return htmlIcon('marker-safe', '✓', 20);
  if (marker.kind === 'pin') return L.divIcon({ className: '', html: PIN_SVG, iconSize: [28, 36], iconAnchor: [14, 34] });
  return htmlIcon(marker.kind === 'origin' ? 'marker-dot marker-dot--origin' : 'marker-dot marker-dot--destination', '', 14);
}

/**
 * Mapa do OpenStreetMap (Leaflet) com as rotas do app.
 * Mesmas props do mapa esquemático (CityMap), para que os dois sejam intercambiáveis.
 */
export function LeafletRouteMap({
  routes = [],
  markers = [],
  focus,
  aspect = 1.6,
  bleed = false,
  onSelectRoute,
  onPick,
  highlightSegmentId,
  showLegend = false,
  legendPosition = 'left',
  label = 'Mapa da região',
  className,
  children,
}) {
  const containerRef = useRef(null);
  // no modo de escolha de ponto, as setas movem o alfinete (e não o mapa)
  const map = useLeafletMap(containerRef, { keyboard: !onPick, scrollWheelZoom: Boolean(onPick) });
  const routeLayer = useLayerGroup(map);
  const markerLayer = useLayerGroup(map);

  // Enquadra rotas e marcadores só quando os pontos mudam, para não "pular" a cada toque
  const points = useMemo(() => framePoints({ focus, routes, markers }), [focus, routes, markers]);
  const key = pointsKey(points);
  useEffect(() => {
    if (!map || points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 18 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  // Escolha de ponto: clique no mapa
  useMapEvent(map, 'click', onPick ? (event) => onPick(fromLatLng(event.latlng)) : null);

  // Escolha de ponto pelo teclado: setas movem o alfinete 12 px por vez
  const pin = markers.find((m) => m.kind === 'pin');
  useMapEvent(
    map,
    'keydown',
    onPick
      ? (event) => {
          const step = ARROWS[event.originalEvent.key];
          if (!step) return;
          event.originalEvent.preventDefault();
          const start = pin ? map.latLngToContainerPoint(pin.point) : map.getSize().divideBy(2);
          onPick(fromLatLng(map.containerPointToLatLng(start.add(step))));
        }
      : null,
  );

  // Rotas: uma linha por trecho, colorida pelo nível de acessibilidade (tracejada se não verificado)
  useEffect(() => {
    if (!routeLayer) return;
    routeLayer.clearLayers();
    const sorted = [...routes].sort((a, b) => ORDER[a.emphasis ?? 'normal'] - ORDER[b.emphasis ?? 'normal']);
    for (const route of sorted) {
      const emphasis = route.emphasis ?? 'normal';
      const weight = STROKE[emphasis];
      for (const segment of route.segments) {
        if (segment.id === highlightSegmentId) {
          L.polyline(segment.path, { color: '#1a56db', opacity: 0.35, weight: weight + 8, interactive: false }).addTo(routeLayer);
        }
        const line = L.polyline(segment.path, {
          color: LEVEL_COLORS[segment.level],
          weight,
          opacity: OPACITY[emphasis],
          dashArray: segment.level === 'unknown' ? `${weight * 1.5} ${weight * 1.5}` : undefined,
          lineCap: 'round',
          interactive: Boolean(onSelectRoute || onPick),
        }).addTo(routeLayer);
        if (onSelectRoute) line.on('click', () => onSelectRoute(route.id));
        // tocar sobre a linha também marca o ponto no modo de escolha
        if (onPick) line.on('click', (event) => onPick(fromLatLng(event.latlng)));
      }
    }
  }, [routeLayer, routes, highlightSegmentId, onSelectRoute, onPick]);

  // Marcadores: origem/destino, números dos trechos, rótulos das rotas e o alfinete do relato
  useEffect(() => {
    if (!markerLayer) return;
    markerLayer.clearLayers();
    const routeLabels = routes
      .filter((route) => route.label)
      .map((route) => ({ id: `label-${route.id}`, kind: 'route-label', label: route.label, point: labelPoint(route.segments) }))
      .filter((m) => m.point);

    for (const marker of [...routeLabels, ...markers]) {
      const isPin = marker.kind === 'pin';
      const leafletMarker = L.marker(marker.point, {
        icon: markerIcon(marker),
        draggable: isPin && Boolean(onPick),
        keyboard: false,
        interactive: isPin,
        zIndexOffset: isPin ? 1000 : 0,
        title: isPin ? 'Local do relato. Arraste para ajustar.' : marker.kind === 'risk' || marker.kind === 'safe' ? marker.label : undefined,
      }).addTo(markerLayer);
      if (isPin && onPick) leafletMarker.on('dragend', () => onPick(fromLatLng(leafletMarker.getLatLng())));
    }
  }, [markerLayer, markers, routes, onPick]);

  return (
    <MapFrame aspect={aspect} bleed={bleed} picker={Boolean(onPick)} showLegend={showLegend} legendPosition={legendPosition} className={className} overlay={children}>
      <div
        ref={containerRef}
        className="size-full"
        role={onPick ? 'application' : 'region'}
        aria-label={onPick ? `${label} Use as setas do teclado para mover o marcador.` : label}
        data-testid="osm-map"
        tabIndex={onPick ? 0 : undefined}
      />
    </MapFrame>
  );
}
