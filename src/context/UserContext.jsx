import { createContext, useCallback, useContext, useMemo } from 'react';
import { config } from '../config/env.js';
import { usersService } from '../services/usersService.js';
import { useAsync } from '../hooks/useAsync.js';

const UserContext = createContext(null);

export function UserProvider({ children, userId = config.currentUserId }) {
  const { data: user, error, loading, setData, reload } = useAsync(() => usersService.getById(userId), [userId]);

  /** Atualização otimista: a tela muda na hora e volta atrás se a API falhar. */
  const updateUser = useCallback(
    async (changes) => {
      const previous = user;
      setData((current) => ({ ...current, ...changes }));
      try {
        const saved = await usersService.update(userId, changes);
        setData(saved);
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
    () => ({ user, error, loading, reload, updateUser, setPreference }),
    [user, error, loading, reload, updateUser, setPreference],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useCurrentUser precisa estar dentro de <UserProvider>');
  return context;
}
