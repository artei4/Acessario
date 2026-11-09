import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStore } from '../src/services/sessionStore.js';
import { normalizeName } from '../src/services/usersService.js';

function fakeStorage() {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
}

test('entrar guarda a conta ativa e a lista de contas do aparelho', () => {
  const session = createSessionStore(fakeStorage());
  assert.equal(session.currentUserId(), null);
  session.signIn({ id: 'u-jose', name: 'José' });
  session.signIn({ id: 'u-maria', name: 'Maria' });
  assert.equal(session.currentUserId(), 'u-maria');
  assert.deepEqual(session.knownAccounts().map((a) => a.name), ['Maria', 'José'], 'mais recente primeiro');
});

test('sair encerra a sessão, mas a conta continua na lista para entrar de novo', () => {
  const session = createSessionStore(fakeStorage());
  session.signIn({ id: 'u-jose', name: 'José' });
  session.signOut();
  assert.equal(session.currentUserId(), null);
  assert.deepEqual(session.knownAccounts(), [{ id: 'u-jose', name: 'José' }]);
  session.signIn({ id: 'u-jose', name: 'José' });
  assert.equal(session.knownAccounts().length, 1, 'não duplica');
});

test('renomear e esquecer contas', () => {
  const session = createSessionStore(fakeStorage());
  session.signIn({ id: 'u-1', name: 'Ana' });
  session.rename({ id: 'u-1', name: 'Ana Paula' });
  assert.equal(session.knownAccounts()[0].name, 'Ana Paula');
  session.forget('u-1');
  assert.deepEqual(session.knownAccounts(), []);
});

test('armazenamento bloqueado não quebra o app', () => {
  const broken = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('bloqueado'); } };
  const session = createSessionStore(broken);
  assert.doesNotThrow(() => session.signIn({ id: 'u', name: 'X' }));
  assert.equal(session.currentUserId(), null);
  assert.deepEqual(session.knownAccounts(), []);
});

test('nomes são comparados sem maiúsculas, acentos e espaços extras', () => {
  assert.equal(normalizeName('  José   da Silva '), 'jose da silva');
  assert.equal(normalizeName('JOSE'), normalizeName('josé'));
});
