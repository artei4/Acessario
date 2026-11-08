import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>';

/**
 * Cria um mapa Leaflet com o mapa-base do OpenStreetMap dentro de `containerRef`.
 * As opções só são lidas na criação. O mapa é destruído quando o componente sai da tela.
 */
export function useLeafletMap(containerRef, options = {}) {
  const [map, setMap] = useState(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const instance = L.map(containerRef.current, {
      center: [-22.961, -43.181],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
      ...optionsRef.current,
    });
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(instance);
    setMap(instance);
    return () => {
      instance.remove();
      setMap(null);
    };
  }, [containerRef]);

  return map;
}

/** Registra um evento do mapa (click, keydown…) e o remove na limpeza do efeito. */
export function useMapEvent(map, eventName, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const enabled = Boolean(handler);

  useEffect(() => {
    if (!map || !enabled) return undefined;
    const listener = (event) => handlerRef.current?.(event);
    map.on(eventName, listener);
    return () => map.off(eventName, listener);
  }, [map, eventName, enabled]);
}

/** Camada que agrupa os desenhos de um efeito; é limpa e removida quando o efeito roda de novo. */
export function useLayerGroup(map) {
  const [group, setGroup] = useState(null);
  useEffect(() => {
    if (!map) return undefined;
    const layer = L.layerGroup().addTo(map);
    setGroup(layer);
    return () => {
      layer.remove();
      setGroup(null);
    };
  }, [map]);
  return group;
}
