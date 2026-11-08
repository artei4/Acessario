import { useEffect, useRef, useState } from 'react';

/**
 * Cria um google.maps.Map dentro de `containerRef` e o devolve.
 * As opções só são lidas na criação; para trocar o tema, o componente remonta o mapa.
 */
export function useGoogleMap(maps, containerRef, options) {
  const [map, setMap] = useState(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!maps || !containerRef.current) return undefined;
    const instance = new maps.Map(containerRef.current, optionsRef.current);
    setMap(instance);
    return () => {
      maps.event?.clearInstanceListeners?.(instance);
      setMap(null);
    };
  }, [maps, containerRef]);

  return map;
}

/** Registra um listener do Google Maps e o remove na limpeza do efeito. */
export function useMapListener(map, eventName, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const enabled = Boolean(handler);

  useEffect(() => {
    if (!map || !enabled) return undefined;
    const listener = map.addListener(eventName, (...args) => handlerRef.current?.(...args));
    return () => listener.remove();
  }, [map, eventName, enabled]);
}
