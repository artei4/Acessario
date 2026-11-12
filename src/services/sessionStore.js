/**
 * Sessão do aparelho (localStorage):
 *  - conta ativa e o token dela, ou o modo visitante;
 *  - contas que já entraram aqui (só id e nome, para preencher o nome na entrada);
 *  - perfil e preferências do visitante, que ficam só neste aparelho.
 *
 * `createSessionStore(storage)` recebe o armazenamento, o que permite testar sem navegador.
 */
const CURRENT_KEY = 'acessario:session:userId';
const TOKEN_KEY = 'acessario:session:token';
const KNOWN_KEY = 'acessario:session:known';
const GUEST_KEY = 'acessario:session:guest';
const MAX_KNOWN = 6;

export const GUEST = 'guest';

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback; // aba anônima, cota cheia ou armazenamento bloqueado
  }
}

export function createSessionStore(storage) {
  const readJson = (key, fallback) => safe(() => JSON.parse(storage.getItem(key)) ?? fallback, fallback);
  const readKnown = () => readJson(KNOWN_KEY, []);

  return {
    /** Id da conta ativa, GUEST para visitante, ou null. */
    currentUserId: () => safe(() => storage.getItem(CURRENT_KEY), null),
    token: () => safe(() => storage.getItem(TOKEN_KEY), null),

    /** Contas que já entraram neste aparelho, da mais recente para a mais antiga: [{ id, name }]. */
    knownAccounts: readKnown,

    signIn(user, token) {
      const known = [{ id: user.id, name: user.name }, ...readKnown().filter((a) => a.id !== user.id)].slice(0, MAX_KNOWN);
      safe(() => {
        storage.setItem(CURRENT_KEY, user.id);
        if (token) storage.setItem(TOKEN_KEY, token);
        storage.setItem(KNOWN_KEY, JSON.stringify(known));
      });
    },

    enterAsGuest() {
      safe(() => {
        storage.setItem(CURRENT_KEY, GUEST);
        storage.removeItem(TOKEN_KEY);
      });
    },

    /** Dados do visitante, só neste aparelho: { profile, preferences, lastTrip }. */
    guestData: () => readJson(GUEST_KEY, {}),
    /** Junta as mudanças aos dados já salvos do visitante. */
    saveGuestData(changes) {
      const next = { ...readJson(GUEST_KEY, {}), ...changes };
      safe(() => storage.setItem(GUEST_KEY, JSON.stringify(next)));
    },

    /** Atualiza o nome guardado (quando a pessoa edita o perfil). */
    rename(user) {
      const known = readKnown().map((a) => (a.id === user.id ? { ...a, name: user.name } : a));
      safe(() => storage.setItem(KNOWN_KEY, JSON.stringify(known)));
    },

    /** Sai da conta: apaga o token; para voltar, é preciso a senha. */
    signOut() {
      safe(() => {
        storage.removeItem(CURRENT_KEY);
        storage.removeItem(TOKEN_KEY);
      });
    },

    forget(userId) {
      safe(() => storage.setItem(KNOWN_KEY, JSON.stringify(readKnown().filter((a) => a.id !== userId))));
    },
  };
}

/** Armazenamento em memória, usado quando o navegador não oferece localStorage. */
function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

export const sessionStore = createSessionStore(
  safe(() => (typeof window !== 'undefined' && window.localStorage ? window.localStorage : memoryStorage()), memoryStorage()),
);
