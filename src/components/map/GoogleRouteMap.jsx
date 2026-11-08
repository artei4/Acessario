import { useEffect, useMemo, useRef } from 'react';
import { useGoogleMap, useMapListener } from '../../hooks/useGoogleMap.js';
import { config } from '../../config/env.js';
import { LEVEL_COLORS, MapFrame } from './MapFrame.jsx';
import { framePoints, fromLatLng, labelPoint, pointsKey, toLatLng } from './mapGeometry.js';

const STROKE = { selected: 7, normal: 5, muted: 4 };
const OPACITY = { selected: 1, normal: 0.95, muted: 0.45 };
const Z_INDEX = { muted: 1, normal: 2, selected: 3 };
const DEFAULT_CENTER = { lat: -22.961, lng: -43.181 };

/** Ícone repetido que desenha uma linha tracejada (trechos não verificados). */
function dashedIcons(maps, color, weight) {
  return [
    {
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: color, strokeWeight: weight, scale: 2 },
      offset: '0',
      repeat: `${weight * 3}px`,
    },
  ];
}

function markerContent(marker) {
  const el = document.createElement('div');
  if (marker.kind === 'number') {
    el.className = 'gm-number';
    el.textContent = marker.label;
  } else if (marker.kind === 'route-label') {
    el.className = 'gm-route-label';
    el.textContent = marker.label;
  } else {
    el.className = 'gm-dot';
    el.style.background = marker.kind === 'origin' ? '#15803d' : '#dc2626';
  }
  return el;
}

/**
 * Mapa da Google Maps JavaScript API com as rotas do app.
 * Mesmas props do mapa esquemático (CityMap), para que os dois sejam intercambiáveis.
 */
export function GoogleRouteMap({
  maps,
  colorScheme,
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
  const map = useGoogleMap(maps, containerRef, {
    mapId: config.googleMaps.mapId,
    center: DEFAULT_CENTER,
    zoom: 15,
    colorScheme: maps.ColorScheme ? maps.ColorScheme[colorScheme === 'dark' ? 'DARK' : 'LIGHT'] : undefined,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: onPick ? 'greedy' : 'cooperative',
  });

  // Enquadra rotas e marcadores (só quando os pontos mudam, para não "pular" a cada clique)
  const points = useMemo(() => framePoints({ focus, routes, markers }), [focus, routes, markers]);
  const key = pointsKey(points);
  useEffect(() => {
    if (!map || points.length === 0) return;
    const bounds = new maps.LatLngBounds();
    points.forEach((p) => bounds.extend(toLatLng(p)));
    map.fitBounds(bounds, 32);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, maps, key]);

  // Escolha de ponto: clique no mapa
  useMapListener(map, 'click', onPick ? (event) => event.latLng && onPick(fromLatLng(event.latLng)) : null);

  // Rotas: uma Polyline por trecho, colorida pelo nível de acessibilidade
  useEffect(() => {
    if (!map) return undefined;
    const overlays = [];
    for (const route of routes) {
      const emphasis = route.emphasis ?? 'normal';
      const weight = STROKE[emphasis];
      for (const segment of route.segments) {
        const color = LEVEL_COLORS[segment.level];
        const path = segment.path.map(toLatLng);
        if (segment.id === highlightSegmentId) {
          overlays.push(new maps.Polyline({ map, path, strokeColor: '#1a56db', strokeOpacity: 0.35, strokeWeight: weight + 8, zIndex: 0, clickable: false }));
        }
        const dashed = segment.level === 'unknown';
        const line = new maps.Polyline({
          map,
          path,
          strokeColor: color,
          strokeOpacity: dashed ? 0 : OPACITY[emphasis],
          strokeWeight: weight,
          icons: dashed ? dashedIcons(maps, color, weight) : undefined,
          zIndex: Z_INDEX[emphasis],
          clickable: Boolean(onSelectRoute) || Boolean(onPick),
        });
        if (onSelectRoute) line.addListener('click', () => onSelectRoute(route.id));
        // clicar sobre a linha também deve marcar o ponto no modo de escolha
        if (onPick) line.addListener('click', (event) => event.latLng && onPick(fromLatLng(event.latLng)));
        overlays.push(line);
      }
    }
    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [map, maps, routes, highlightSegmentId, onSelectRoute, onPick]);

  // Marcadores: origem/destino, números dos trechos, rótulos das rotas e o alfinete do relato
  useEffect(() => {
    if (!map) return undefined;
    const { AdvancedMarkerElement, PinElement } = maps.marker ?? {};
    if (!AdvancedMarkerElement) return undefined;

    const routeLabels = routes
      .filter((route) => route.label)
      .map((route) => ({ id: `label-${route.id}`, kind: 'route-label', label: route.label, point: labelPoint(route.segments) }))
      .filter((m) => m.point);

    const created = [...markers, ...routeLabels].map((marker) => {
      if (marker.kind === 'pin') {
        const pin = new PinElement({ background: '#dc2626', borderColor: '#ffffff', glyphColor: '#ffffff', glyph: '!' });
        const element = new AdvancedMarkerElement({
          map,
          position: toLatLng(marker.point),
          content: pin.element,
          gmpDraggable: Boolean(onPick),
          title: 'Local do relato. Arraste para ajustar.',
          zIndex: 10,
        });
        if (onPick) element.addListener('dragend', () => onPick(fromLatLng(element.position)));
        return element;
      }
      return new AdvancedMarkerElement({ map, position: toLatLng(marker.point), content: markerContent(marker), zIndex: marker.kind === 'route-label' ? 5 : 4 });
    });
    return () =>
      created.forEach((marker) => {
        marker.map = null;
      });
  }, [map, maps, markers, routes, onPick]);

  return (
    <MapFrame aspect={aspect} bleed={bleed} picker={Boolean(onPick)} showLegend={showLegend} legendPosition={legendPosition} className={className} overlay={children}>
      <div ref={containerRef} className="size-full" role="region" aria-label={label} data-testid="google-map" />
    </MapFrame>
  );
}
