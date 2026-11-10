import { useEffect, useRef, useState } from 'react';
import { Page } from '../components/layout/Page.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, SectionTitle } from '../components/ui/Card.jsx';
import { TextInput } from '../components/ui/Field.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Toggle } from '../components/ui/Toggle.jsx';
import { ThemeSelector } from '../components/ui/ThemeToggle.jsx';
import { ErrorState, LoadingState } from '../components/ui/States.jsx';
import { MyReportItem } from '../components/reports/MyReportItem.jsx';
import { ContributeForm } from '../components/reports/ContributeForm.jsx';
import { RequireAccount } from '../components/layout/RequireAccount.jsx';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useMyReports } from '../hooks/useMyReports.js';
import { useRecentSearches } from '../hooks/useRecentSearches.js';
import { usePlaces } from '../hooks/usePlaces.js';
import { useReportActions } from '../hooks/useReportActions.js';
import { PROFILE_LIST, getProfile } from '../domain/profiles.js';
import { apiClient } from '../api/client.js';

const PREFERENCES = [
  { key: 'avoidStairs', label: 'Evitar escadas', description: 'Rotas com escadas não são recomendadas.' },
  { key: 'preferFlat', label: 'Priorizar rotas planas', description: 'Inclinação pesa 50% mais na nota.' },
  { key: 'includeSupportPoints', label: 'Incluir pontos de apoio', description: 'Mostra bancos, farmácias e similares.' },
  { key: 'avoidUnsafe', label: 'Evitar trechos com alerta de segurança', description: 'Rotas com ocorrências recentes graves não são recomendadas.' },
];

function EditProfileModal({ user, onSave, onClose }) {
  const [name, setName] = useState(user.name);
  const [profile, setProfile] = useState(user.profile ?? 'cadeirante');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), profile });
      onClose();
    } catch {
      setSaving(false);
    }
  };
  return (
    <Modal title="Editar perfil" onClose={onClose}>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">Nome</span>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </label>
      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-sm font-bold">Perfil de mobilidade</legend>
        {PROFILE_LIST.map((p) => (
          <label
            key={p.id}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-[1.5px] border-line p-2.5 text-[13px] font-semibold has-checked:border-brand has-checked:bg-brand-soft"
          >
            <input type="radio" name="edit-profile" className="accent-brand" checked={profile === p.id} onChange={() => setProfile(p.id)} />
            <span>
              {p.label}
              <span className="block text-xs font-normal text-ink-soft">{p.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={save} loading={saving} disabled={!name.trim()}>
          Salvar
        </Button>
      </div>
    </Modal>
  );
}

/** Tela 6 — Perfil, preferências e contribuições. */
export function ProfilePage({ query, navigate }) {
  const { user, isGuest, updateUser, setPreference, signOut } = useCurrentUser();
  const toast = useToast();
  const { byId } = usePlaces();
  const recent = useRecentSearches(user.id);
  const mine = useMyReports(user.id);
  const actions = useReportActions({ onChange: mine.reload });
  const [editing, setEditing] = useState(false);
  const contributeRef = useRef(null);

  useEffect(() => {
    if (query.secao === 'contribuir') contributeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [query.secao]);

  const togglePreference = async (key, value) => {
    try {
      await setPreference(key, value);
    } catch (error) {
      toast.show(error.userMessage ?? 'Não foi possível salvar a preferência.', { tone: 'danger' });
    }
  };

  const saveProfile = async (changes) => {
    try {
      await updateUser(changes);
      toast.show('Perfil atualizado. As notas das rotas foram recalculadas.');
    } catch (error) {
      toast.show(error.userMessage ?? 'Não foi possível salvar.', { tone: 'danger' });
      throw error;
    }
  };

  const resetDemo = () => {
    apiClient.reset();
    window.location.reload();
  };

  return (
    <Page>
      <header className="flex items-center gap-2">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-brand font-extrabold text-on-brand" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{user.name}</h1>
          <div className="flex flex-wrap gap-1">
            <Badge tone="info">{getProfile(user.profile).label}</Badge>
            {isGuest && <Badge tone="neutral">Sem conta</Badge>}
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button
            variant="ghost-danger"
            icon="logout"
            onClick={() => {
              signOut();
              toast.show(isGuest ? 'Você saiu do modo visitante.' : 'Você saiu da conta.', { tone: 'info' });
            }}
          >
            Sair
          </Button>
        </div>
      </header>

      <Card as="section" className="flex flex-col gap-0.5" aria-labelledby="prefs-title">
        <SectionTitle id="prefs-title" className="mb-1">
          Preferências de rota
        </SectionTitle>
        {PREFERENCES.map((pref) => (
          <Toggle
            key={pref.key}
            label={pref.label}
            description={pref.description}
            checked={Boolean(user.preferences?.[pref.key])}
            onChange={(value) => togglePreference(pref.key, value)}
          />
        ))}
      </Card>

      <Card as="section" className="flex flex-col gap-2" aria-labelledby="theme-title">
        <SectionTitle id="theme-title">Aparência</SectionTitle>
        <ThemeSelector />
        <p className="m-0 text-xs text-ink-soft">Automático segue o tema do seu aparelho.</p>
      </Card>

      {isGuest ? (
        <RequireAccount action="salvar rotas recentes e ver seus relatos" />
      ) : (
      <div className="grid grid-cols-1 items-start gap-2 min-[381px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card as="section" className="flex flex-col gap-1.5 p-3" aria-labelledby="recent-title">
          <h2 id="recent-title" className="text-[13px] font-bold">
            Rotas recentes
          </h2>
          {recent.searches.length === 0 && <p className="m-0 text-xs text-ink-soft">Nenhuma busca ainda.</p>}
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {recent.searches.map((s) => (
              <li key={s.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  className="flex-1 cursor-pointer text-left text-xs font-semibold text-brand"
                  onClick={() => navigate('/rotas', { de: s.originId, para: s.destinationId })}
                >
                  {byId.get(s.originId)?.name ?? '…'} → {byId.get(s.destinationId)?.name ?? '…'}
                </button>
                <IconButton
                  icon="close"
                  size={14}
                  label="Remover das rotas recentes"
                  onClick={() => recent.remove(s.id).catch(() => toast.show('Não foi possível remover.', { tone: 'danger' }))}
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card as="section" className="flex flex-col gap-1.5 p-3" aria-labelledby="mine-title">
          <h2 id="mine-title" className="text-[13px] font-bold">
            Meus relatos
          </h2>
          {mine.loading && <LoadingState lines={2} height={48} />}
          {mine.error && <ErrorState error={mine.error} onRetry={mine.reload} />}
          {!mine.loading && mine.reports.length === 0 && <p className="m-0 text-xs text-ink-soft">Você ainda não relatou nada.</p>}
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {mine.reports.map((report) => (
              <MyReportItem
                key={report.id}
                report={report}
                busy={actions.pending === `update:${report.id}` || actions.pending === `delete:${report.id}`}
                onUpdate={(id, changes) => actions.updateReport(id, changes).catch(() => {})}
                onDelete={(id) => actions.deleteReport(id).catch(() => {})}
              />
            ))}
          </ul>
        </Card>
      </div>
      )}

      <Card as="section" variant="highlight" ref={contributeRef} className="flex scroll-mt-3 flex-col gap-3" aria-labelledby="contribute-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="contribute-title" className="text-base font-bold">
            Contribuir com o mapa
          </h2>
          <span className="text-xs text-ink-soft">Em qualquer lugar</span>
        </div>
        <RequireAccount action="contribuir com o mapa">
          <ContributeForm onCreated={mine.reload} />
        </RequireAccount>
      </Card>

      {apiClient.mode === 'local' && (
        <Button variant="ghost" onClick={resetDemo}>
          Restaurar dados de demonstração
        </Button>
      )}

      {editing && <EditProfileModal user={user} onSave={saveProfile} onClose={() => setEditing(false)} />}
    </Page>
  );
}
