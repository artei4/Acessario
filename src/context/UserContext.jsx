import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../api/client.js';
import { authService } from '../services/authService.js';
import { DEFAULT_PREFERENCES, usersService } from '../services/usersService.js';
import { GUEST, sessionStore } from '../services/sessionStore.js';
import { useAsync } from '../hooks/useAsync.js';

const UserContext = createContext(null);

/** Visitante: sem conta. Perfil e preferências ficam só neste aparelho. */
function guestUser() {
  const data = sessionStore.guestData();
  return { id: null, guest: true, name: 'Visitante', profile: data.profile ?? null, preferences: { ...DEFAULT_PREFERENCES, ...data.preferences } };
}

function initialSession() {
  const id = sessionStore.currentUserId();
  if (id === GUEST) return { mode: 'guest', userId: null };
  const token = sessionStore.token();
  if (id && token) {
    setAuthToken(token); // antes da primeira requisição
    return { mode: 'user', userId: id };
  }
  return { mode: 'none', userId: null };
}

/**
 * Conta ativa no aparelho.
 * - `signIn(nome, senha)`  entra; devolve { needsPassword } para contas antigas sem senha;
 * - `signUp(nome, senha)`  cria a conta e entra;
 * - `claim(nome, senha)`   define a senha de uma conta antiga e entra;
 * - `enterAsGuest()`       usa o app sem conta (só leitura; perfil e preferências locais);
 * - `signOut()`            sai (para voltar, é preciso a senha).
 */
export function UserProvider({ children }) {
  const [session, setSession] = useState(initialSession);
  const [guest, setGuest] = useState(guestUser);
  const [knownAccounts, setKnownAccounts] = useState(() => sessionStore.knownAccounts());

  // confere o token salvo e carrega a conta
  const { data, error, loading, setData, reload } = useAsync(async () => (await authService.me()).user, [session.userId], {
    enabled: session.mode === 'user',
  });

  const signOut = useCallback(() => {
    sessionStore.signOut();
    setAuthToken(null);
    setSession({ mode: 'none', userId: null });
  }, []);

  // token vencido ou conta que não existe mais: volta para a entrada
  useEffect(() => {
    if (error?.status === 401 || error?.status === 404) signOut();
  }, [error, signOut]);

  const start = useCallback(({ user, token }) => {
    sessionStore.signIn(user, token);
    setAuthToken(token);
    setKnownAccounts(sessionStore.knownAccounts());
    setSession({ mode: 'user', userId: user.id });
    return user;
  }, []);

  const signIn = useCallback(
    async (name, password) => {
      try {
        return { user: start(await authService.login(name, password)) };
      } catch (err) {
        if (err.code === 'needs_password') return { needsPassword: true };
        throw err;
      }
    },
    [start],
  );

  const signUp = useCallback(async (name, password) => ({ user: start(await authService.register(name, password)) }), [start]);
  const claim = useCallback(async (name, password) => ({ user: start(await authService.claim(name, password)) }), [start]);

  const enterAsGuest = useCallback(() => {
    sessionStore.enterAsGuest();
    setAuthToken(null);
    setGuest(guestUser());
    setSession({ mode: 'guest', userId: null });
  }, []);

  /** Atualização otimista: a tela muda na hora e volta atrás se a API falhar. Visitante salva só no aparelho. */
  const updateUser = useCallback(
    async (changes) => {
      if (session.mode === 'guest') {
        const next = { ...guest, ...changes };
        sessionStore.saveGuestData({ profile: next.profile, preferences: next.preferences });
        setGuest(next);
        return next;
      }
      const previous = data;
      setData((current) => ({ ...current, ...changes }));
      try {
        const saved = await usersService.update(session.userId, changes);
        setData(saved);
        if (changes.name) {
          sessionStore.rename(saved);
          setKnownAccounts(sessionStore.knownAccounts());
        }
        return saved;
      } catch (err) {
        setData(previous);
        throw err;
      }
    },
    [session, guest, data, setData],
  );

  const user = session.mode === 'guest' ? guest : session.mode === 'user' ? data : null;

  const setPreference = useCallback((key, value) => updateUser({ preferences: { ...user?.preferences, [key]: value } }), [updateUser, user]);

  const value = useMemo(
    () => ({
      user: user ?? null,
      signedIn: session.mode !== 'none',
      isGuest: session.mode === 'guest',
      error: error?.status === 401 || error?.status === 404 ? null : error,
      loading: session.mode === 'user' && loading,
      reload,
      updateUser,
      setPreference,
      signIn,
      signUp,
      claim,
      enterAsGuest,
      signOut,
      knownAccounts,
    }),
    [user, session.mode, error, loading, reload, updateUser, setPreference, signIn, signUp, claim, enterAsGuest, signOut, knownAccounts],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useCurrentUser precisa estar dentro de <UserProvider>');
  return context;
}
