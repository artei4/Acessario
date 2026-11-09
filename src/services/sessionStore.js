/**
 * Sessão do aparelho: qual conta está ativa e quais contas já entraram aqui
 * (para trocar de conta com um toque). Fica no localStorage do navegador.
 *
 * `createSessionStore(storage)` recebe o armazenamento, o que permite testar sem navegador.
 */
const CURRENT_KEY = 'acessario:session:userId';
const KNOWN_KEY = 'acessario:session:known';
const MAX_KNOWN = 6;

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback; // aba anônima, cota cheia ou armazenamento bloqueado
  }
}

export function createSessionStore(storage) {
  const readKnown = () => safe(() => JSON.parse(storage.getItem(KNOWN_KEY)) ?? [], []);

  return {
    currentUserId: () => safe(() => storage.getItem(CURRENT_KEY), null),

    /** Contas que já entraram neste aparelho, da mais recente para a mais antiga: [{ id, name }]. */
    knownAccounts: readKnown,

    signIn(user) {
      const known = [{ id: user.id, name: user.name }, ...readKnown().filter((a) => a.id !== user.id)].slice(0, MAX_KNOWN);
      safe(() => {
        storage.setItem(CURRENT_KEY, user.id);
        storage.setItem(KNOWN_KEY, JSON.stringify(known));
      });
    },

    /** Atualiza o nome guardado (quando a pessoa edita o perfil). */
    rename(user) {
      const known = readKnown().map((a) => (a.id === user.id ? { ...a, name: user.name } : a));
      safe(() => storage.setItem(KNOWN_KEY, JSON.stringify(known)));
    },

    signOut() {
      safe(() => storage.removeItem(CURRENT_KEY));
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
