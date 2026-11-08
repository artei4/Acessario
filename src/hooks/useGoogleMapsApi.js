import { useEffect, useState } from 'react';
import { config } from '../config/env.js';
import { loadGoogleMaps, onGoogleMapsAuthFailure } from '../services/googleMapsLoader.js';

/**
 * Estado do carregamento da Google Maps JavaScript API.
 *   status: 'disabled' (sem chave) | 'loading' | 'ready' | 'error'
 *   maps:   namespace google.maps quando pronto
 */
export function useGoogleMapsApi() {
  const { apiKey } = config.googleMaps;
  const [state, setState] = useState(() => (apiKey ? { status: 'loading', maps: null, error: null } : { status: 'disabled', maps: null, error: null }));

  useEffect(() => {
    if (!apiKey) return undefined;
    let active = true;
    loadGoogleMaps({ apiKey })
      .then((maps) => active && setState({ status: 'ready', maps, error: null }))
      .catch((error) => active && setState({ status: 'error', maps: null, error }));

    const stopWatching = onGoogleMapsAuthFailure(() => {
      if (active) setState({ status: 'error', maps: null, error: new Error('Chave do Google Maps recusada. Verifique a chave e a API ativada.') });
    });
    return () => {
      active = false;
      stopWatching();
    };
  }, [apiKey]);

  return state;
}
