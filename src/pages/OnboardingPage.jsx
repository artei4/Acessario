import { useState } from 'react';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { PROFILE_LIST } from '../domain/profiles.js';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Tela 1 — Perfil de mobilidade. */
export function OnboardingPage({ navigate }) {
  const { user, updateUser } = useCurrentUser();
  const toast = useToast();
  const [profile, setProfile] = useState(user.profile ?? 'cadeirante');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateUser({ profile });
      navigate('/buscar');
    } catch (error) {
      toast.show(error.userMessage ?? 'Não foi possível salvar.', { tone: 'danger' });
      setSaving(false);
    }
  };

  return (
    <form className="page page--flush page--no-nav" onSubmit={handleSubmit}>
      <header className="hero">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Icon name="pin" size={40} strokeWidth={2.2} />
        </div>
        <p className="hero__logo" style={{ margin: 0 }}>
          Acessa<span>Rio</span>
        </p>
        <p className="hero__tagline" style={{ margin: 0 }}>Navegação urbana inclusiva</p>
      </header>

      <div className="stack" style={{ gap: 4, marginTop: 8 }}>
        <p className="muted" style={{ margin: 0 }}>Olá, {user.name}!</p>
        <h1 className="headline">Qual é o seu perfil de mobilidade?</h1>
      </div>

      <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
        <legend className="sr-only">Perfil de mobilidade</legend>
        {PROFILE_LIST.map((option) => (
          <label key={option.id} className="profile-option">
            <input type="radio" name="profile" value={option.id} checked={profile === option.id} onChange={() => setProfile(option.id)} />
            <span className="profile-option__icon"><Icon name={option.icon} size={24} /></span>
            <span className="profile-option__text">
              <span className="strong" style={{ display: 'block' }}>{option.label}</span>
              {profile === option.id && <span className="tiny muted">{option.description}</span>}
            </span>
            {profile === option.id && (
              <span className="profile-option__check" aria-hidden="true"><Icon name="check" size={16} strokeWidth={3} /></span>
            )}
          </label>
        ))}
      </fieldset>

      <div className="card card--soft">
        <p className="small strong" style={{ margin: 0 }}>Mapa feito por todos</p>
        <p className="tiny muted" style={{ margin: 0 }}>
          Relatos de outros usuários ajustam a nota e o tempo das suas rotas. Você pode mudar o perfil quando quiser.
        </p>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Button type="submit" size="lg" block loading={saving}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
