import { useCallback } from 'react';
import { searchesService } from '../services/searchesService.js';
import { useAsync } from './useAsync.js';

/** Buscas recentes do usuário: listar, registrar e remover. */
export function useRecentSearches(userId) {
  const { data, error, loading, reload, setData } = useAsync(() => searchesService.listByUser(userId), [userId], {
    enabled: Boolean(userId),
  });

  const record = useCallback(
    async (originId, destinationId) => {
      await searchesService.record({ userId, originId, destinationId });
      reload();
    },
    [userId, reload],
  );

  const remove = useCallback(
    async (id) => {
      setData((list) => list?.filter((s) => s.id !== id));
      try {
        await searchesService.remove(id);
      } catch (error) {
        reload();
        throw error;
      }
    },
    [setData, reload],
  );

  return { searches: data ?? [], error, loading, record, remove };
}
