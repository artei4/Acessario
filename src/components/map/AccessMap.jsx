import { config } from '../../config/env.js';
import { CityMap } from './CityMap.jsx';
import { LeafletRouteMap } from './LeafletRouteMap.jsx';

/**
 * Mapa usado pelas telas: OpenStreetMap (Leaflet) por padrão.
 * Com VITE_MAP_PROVIDER=schematic, usa o mapa esquemático em SVG, que não depende de internet.
 * As props são as mesmas nos dois casos, então as páginas não sabem qual está na tela.
 */
export function AccessMap(props) {
  if (config.mapProvider === 'schematic') return <CityMap {...props} />;
  return <LeafletRouteMap {...props} />;
}
