/**
 * Carregador da Google Maps JavaScript API.
 *
 * Versão legível do "Dynamic Library Import" recomendado pelo Google
 * (https://developers.google.com/maps/documentation/javascript/load-maps-js-api):
 * cria `google.maps.importLibrary`, que injeta o script uma única vez e carrega
 * cada biblioteca (maps, marker…) sob demanda.
 */

const SCRIPT_URL = 'https://maps.googleapis.com/maps/api/js';
const CALLBACK = '__acessarioMapsReady';

let bootstrapPromise = null;
let authFailed = false;
const authListeners = new Set();

/** O Google chama window.gm_authFailure quando a chave é inválida ou não tem a API ativada. */
function watchAuthFailure() {
  const previous = window.gm_authFailure;
  window.gm_authFailure = () => {
    authFailed = true;
    authListeners.forEach((listener) => listener());
    previous?.();
  };
}

export function onGoogleMapsAuthFailure(listener) {
  if (authFailed) listener();
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function injectBootstrap({ apiKey, version = 'weekly', language = 'pt-BR', region = 'BR' }) {
  const google = (window.google ??= {});
  const maps = (google.maps ??= {});
  if (maps.importLibrary) return; // já carregado (ou outra parte da página já preparou)

  const requested = new Set();
  let scriptPromise = null;

  const loadScript = () =>
    (scriptPromise ??= new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        key: apiKey,
        v: version,
        language,
        region,
        libraries: [...requested].join(','),
        callback: `google.maps.${CALLBACK}`,
        loading: 'async',
      });
      const script = document.createElement('script');
      script.src = `${SCRIPT_URL}?${params}`;
      script.async = true;
      script.onerror = () => reject(new Error('A Google Maps JavaScript API não pôde ser carregada.'));
      maps[CALLBACK] = resolve;
      document.head.append(script);
    }));

  // Até o script chegar, importLibrary só anota o pedido; depois o próprio Google o substitui.
  maps.importLibrary = (name, ...rest) => {
    requested.add(name);
    return loadScript().then(() => maps.importLibrary(name, ...rest));
  };
}

/**
 * Carrega as bibliotecas usadas pelo app e devolve o namespace `google.maps`.
 * @param {{ apiKey: string }} options
 */
export function loadGoogleMaps({ apiKey }) {
  if (!apiKey) return Promise.reject(new Error('Chave da Google Maps JavaScript API não configurada.'));
  if (!bootstrapPromise) {
    watchAuthFailure();
    injectBootstrap({ apiKey });
    bootstrapPromise = Promise.all([
      window.google.maps.importLibrary('maps'),
      window.google.maps.importLibrary('marker'),
    ]).then(() => window.google.maps);
    bootstrapPromise.catch(() => {
      bootstrapPromise = null; // permite tentar de novo
    });
  }
  return bootstrapPromise;
}
