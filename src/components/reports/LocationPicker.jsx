import { useMemo, useState } from 'react';
import { AccessMap } from '../map/AccessMap.jsx';
import { MapHint } from '../map/MapFrame.jsx';
import { Icon } from '../ui/Icon.jsx';
import { FieldError } from '../ui/Field.jsx';
import { PlaceSearchBox } from '../places/PlaceSearchBox.jsx';
import { SNAP_DISTANCE_M, nearestSegment } from '../../domain/geo.js';
import { segmentCode } from '../../domain/scoring.js';

/** Visão geral da cidade quando ainda não há trechos para enquadrar. */
const RIO_FRAME = [
  [-23.03, -43.6],
  [-22.85, -43.15],
];
const ROUTE_DISTANCE_M = 150;

function around({ lat, lon }, d = 0.0025) {
  return [
    [lat - d, lon - d],
    [lat + d, lon + d],
  ];
}

/**
 * Escolha do ponto do relato: tocar/arrastar no mapa, setas do teclado,
 * localização do aparelho ou busca de endereço com sugestões (Photon / OpenStreetMap).
 *
 * - `anywhere`: qualquer ponto da cidade é aceito (Contribuir com o mapa). Perto de um trecho salvo,
 *   mostra o trecho; longe, mostra o nome do lugar.
 * - sem `anywhere`: o ponto precisa estar na rota (relato feito a partir de uma rota).
 *
 * `onChange(point, place)` recebe o lugar escolhido na busca, ou null quando o ponto veio do mapa.
 */
export function LocationPicker({ segments, point, onChange, hint = 'Arraste para ajustar o ponto', withAddressSearch = false, anywhere = false, focus }) {
  const [geoError, setGeoError] = useState(null);
  const [chosenPlace, setChosenPlace] = useState(null);
  const [frameAround, setFrameAround] = useState(null);

  const nearest = useMemo(
    () => (point ? nearestSegment(point, segments, anywhere ? SNAP_DISTANCE_M : ROUTE_DISTANCE_M) : null),
    [point, segments, anywhere],
  );

  // o mapa enquadra o endereço escolhido, o trecho em foco ou a área mapeada — nunca o alfinete,
  // para não "pular" a cada toque
  const frame = useMemo(() => {
    if (frameAround) return around(frameAround);
    if (focus) return focus;
    const paths = segments.flatMap((s) => s.path);
    return paths.length ? paths : RIO_FRAME;
  }, [frameAround, focus, segments]);

  const mapRoutes = useMemo(
    () => [{ id: 'all', emphasis: 'normal', segments: segments.map((s) => ({ id: s.id, path: s.path, level: 'unknown', order: s.order })) }],
    [segments],
  );

  const pickOnMap = (p) => {
    setChosenPlace(null);
    onChange(p, null);
  };

  const chooseAddress = (place) => {
    setChosenPlace(place);
    setFrameAround(place);
    onChange([place.lat, place.lon], place);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Seu navegador não oferece localização.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        if (!anywhere && !nearestSegment(p, segments, 400)) {
          setGeoError('Você está longe desta rota. Marque o ponto no mapa.');
          return;
        }
        setGeoError(null);
        setFrameAround({ lat: p[0], lon: p[1] });
        pickOnMap(p);
      },
      () => setGeoError('Não foi possível obter sua localização. Verifique a permissão do navegador.'),
      { timeout: 8000 },
    );
  };

  let status;
  if (nearest) {
    status = (
      <span>
        <span className="font-bold text-ok">{nearest.segment.street}</span>
        <span className="text-ink-soft"> · {segmentCode(nearest.segment)}</span>
      </span>
    );
  } else if (point && anywhere) {
    status = <span className="font-bold">{chosenPlace?.name ?? 'Ponto marcado no mapa'}</span>;
  } else if (point) {
    status = <FieldError>Ponto fora da rota. Marque um ponto sobre as linhas.</FieldError>;
  } else {
    status = <span className="text-ink-soft">{anywhere ? 'Toque no mapa ou busque um endereço' : 'Marque um ponto sobre a rota'}</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <AccessMap
        routes={mapRoutes}
        markers={point ? [{ id: 'pin', kind: 'pin', point }] : []}
        focus={frame}
        aspect={2.1}
        onPick={pickOnMap}
        label="Mapa para marcar o local. Toque ou use as setas do teclado para mover o marcador."
      >
        <MapHint>{point ? hint : 'Toque no mapa para marcar'}</MapHint>
      </AccessMap>

      <div className="flex flex-wrap items-center gap-1.5 text-[13px]" aria-live="polite">
        <Icon name="locate" size={16} />
        {status}
        <button type="button" className="cursor-pointer font-semibold text-brand" onClick={useDeviceLocation}>
          Usar minha localização
        </button>
      </div>
      {point && anywhere && !nearest && (
        <p className="m-0 text-xs text-ink-soft">Ponto novo no mapa: o relato vale para qualquer rota que passar por aqui.</p>
      )}
      {geoError && <FieldError>{geoError}</FieldError>}

      {withAddressSearch && (
        <PlaceSearchBox
          inputId="address-search"
          label="Ou digite o endereço"
          placeholder="Ou digite um endereço ou lugar do Rio"
          displayValue={chosenPlace ? chosenPlace.name : ''}
          onSelect={chooseAddress}
          icon="locate"
        />
      )}
    </div>
  );
}
