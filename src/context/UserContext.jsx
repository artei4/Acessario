import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { config } from '../config/env.js';
import { usersService } from '../services/usersService.js';
import { sessionStore } from '../services/sessionStore.js';
import { useAsync } from '../hooks/useAsync.js';

const UserContext = createContext(null);

/**
 * Conta ativa no aparelho.
 * - `signIn(nome)` entra numa conta existente com esse nome ou cria uma nova;
 * - `switchTo(id)` troca para uma conta que já entrou neste aparelho;
 * - `signOut()` sai da conta (ela continua na lista do aparelho).
 * Protótipo: a entrada é só pelo nome, sem senha.
 */
export function UserProvider({ children }) {
  const [userId, setUserId] = useState(() => sessionStore.currentUserId() ?? config.currentUserId ?? null);
  const [knownAccounts, setKnownAccounts] = useState(() => sessionStore.knownAccounts());
  const { data: user, error, loading, setData, reload } = useAsync(() => usersService.getById(userId), [userId], {
    enabled: Boolean(userId),
  });

  // conta salva no aparelho que não existe mais na API (banco recriado): volta para a entrada
  useEffect(() => {
    if (error?.status === 404) {
      sessionStore.signOut();
      sessionStore.forget(userId);
      setKnownAccounts(sessionStore.knownAccounts());
      setUserId(null);
    }
  }, [error, userId]);

  const enter = useCallback((account) => {
    sessionStore.signIn(account);
    setKnownAccounts(sessionStore.knownAccounts());
    setUserId(account.id);
  }, []);

  /** Entra pelo nome. Devolve { user, created } (created = conta nova). */
  const signIn = useCallback(
    async (name, { create = false } = {}) => {
      const existing = await usersService.findByName(name);
      if (existing) {
        enter(existing);
        return { user: existing, created: false };
      }
      if (!create) return { user: null, created: false };
      const created = await usersService.create(name);
      enter(created);
      return { user: created, created: true };
    },
    [enter],
  );

  const switchTo = useCallback((account) => enter(account), [enter]);

  const signOut = useCallback(() => {
    sessionStore.signOut();
    setUserId(null);
  }, []);

  /** Atualização otimista: a tela muda na hora e volta atrás se a API falhar. */
  const updateUser = useCallback(
    async (changes) => {
      const previous = user;
      setData((current) => ({ ...current, ...changes }));
      try {
        const saved = await usersService.update(userId, changes);
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
    [user, userId, setData],
  );

  const setPreference = useCallback(
    (key, value) => updateUser({ preferences: { ...user?.preferences, [key]: value } }),
    [updateUser, user],
  );

  const value = useMemo(
    () => ({
      user: userId ? user : null,
      signedIn: Boolean(userId),
      error: error?.status === 404 ? null : error,
      loading: Boolean(userId) && loading,
      reload,
      updateUser,
      setPreference,
      signIn,
      switchTo,
      signOut,
      knownAccounts,
    }),
    [user, userId, error, loading, reload, updateUser, setPreference, signIn, switchTo, signOut, knownAccounts],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useCurrentUser precisa estar dentro de <UserProvider>');
  return context;
}
