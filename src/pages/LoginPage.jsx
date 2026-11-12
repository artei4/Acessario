import { useRef, useState } from 'react';
import { Page } from '../components/layout/Page.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Notice, SectionTitle } from '../components/ui/Card.jsx';
import { FieldError, TextInput } from '../components/ui/Field.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { ThemeToggleButton } from '../components/ui/ThemeToggle.jsx';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { MIN_PASSWORD_LENGTH } from '../../shared/auth.js';
import { AccessibilityQuickStart } from '../components/accessibility/AccessibilityControls.jsx';
import { useScreenAnnouncement } from '../context/AccessibilityContext.jsx';

const MODES = [
  { id: 'login', label: 'Entrar' },
  { id: 'register', label: 'Criar conta' },
];

const TITLES = {
  login: { title: 'Entrar', text: 'Use o nome e a senha da sua conta.', button: 'Entrar' },
  register: { title: 'Criar conta', text: 'Com uma conta você relata problemas e confirma relatos de outras pessoas.', button: 'Criar conta' },
  claim: { title: 'Definir senha', text: 'Esta conta foi criada antes das senhas existirem. Escolha uma senha para continuar.', button: 'Salvar senha e entrar' },
};

/** Tela de entrada: entrar com senha, criar conta, definir senha de conta antiga ou usar como visitante. */
export function LoginPage({ navigate }) {
  const { signIn, signUp, claim, enterAsGuest, knownAccounts } = useCurrentUser();
  const toast = useToast();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState(knownAccounts[0]?.name ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);

  const copy = TITLES[mode];
  const choosing = mode !== 'claim';
  useScreenAnnouncement(
    mode === 'claim'
      ? `Definir senha. ${copy.text}`
      : `AcessaRio, navegação urbana inclusiva. Tela de ${copy.title.toLowerCase()}. ${copy.text} Também dá para entrar sem conta, no fim da tela.`,
  );

  const changeMode = (next) => {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirm('');
  };

  const done = (user, created) => {
    toast.show(created ? `Conta criada. Bem-vindo, ${user.name}!` : `Olá, ${user.name}!`);
    // conta nova vai para a escolha do perfil de mobilidade (o App cuida disso)
    if (!created) navigate('/buscar', undefined, { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) return setError('Digite seu nome (pelo menos 2 letras).');
    if (password.length < (mode === 'login' ? 1 : MIN_PASSWORD_LENGTH)) {
      return setError(mode === 'login' ? 'Digite sua senha.' : `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    if (mode !== 'login' && password !== confirm) return setError('As duas senhas não são iguais.');
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const result = await signIn(name.trim(), password);
        if (result.needsPassword) {
          changeMode('claim');
          return;
        }
        done(result.user, false);
      } else if (mode === 'register') {
        done((await signUp(name.trim(), password)).user, true);
      } else {
        done((await claim(name.trim(), password)).user, false);
      }
    } catch (err) {
      setError(err.userMessage ?? 'Não foi possível entrar. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const useGuest = () => {
    enterAsGuest();
    toast.show('Você está usando o app como visitante.', { tone: 'info' });
  };

  return (
    <Page flush withNav={false}>
      <header className="relative -mx-4 overflow-hidden rounded-b-3xl bg-navy px-6 pt-10 pb-7 text-center text-on-navy">
        <ThemeToggleButton onDark className="absolute top-3 right-3" />
        <div className="mb-2 flex justify-center">
          <Icon name="pin" size={36} strokeWidth={2.2} />
        </div>
        <p className="m-0 text-[32px] font-extrabold tracking-tight">
          Acessa<span className="text-logo">Rio</span>
        </p>
        <p className="m-0 text-sm opacity-85">Navegação urbana inclusiva</p>
      </header>

      <AccessibilityQuickStart />

      {choosing && <Tabs tabs={MODES} value={mode} onChange={changeMode} label="Entrar ou criar conta" />}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{copy.title}</h1>
        <p className="m-0 text-ink-soft">{copy.text}</p>
      </div>

      <form className="flex flex-col gap-3" noValidate onSubmit={submit}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold" htmlFor="login-name">
            Nome
          </label>
          <TextInput
            id="login-name"
            autoComplete="username"
            placeholder="Ex.: Maria"
            value={name}
            maxLength={40}
            readOnly={mode === 'claim'}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold" htmlFor="login-password">
              {mode === 'login' ? 'Senha' : 'Nova senha'}
            </label>
            <button type="button" className="cursor-pointer text-xs font-semibold text-brand" aria-pressed={showPassword} onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            </button>
          </div>
          <TextInput
            id="login-password"
            ref={passwordRef}
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={mode === 'login' ? undefined : 'password-hint'}
          />
          {mode !== 'login' && (
            <span id="password-hint" className="text-xs text-ink-soft">
              Pelo menos {MIN_PASSWORD_LENGTH} caracteres.
            </span>
          )}
        </div>

        {mode !== 'login' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold" htmlFor="login-confirm">
              Repita a senha
            </label>
            <TextInput
              id="login-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        )}

        {error && <FieldError role="alert">{error}</FieldError>}

        <Button type="submit" size="lg" block loading={busy}>
          {copy.button}
        </Button>
        {mode === 'claim' && (
          <Button variant="ghost" onClick={() => changeMode('login')}>
            Voltar
          </Button>
        )}
      </form>

      {choosing && knownAccounts.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-labelledby="known-title">
          <SectionTitle id="known-title">Contas usadas neste aparelho</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {knownAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 text-[13px] font-semibold hover:border-brand"
                onClick={() => {
                  changeMode('login');
                  setName(account.name);
                  passwordRef.current?.focus();
                }}
              >
                <span className="grid size-7 place-items-center rounded-full bg-brand text-xs font-extrabold text-on-brand" aria-hidden="true">
                  {account.name.charAt(0).toUpperCase()}
                </span>
                {account.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {choosing && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <Button variant="secondary" block icon="user" onClick={useGuest}>
            Entrar sem conta
          </Button>
          <p className="m-0 text-center text-xs text-ink-soft">
            Como visitante você busca rotas e vê os relatos. Para relatar ou confirmar, é preciso uma conta.
          </p>
        </div>
      )}

      <Notice>A senha é guardada de forma protegida (só o resumo criptográfico, nunca a senha).</Notice>
    </Page>
  );
}
