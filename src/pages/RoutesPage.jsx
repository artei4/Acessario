import { useEffect, useMemo, useState } from 'react';
import { CityMap } from '../components/map/CityMap.jsx';
import { endpointMarkers, toMapRoute } from '../components/map/mapAdapters.js';
import { RouteCard } from '../components/routes/RouteCard.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States.jsx';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useRouteOptions } from '../hooks/useRouteOptions.js';
import { useRecentSearches } from '../hooks/useRecentSearches.js';
import { usePlaces } from '../hooks/usePlaces.js';
import { getProfile } from '../domain/profiles.js';

/** Tela 3 — Rotas e mapa de acessibilidade. */
export function RoutesPage({ query, navigate, back }) {
  const { user } = useCurrentUser();
  const { searches, loading: loadingSearches } = useRecentSearches(user.id);
  const { byId } = usePlaces();

  // sem trajeto na URL, usa a última busca
  const originId = query.de ?? searches[0]?.originId;
  const destinationId = query.para ?? searches[0]?.destinationId;
  const { evaluations, loading, error, reload } = useRouteOptions(originId, destinationId);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (evaluations.length && !evaluations.some((e) => e.route.id === selectedId)) {
      setSelectedId(evaluations[0].route.id);
    }
  }, [evaluations, selectedId]);

  const mapRoutes = useMemo(
    () =>
      evaluations.map((e, i) =>
        toMapRoute(e, {
          emphasis: e.route.id === selectedId ? 'selected' : 'muted',
          label: String(e.route.name.match(/\d+/)?.[0] ?? i + 1),
        }),
      ),
    [evaluations, selectedId],
  );

  const open = (evaluation) =>
    navigate(`/rotas/${evaluation.route.id}`, {
      de: originId,
      para: destinationId,
      inverso: evaluation.route.reversed ? '1' : undefined,
    });

  if (!originId && !loadingSearches) {
    return (
      <div className="page">
        <EmptyState icon="routes" title="Nenhum trajeto escolhido">
          <Button onClick={() => navigate('/buscar')}>Buscar destino</Button>
        </EmptyState>
      </div>
    );
  }

  const origin = byId.get(originId);
  const destination = byId.get(destinationId);

  return (
    <div className="page page--flush">
      <div style={{ position: 'relative', margin: '0 -16px' }}>
        {evaluations.length > 0 ? (
          <CityMap
            className="map--bleed"
            routes={mapRoutes}
            markers={endpointMarkers(evaluations[0])}
            aspect={1.25}
            onSelectRoute={setSelectedId}
            showLegend
            legendPosition="right"
            label="Mapa com as rotas encontradas, coloridas pela acessibilidade de cada trecho"
          />
        ) : (
          <div className="skeleton" style={{ aspectRatio: 1.25, borderRadius: 0 }} />
        )}
        <button type="button" className="map__back" onClick={() => back('/buscar')} aria-label="Voltar para a busca">
          <Icon name="back" size={20} />
        </button>
      </div>

      <div className="row row--between">
        <h1 style={{ fontSize: 17 }}>Rotas para {user.name}</h1>
        <span className="tiny muted">Perfil: {getProfile(user.profile).label}</span>
      </div>
      {origin && destination && (
        <p className="small muted" style={{ margin: '-8px 0 0' }}>
          {origin.name} → {destination.name}
        </p>
      )}

      {loading && <LoadingState lines={3} height={150} />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && evaluations.length === 0 && (
        <EmptyState title="Ainda não há rotas mapeadas para esse trajeto">
          <Button variant="secondary" onClick={() => navigate('/perfil', { secao: 'contribuir' })}>
            Contribuir com o mapa
          </Button>
        </EmptyState>
      )}

      <div className="stack">
        {evaluations.map((evaluation) => (
          <RouteCard
            key={evaluation.route.id}
            evaluation={evaluation}
            selected={evaluation.route.id === selectedId}
            onSelect={setSelectedId}
            onOpen={open}
          />
        ))}
      </div>
    </div>
  );
}
