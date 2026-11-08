import { useEffect, useState } from 'react';
import { Page } from '../components/layout/Page.jsx';
import { RioScene } from '../components/layout/RioScene.jsx';
import { PlaceInput } from '../components/routes/PlaceInput.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Notice } from '../components/ui/Card.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Skeleton } from '../components/ui/States.jsx';
import { ThemeToggleButton } from '../components/ui/ThemeToggle.jsx';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePlaces } from '../hooks/usePlaces.js';
import { useRecentSearches } from '../hooks/useRecentSearches.js';
import { useRouteOptions } from '../hooks/useRouteOptions.js';

const s = (n) => (n === 1 ? '' : 's');

function RecentReportsCard({ recent, loading }) {
  if (loading) return <Skeleton className="h-[76px]" />;
  if (!recent) return null;
  return (
    <Card as="section" variant="soft" className="flex flex-col gap-1.5" aria-label="Relatos recentes no trajeto">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold">Relatos recentes no trajeto</span>
        <Badge tone="info">
          {recent.total} {recent.total === 1 ? 'novo' : 'novos'}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="success">
          {recent.confirmado} confirmado{s(recent.confirmado)}
        </Badge>
        <Badge tone="warning">{recent.em_confirmacao} em confirmação</Badge>
        <Badge tone="neutral">
          {recent.nao_verificado} não verificado{s(recent.nao_verificado)}
        </Badge>
      </div>
      <span className="text-xs text-ink-soft">Dados fictícios de demonstração · últimos 3 dias</span>
    </Card>
  );
}

/** Tela 2 — Busca de destino. */
export function SearchPage({ navigate }) {
  const { user } = useCurrentUser();
  const toast = useToast();
  const { byId, search, places } = usePlaces();
  const { searches, record } = useRecentSearches(user.id);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { recent, loading, evaluations } = useRouteOptions(origin?.id, destination?.id);

  // começa com o último trajeto buscado
  useEffect(() => {
    if (origin || destination || searches.length === 0 || places.length === 0) return;
    setOrigin(byId.get(searches[0].originId) ?? null);
    setDestination(byId.get(searches[0].destinationId) ?? null);
  }, [searches, places, byId, origin, destination]);

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!origin || !destination) return toast.show('Escolha a origem e o destino.', { tone: 'danger' });
    if (origin.id === destination.id) return toast.show('Origem e destino precisam ser diferentes.', { tone: 'danger' });
    setSubmitting(true);
    try {
      await record(origin.id, destination.id);
    } catch {
      // a busca recente é um extra: não impede de ver as rotas
    }
    navigate('/rotas', { de: origin.id, para: destination.id });
  };

  const noRoutes = origin && destination && !loading && evaluations.length === 0 && origin.id !== destination.id;

  return (
    <Page>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="m-0 text-ink-soft">Olá, {user.name}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Para onde vamos?</h1>
        </div>
        <ThemeToggleButton />
      </div>

      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
        <PlaceInput label="Origem" iconClass="text-ok" value={origin} onChange={setOrigin} search={search} />
        <div className="-my-1.5 flex justify-end">
          <button type="button" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand" onClick={swap}>
            <Icon name="swap" size={14} /> Inverter
          </button>
        </div>
        <PlaceInput label="Destino" iconClass="text-bad" value={destination} onChange={setDestination} search={search} />
        <Button type="submit" size="lg" block loading={submitting}>
          Buscar rotas
        </Button>
      </form>

      {noRoutes ? (
        <Notice tone="warning">Ainda não há rotas mapeadas entre esses lugares. Você pode ajudar contribuindo com o mapa.</Notice>
      ) : (
        <RecentReportsCard recent={recent} loading={loading} />
      )}

      <RioScene />
    </Page>
  );
}
