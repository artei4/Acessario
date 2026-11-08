import { useEffect, useRef, useState } from 'react';
import { geocodingService } from '../services/geocodingService.js';

/**
 * Sugestões de lugares enquanto a pessoa digita.
 * - espera `delayMs` sem digitar antes de buscar;
 * - cancela a busca anterior quando o texto muda;
 * - guarda os resultados de cada termo, para não repetir a busca;
 * - mantém as sugestões anteriores na tela enquanto a nova busca carrega.
 *
 * @returns {{ term: string, results: object[], loading: boolean, error: Error|null }}
 */
export function useAddressAutocomplete(text, { enabled = true, minLength = 3, delayMs = 350 } = {}) {
  const [state, setState] = useState({ term: '', results: [], loading: false, error: null });
  const cache = useRef(new Map());
  const term = (text ?? '').trim();

  useEffect(() => {
    if (!enabled || term.length < minLength) {
      setState({ term, results: [], loading: false, error: null });
      return undefined;
    }
    const key = term.toLocaleLowerCase('pt-BR');
    if (cache.current.has(key)) {
      setState({ term, results: cache.current.get(key), loading: false, error: null });
      return undefined;
    }

    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    const timer = setTimeout(async () => {
      try {
        const results = await geocodingService.search(term, { signal: controller.signal });
        cache.current.set(key, results);
        setState({ term, results, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ term, results: [], loading: false, error });
      }
    }, delayMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, enabled, minLength, delayMs]);

  return state;
}
