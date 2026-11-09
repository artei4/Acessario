import { useState } from 'react';
import { Page } from '../components/layout/Page.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Notice, SectionTitle } from '../components/ui/Card.jsx';
import { FieldError, TextInput } from '../components/ui/Field.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { ThemeToggleButton } from '../components/ui/ThemeToggle.jsx';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Tela de entrada: pelo nome (cria a conta se não existir) ou por uma conta já usada neste aparelho. */
export function LoginPage({ navigate }) {
  const { signIn, switchTo, knownAccounts } = useCurrentUser();
  const toast = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(null); // nome digitado que não tem conta
  const [busy, setBusy] = useState(false);

  const finish = (user, created) => {
    toast.show(created ? `Conta criada. Bem-vindo, ${user.name}!` : `Olá de novo, ${user.name}!`);
    // conta nova vai para a escolha do perfil de mobilidade (o App cuida disso)
    if (!created) navigate('/buscar', undefined, { replace: true });
  };

  const run = async (create) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return setError('Digite seu nome (pelo menos 2 letras).');
    setError(null);
    setBusy(true);
    try {
      const result = await signIn(trimmed, { create });
      if (result.user) finish(result.user, result.created);
      else setNotFound(trimmed);
    } catch (err) {
      setError(err.userMessage ?? 'Não foi possível entrar. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page flush withNav={false}>
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
        <h1 className="text-2xl font-extrabold tracking-tight">Entrar</h1>
        <p className="m-0 text-ink-soft">Use seu nome. Se ainda não tiver conta, criamos uma na hora.</p>
      </div>

      <form
        className="flex flex-col gap-2.5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          run(false);
        }}
      >
        <label className="flex flex-col gap-1.5" htmlFor="login-name">
          <span className="text-sm font-bold">Seu nome</span>
        </label>
        <TextInput
          id="login-name"
          autoComplete="nickname"
          placeholder="Ex.: Maria"
          value={name}
          maxLength={40}
          onChange={(e) => {
            setName(e.target.value);
            setNotFound(null);
          }}
        />
        {error && <FieldError role="alert">{error}</FieldError>}

        {notFound ? (
          <Card variant="soft" className="flex flex-col gap-2" role="status">
            <p className="m-0 text-[13px]">
              Não encontramos uma conta com o nome <strong>“{notFound}”</strong>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => document.getElementById('login-name')?.focus()}>
                Corrigir o nome
              </Button>
              <Button onClick={() => run(true)} loading={busy}>
                Criar conta
              </Button>
            </div>
          </Card>
        ) : (
          <Button type="submit" size="lg" block loading={busy}>
            Entrar
          </Button>
        )}
      </form>

      {knownAccounts.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-labelledby="known-title">
          <SectionTitle id="known-title">Contas usadas neste aparelho</SectionTitle>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {knownAccounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface p-2.5 text-left hover:border-brand"
                  onClick={() => {
                    switchTo(account);
                    finish(account, false);
                  }}
                >
                  <span className="grid size-9 flex-none place-items-center rounded-full bg-brand font-extrabold text-on-brand" aria-hidden="true">
                    {account.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 font-bold">{account.name}</span>
                  <span className="text-[13px] font-semibold text-brand">Entrar</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Notice>
        Para testar a confirmação de relatos, entre com outro nome: a conta é criada na hora. Ninguém pode confirmar o próprio relato.
      </Notice>
      <p className="m-0 text-xs text-ink-soft">Protótipo: a entrada é só pelo nome, sem senha. Não use dados pessoais sensíveis.</p>
    </Page>
  );
}
