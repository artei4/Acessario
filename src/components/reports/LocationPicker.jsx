import { useMemo, useState } from 'react';
import { CityMap } from '../map/CityMap.jsx';
import { Button } from '../ui/Button.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useGeocoding } from '../../hooks/useGeocoding.js';
import { nearestSegment } from '../../domain/geo.js';
import { segmentCode } from '../../domain/scoring.js';

/**
 * Escolha do ponto do relato: tocar/arrastar no mapa, setas do teclado,
 * localização do aparelho ou busca de endereço (API Nominatim).
 */
export function LocationPicker({ segments, point, onChange, hint = 'Arraste para ajustar o ponto', withAddressSearch = false, focus }) {
  const geocoding = useGeocoding();
  const [address, setAddress] = useState('');
  const [geoError, setGeoError] = useState(null);

  const nearest = useMemo(() => (point ? nearestSegment(point, segments) : null), [point, segments]);
  const mapRoutes = useMemo(
    () => [{ id: 'all', emphasis: 'normal', segments: segments.map((s) => ({ id: s.id, path: s.path, level: 'unknown', order: s.order })) }],
    [segments],
  );

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Seu navegador não oferece localização.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        if (!nearestSegment(p, segments, 400)) setGeoError('Você está fora da área mapeada. Marque o ponto no mapa.');
        else {
          setGeoError(null);
          onChange(p);
        }
      },
      () => setGeoError('Não foi possível obter sua localização.'),
      { timeout: 8000 },
    );
  };

  const searchAddress = async (event) => {
    event.preventDefault();
    const [first] = await geocoding.search(address);
    if (first) onChange([first.lat, first.lon]);
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <CityMap
        routes={mapRoutes}
        markers={point ? [{ id: 'pin', kind: 'pin', point }] : []}
        focus={focus}
        aspect={2.1}
        onPick={onChange}
        label="Mapa para marcar o local. Toque ou use as setas do teclado para mover o marcador."
      >
        <span className="map__hint">{point ? hint : 'Toque no mapa para marcar'}</span>
      </CityMap>

      <div className="row small" style={{ gap: 6 }}>
        <Icon name="locate" size={16} />
        {nearest ? (
          <span>
            <span className="strong" style={{ color: 'var(--green)' }}>{nearest.segment.street}</span>
            <span className="muted"> · {segmentCode(nearest.segment)}</span>
          </span>
        ) : (
          <span className="field__error" style={{ margin: 0 }}>Ponto fora dos trechos mapeados</span>
        )}
        <button type="button" className="link-button small" onClick={useDeviceLocation}>
          Usar minha localização
        </button>
      </div>
      {geoError && <span className="field__error">{geoError}</span>}

      {withAddressSearch && (
        <div className="stack" style={{ gap: 6 }}>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <label className="sr-only" htmlFor="address-search">Ou digite o endereço</label>
            <input
              id="address-search"
              className="input"
              placeholder="Ou digite o endereço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAddress(e)}
            />
            <Button variant="secondary" onClick={searchAddress} loading={geocoding.loading} disabled={!address.trim()}>
              Buscar
            </Button>
          </div>
          {geocoding.error && <span className="field__error">{geocoding.error.message}. Marque o ponto no mapa.</span>}
          {geocoding.searched && !geocoding.error && geocoding.results.length === 0 && (
            <span className="tiny muted">Nenhum endereço encontrado na área mapeada.</span>
          )}
          {geocoding.results.length > 1 && (
            <ul className="suggestions">
              {geocoding.results.map((r) => (
                <li key={`${r.lat},${r.lon}`}>
                  <button type="button" className="small" onClick={() => onChange([r.lat, r.lon])}>{r.label}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
