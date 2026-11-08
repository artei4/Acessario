import { useTheme } from '../../context/ThemeContext.jsx';
import { useGoogleMapsApi } from '../../hooks/useGoogleMapsApi.js';
import { Skeleton } from '../ui/States.jsx';
import { CityMap } from './CityMap.jsx';
import { GoogleRouteMap } from './GoogleRouteMap.jsx';
import { MapFrame } from './MapFrame.jsx';

/**
 * Mapa usado pelas telas. Usa a Google Maps JavaScript API quando há chave configurada;
 * sem chave (ou se o Google recusar), cai para o mapa esquemático em SVG.
 * As props são as mesmas nos dois casos.
 */
export function AccessMap(props) {
  const { status, maps } = useGoogleMapsApi();
  const { resolvedTheme } = useTheme();

  if (status === 'ready') {
    // remonta ao trocar o tema: o esquema de cores do Google só é lido na criação do mapa
    return <GoogleRouteMap key={resolvedTheme} maps={maps} colorScheme={resolvedTheme} {...props} />;
  }

  if (status === 'loading') {
    return (
      <MapFrame aspect={props.aspect} bleed={props.bleed} className={props.className}>
        <Skeleton className="size-full rounded-none" />
      </MapFrame>
    );
  }

  return (
    <CityMap {...props}>
      {props.children}
      {status === 'error' && (
        <span className="absolute right-2 bottom-2 z-10 rounded bg-glass px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
          Google Maps indisponível · mapa esquemático
        </span>
      )}
    </CityMap>
  );
}
