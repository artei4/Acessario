import { useMemo, useState } from 'react';
import { AccessMap } from '../map/AccessMap.jsx';
import { MapHint } from '../map/MapFrame.jsx';
import { Icon } from '../ui/Icon.jsx';
import { FieldError } from '../ui/Field.jsx';
import { PlaceSearchBox } from '../places/PlaceSearchBox.jsx';
import { nearestSegment } from '../../domain/geo.js';
import { segmentCode } from '../../domain/scoring.js';

/**
 * Escolha do ponto do relato: tocar/arrastar no mapa, setas do teclado,
 * localização do aparelho ou busca de endereço com sugestões (Photon / OpenStreetMap).
 */
export function LocationPicker({ segments, point, onChange, hint = 'Arraste para ajustar o ponto', withAddressSearch = false, focus }) {
  const [geoError, setGeoError] = useState(null);
  const [chosenPlace, setChosenPlace] = useState(null);

  const nearest = useMemo(() => (point ? nearestSegment(point, segments) : null), [point, segments]);
  // enquadra sempre a área mapeada (ou o trecho em foco), e não o alfinete, para o mapa não pular a cada toque
  // depois de escolher um endereço, aproxima o mapa dele
  const frame = useMemo(() => {
    if (chosenPlace) {
      const d = 0.0025;
      return [
        [chosenPlace.lat - d, chosenPlace.lon - d],
        [chosenPlace.lat + d, chosenPlace.lon + d],
      ];
    }
    return focus ?? segments.flatMap((s) => s.path);
  }, [chosenPlace, focus, segments]);
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

  const chooseAddress = (place) => {
    setChosenPlace(place);
    onChange([place.lat, place.lon]);
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
        <div className="flex flex-col gap-1">
          <PlaceSearchBox
            inputId="address-search"
            label="Ou digite o endereço"
            placeholder="Ou digite um endereço ou lugar do Rio"
            displayValue={chosenPlace ? chosenPlace.name : ''}
            onSelect={chooseAddress}
            icon="locate"
          />
          {chosenPlace && point && !nearest && (
            <span className="text-xs text-ink-soft">
              Ainda não há trechos mapeados perto desse endereço. Busque uma rota que passe por ele na tela Mapa para poder relatar aqui.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
