import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { PlaceInput } from '../components/routes/PlaceInput.jsx';
import { RioScene } from '../components/layout/RioScene.jsx';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePlaces } from '../hooks/usePlaces.js';
import { useRecentSearches } from '../hooks/useRecentSearches.js';
import { useRouteOptions } from '../hooks/useRouteOptions.js';

function RecentReportsCard({ recent, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 76 }} />;
  if (!recent) return null;
  return (
    <section className="card card--soft stack" style={{ gap: 6 }} aria-label="Relatos recentes no trajeto">
      <div className="row row--between">
        <span className="small strong">Relatos recentes no trajeto</span>
        <Badge tone="info">{recent.total} {recent.total === 1 ? 'novo' : 'novos'}</Badge>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <Badge tone="success">{recent.confirmado} confirmado{recent.confirmado === 1 ? '' : 's'}</Badge>
        <Badge tone="warning">{recent.em_confirmacao} em confirmação</Badge>
        <Badge tone="neutral">{recent.nao_verificado} não verificado{recent.nao_verificado === 1 ? '' : 's'}</Badge>
      </div>
      <span className="tiny muted">Dados fictícios de demonstração · últimos 3 dias</span>
    </section>
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
    <div className="page">
      <div className="stack" style={{ gap: 2 }}>
        <p className="muted" style={{ margin: 0 }}>Olá, {user.name}</p>
        <h1 className="headline">Para onde vamos?</h1>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <PlaceInput label="Origem" iconColor="var(--green)" value={origin} onChange={setOrigin} search={search} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-6px 0' }}>
          <button type="button" className="link-button tiny row" onClick={swap} style={{ gap: 4 }}>
            <Icon name="swap" size={14} /> Inverter
          </button>
        </div>
        <PlaceInput label="Destino" iconColor="var(--red)" value={destination} onChange={setDestination} search={search} />
        <Button type="submit" size="lg" block loading={submitting}>
          Buscar rotas
        </Button>
      </form>

      {noRoutes ? (
        <p className="notice notice--warning" style={{ margin: 0 }}>
          Ainda não há rotas mapeadas entre esses lugares. Você pode ajudar contribuindo com o mapa.
        </p>
      ) : (
        <RecentReportsCard recent={recent} loading={loading} />
      )}

      <RioScene />
    </div>
  );
}
