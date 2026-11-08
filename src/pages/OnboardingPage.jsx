import { useState } from 'react';
import { Page } from '../components/layout/Page.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { ThemeToggleButton } from '../components/ui/ThemeToggle.jsx';
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
    <Page as="form" flush withNav={false} onSubmit={handleSubmit}>
      <header className="relative -mx-4 overflow-hidden rounded-b-3xl bg-navy px-6 pt-12 pb-8 text-center text-on-navy">
        <ThemeToggleButton onDark className="absolute top-3 right-3" />
        <div className="mb-2 flex justify-center">
          <Icon name="pin" size={40} strokeWidth={2.2} />
        </div>
        <p className="m-0 text-[34px] font-extrabold tracking-tight">
          Acessa<span className="text-logo">Rio</span>
        </p>
        <p className="m-0 text-sm opacity-85">Navegação urbana inclusiva</p>
      </header>

      <div className="mt-2 flex flex-col gap-1">
        <p className="m-0 text-ink-soft">Olá, {user.name}!</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-balance">Qual é o seu perfil de mobilidade?</h1>
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="sr-only">Perfil de mobilidade</legend>
        {PROFILE_LIST.map((option) => {
          const checked = profile === option.id;
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-line bg-surface p-3.5 has-checked:border-2 has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
            >
              <input type="radio" name="profile" value={option.id} className="sr-only" checked={checked} onChange={() => setProfile(option.id)} />
              <span className="flex text-brand">
                <Icon name={option.icon} size={24} />
              </span>
              <span className="flex-1">
                <span className="block font-bold">{option.label}</span>
                {checked && <span className="text-xs text-ink-soft">{option.description}</span>}
              </span>
              {checked && (
                <span className="grid size-6 place-items-center rounded-full bg-brand text-on-brand" aria-hidden="true">
                  <Icon name="check" size={16} strokeWidth={3} />
                </span>
              )}
            </label>
          );
        })}
      </fieldset>

      <Card variant="soft">
        <p className="m-0 text-[13px] font-bold">Mapa feito por todos</p>
        <p className="m-0 text-xs text-ink-soft">Relatos de outros usuários ajustam a nota e o tempo das suas rotas. Você pode mudar o perfil quando quiser.</p>
      </Card>

      <div className="mt-auto">
        <Button type="submit" size="lg" block loading={saving}>
          Continuar
        </Button>
      </div>
    </Page>
  );
}
