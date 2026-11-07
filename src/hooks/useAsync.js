import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Executa uma função assíncrona quando as dependências mudam e expõe o estado da chamada.
 * Ignora respostas atrasadas de chamadas antigas (ex.: a pessoa trocou de rota no meio do carregamento).
 *
 * @returns {{ data, error, loading, reload, setData }}
 */
export function useAsync(asyncFn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, loading: enabled });
  const callId = useRef(0);
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const run = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++callId.current;
      if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fnRef.current();
        if (id === callId.current) setState({ data, error: null, loading: false });
        return data;
      } catch (error) {
        if (id === callId.current) setState((s) => ({ ...s, error, loading: false }));
        return undefined;
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      setState({ data: undefined, error: null, loading: false });
      return undefined;
    }
    run();
    return () => {
      callId.current += 1; // invalida a chamada em andamento
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  /** Recarrega sem piscar a tela (mantém os dados atuais enquanto busca). */
  const reload = useCallback(() => run({ silent: true }), [run]);

  return { ...state, reload, setData };
}
