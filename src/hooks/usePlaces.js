import { useCallback, useMemo } from 'react';
import { placesService } from '../services/placesService.js';
import { useAsync } from './useAsync.js';

/** Lugares conhecidos pelo app, com busca por texto (sem acento e sem diferenciar maiúsculas). */
export function usePlaces() {
  const { data, error, loading, reload } = useAsync(() => placesService.list(), []);
  const places = useMemo(() => data ?? [], [data]);
  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);

  const search = useCallback(
    (term) => {
      const normalize = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      const needle = normalize(term.trim());
      const matches = needle ? places.filter((p) => normalize(`${p.name} ${p.neighborhood ?? ''}`).includes(needle)) : places;
      return matches.slice(0, 8);
    },
    [places],
  );

  /** Grava na API um lugar vindo da busca de endereços (se ainda não existir) e atualiza a lista. */
  const ensure = useCallback(
    async (place) => {
      const saved = await placesService.ensure(place);
      if (!place.id) await reload();
      return saved;
    },
    [reload],
  );

  return { places, byId, search, ensure, error, loading };
}
