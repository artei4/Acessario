import { useCallback, useMemo } from 'react';
import { placesService } from '../services/placesService.js';
import { useAsync } from './useAsync.js';

/** Lugares conhecidos pelo app, com busca por texto (sem acento e sem diferenciar maiúsculas). */
export function usePlaces() {
  const { data, error, loading } = useAsync(() => placesService.list(), []);
  const places = useMemo(() => data ?? [], [data]);
  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);

  const search = useCallback(
    (term) => {
      const normalize = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      const needle = normalize(term.trim());
      if (!needle) return places;
      return places.filter((p) => normalize(`${p.name} ${p.neighborhood}`).includes(needle));
    },
    [places],
  );

  return { places, byId, search, error, loading };
}
