import { useCallback, useState } from 'react';
import { geocodingService } from '../services/geocodingService.js';

/** Busca de endereço sob demanda na API externa de geocodificação. */
export function useGeocoding() {
  const [state, setState] = useState({ results: [], loading: false, error: null, searched: false });

  const search = useCallback(async (address) => {
    if (!address.trim()) return [];
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const results = await geocodingService.search(address);
      setState({ results, loading: false, error: null, searched: true });
      return results;
    } catch (error) {
      setState({ results: [], loading: false, error, searched: true });
      return [];
    }
  }, []);

  const clear = useCallback(() => setState({ results: [], loading: false, error: null, searched: false }), []);

  return { ...state, search, clear };
}
