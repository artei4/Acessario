import { useEffect, useMemo, useState } from 'react';
import { Bleed, Page } from '../components/layout/Page.jsx';
import { MapBackButton } from '../components/layout/TopBar.jsx';
import { AccessMap } from '../components/map/AccessMap.jsx';
import { endpointMarkers, safetyMarkers, toMapRoute } from '../components/map/mapAdapters.js';
import { SafetyLayerToggle } from '../components/safety/SafetyLayerToggle.jsx';
import { RouteCard } from '../components/routes/RouteCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../components/ui/States.jsx';
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
  // plan: sem rota salva entre os dois lugares, calcula rotas a pé pelo OpenStreetMap e grava na API
  const { evaluations, loading, error, reload } = useRouteOptions(originId, destinationId, { plan: true });
  const [selectedId, setSelectedId] = useState(null);
  const [showSafety, setShowSafety] = useState(true);

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
      <Page>
        <EmptyState icon="routes" title="Nenhum trajeto escolhido">
          <Button onClick={() => navigate('/buscar')}>Buscar destino</Button>
        </EmptyState>
      </Page>
    );
  }

  const origin = byId.get(originId);
  const destination = byId.get(destinationId);
  const selected = evaluations.find((e) => e.route.id === selectedId) ?? evaluations[0];
  const safetyPoints = selected ? safetyMarkers(selected.safety) : [];

  return (
    <Page flush>
      <Bleed>
        {evaluations.length > 0 ? (
          <AccessMap
            bleed
            routes={mapRoutes}
            markers={[...endpointMarkers(evaluations[0]), ...(showSafety ? safetyPoints : [])]}
            aspect={1.25}
            onSelectRoute={setSelectedId}
            showLegend
            legendPosition="right"
            label="Mapa com as rotas encontradas, coloridas pela acessibilidade de cada trecho"
          >
            <SafetyLayerToggle on={showSafety} onChange={setShowSafety} count={safetyPoints.length} />
          </AccessMap>
        ) : (
          <Skeleton className="aspect-[1.25] rounded-none" />
        )}
        <MapBackButton onClick={() => back('/buscar')} label="Voltar para a busca" />
      </Bleed>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[17px] font-bold">Rotas para {user.name}</h1>
        <span className="text-xs text-ink-soft">Perfil: {getProfile(user.profile).label}</span>
      </div>
      {origin && destination && (
        <p className="-mt-2 mb-0 text-[13px] text-ink-soft">
          {origin.name} → {destination.name}
        </p>
      )}

      {loading && (
        <div className="flex flex-col gap-2" role="status">
          <p className="m-0 text-[13px] text-ink-soft">Procurando rotas a pé… Na primeira busca de um trajeto, o app calcula os caminhos pelo mapa do OpenStreetMap.</p>
          <LoadingState lines={3} height={150} />
        </div>
      )}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && evaluations.length === 0 && (
        <EmptyState title="Ainda não há rotas mapeadas para esse trajeto">
          <Button variant="secondary" onClick={() => navigate('/perfil', { secao: 'contribuir' })}>
            Contribuir com o mapa
          </Button>
        </EmptyState>
      )}

      <div className="flex flex-col gap-2.5">
        {evaluations.map((evaluation) => (
          <RouteCard key={evaluation.route.id} evaluation={evaluation} selected={evaluation.route.id === selectedId} onSelect={setSelectedId} onOpen={open} />
        ))}
      </div>
    </Page>
  );
}
