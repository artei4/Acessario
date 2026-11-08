import { useMemo, useState } from 'react';
import { AccessMap } from '../map/AccessMap.jsx';
import { MapHint } from '../map/MapFrame.jsx';
import { Button } from '../ui/Button.jsx';
import { Icon } from '../ui/Icon.jsx';
import { FieldError, TextInput } from '../ui/Field.jsx';
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
  // enquadra sempre a área mapeada (ou o trecho em foco), e não o alfinete, para o mapa não pular a cada toque
  const frame = useMemo(() => focus ?? segments.flatMap((s) => s.path), [focus, segments]);
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
    <div className="flex flex-col gap-2">
      <AccessMap
        routes={mapRoutes}
        markers={point ? [{ id: 'pin', kind: 'pin', point }] : []}
        focus={frame}
        aspect={2.1}
        onPick={onChange}
        label="Mapa para marcar o local. Toque ou use as setas do teclado para mover o marcador."
      >
        <MapHint>{point ? hint : 'Toque no mapa para marcar'}</MapHint>
      </AccessMap>

      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        <Icon name="locate" size={16} />
        {nearest ? (
          <span>
            <span className="font-bold text-ok">{nearest.segment.street}</span>
            <span className="text-ink-soft"> · {segmentCode(nearest.segment)}</span>
          </span>
        ) : point ? (
          <FieldError>Ponto fora dos trechos mapeados</FieldError>
        ) : (
          <span className="text-ink-soft">Marque um ponto sobre um trecho (linhas tracejadas)</span>
        )}
        <button type="button" className="cursor-pointer font-semibold text-brand" onClick={useDeviceLocation}>
          Usar minha localização
        </button>
      </div>
      {geoError && <FieldError>{geoError}</FieldError>}

      {withAddressSearch && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="address-search">
              Ou digite o endereço
            </label>
            <TextInput
              id="address-search"
              placeholder="Ou digite o endereço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAddress(e)}
            />
            <Button variant="secondary" onClick={searchAddress} loading={geocoding.loading} disabled={!address.trim()}>
              Buscar
            </Button>
          </div>
          {geocoding.error && <FieldError>{geocoding.error.message}. Marque o ponto no mapa.</FieldError>}
          {geocoding.searched && !geocoding.error && geocoding.results.length === 0 && (
            <span className="text-xs text-ink-soft">Nenhum endereço encontrado na área mapeada.</span>
          )}
          {geocoding.results.length > 1 && (
            <ul className="m-0 list-none rounded-lg border border-line bg-surface p-1 shadow-soft">
              {geocoding.results.map((r) => (
                <li key={`${r.lat},${r.lon}`}>
                  <button type="button" className="w-full cursor-pointer rounded-md px-2.5 py-2 text-left text-[13px] hover:bg-brand-soft" onClick={() => onChange([r.lat, r.lon])}>
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
