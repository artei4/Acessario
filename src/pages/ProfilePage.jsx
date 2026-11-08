import { useEffect, useRef, useState } from 'react';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Toggle } from '../components/ui/Toggle.jsx';
import { ErrorState, LoadingState } from '../components/ui/States.jsx';
import { MyReportItem } from '../components/reports/MyReportItem.jsx';
import { ContributeForm } from '../components/reports/ContributeForm.jsx';
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
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Editar perfil" onClose={onClose}>
      <label className="field">
        <span className="field__label">Nome</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </label>
      <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 6 }}>
        <legend className="field__label" style={{ marginBottom: 6 }}>Perfil de mobilidade</legend>
        {PROFILE_LIST.map((p) => (
          <label key={p.id} className="choice">
            <input type="radio" name="edit-profile" checked={profile === p.id} onChange={() => setProfile(p.id)} />
            <span>
              {p.label}
              <span className="tiny muted" style={{ display: 'block', fontWeight: 400 }}>{p.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="grid-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} loading={saving} disabled={!name.trim()}>Salvar</Button>
      </div>
    </Modal>
  );
}

/** Tela 6 — Perfil, preferências e contribuições. */
export function ProfilePage({ query, navigate }) {
  const { user, updateUser, setPreference } = useCurrentUser();
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
    <div className="page">
      <header className="row" style={{ flexWrap: 'nowrap' }}>
        <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18 }}>{user.name}</h1>
          <Badge tone="info">{getProfile(user.profile).label}</Badge>
        </div>
        <Button variant="ghost" onClick={() => setEditing(true)}>Editar</Button>
      </header>

      <section className="card stack" style={{ gap: 2 }} aria-labelledby="prefs-title">
        <h2 id="prefs-title" className="section-title" style={{ marginBottom: 4 }}>Preferências de rota</h2>
        {PREFERENCES.map((pref) => (
          <Toggle
            key={pref.key}
            label={pref.label}
            description={pref.description}
            checked={Boolean(user.preferences?.[pref.key])}
            onChange={(value) => togglePreference(pref.key, value)}
          />
        ))}
      </section>

      <div className="profile-columns">
        <section className="card stack" style={{ gap: 6, padding: 12 }} aria-labelledby="recent-title">
          <h2 id="recent-title" className="small strong">Rotas recentes</h2>
          {recent.searches.length === 0 && <p className="tiny muted" style={{ margin: 0 }}>Nenhuma busca ainda.</p>}
          <ul className="list-plain">
            {recent.searches.map((s) => (
              <li key={s.id} className="row" style={{ flexWrap: 'nowrap', gap: 2 }}>
                <button
                  type="button"
                  className="link-button tiny"
                  style={{ flex: 1 }}
                  onClick={() => navigate('/rotas', { de: s.originId, para: s.destinationId })}
                >
                  {byId.get(s.originId)?.name ?? '…'} → {byId.get(s.destinationId)?.name ?? '…'}
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remover das rotas recentes"
                  onClick={() => recent.remove(s.id).catch(() => toast.show('Não foi possível remover.', { tone: 'danger' }))}
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card stack" style={{ gap: 6, padding: 12 }} aria-labelledby="mine-title">
          <h2 id="mine-title" className="small strong">Meus relatos</h2>
          {mine.loading && <LoadingState lines={2} height={48} />}
          {mine.error && <ErrorState error={mine.error} onRetry={mine.reload} />}
          {!mine.loading && mine.reports.length === 0 && <p className="tiny muted" style={{ margin: 0 }}>Você ainda não relatou nada.</p>}
          <ul className="list-plain">
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
        </section>
      </div>

      <section ref={contributeRef} className="card card--highlight stack" style={{ gap: 12, scrollMarginTop: 12 }} aria-labelledby="contribute-title">
        <div className="row row--between">
          <h2 id="contribute-title" style={{ fontSize: 16 }}>Contribuir com o mapa</h2>
          <span className="tiny muted">Em qualquer lugar</span>
        </div>
        <ContributeForm onCreated={mine.reload} />
      </section>

      {apiClient.mode === 'local' && (
        <Button variant="ghost" onClick={resetDemo}>Restaurar dados de demonstração</Button>
      )}
    </div>
  );
}
