import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createToken, hashPassword, verifyPassword, verifyToken } from '../shared/auth.js';
import { handleApiRequest } from '../shared/api.js';
import { buildSeed } from '../shared/seed.js';

const secret = 'segredo-de-teste';
const call = (db, method, path, body, token) => handleApiRequest(db, { method, path, body, token }, { secret });

test('senha: só o hash é guardado e a verificação confere a senha certa', async () => {
  const record = await hashPassword('rampa123');
  assert.ok(!JSON.stringify(record).includes('rampa123'));
  assert.equal(await verifyPassword('rampa123', record), true);
  assert.equal(await verifyPassword('rampa124', record), false);
  const other = await hashPassword('rampa123');
  assert.notEqual(other.hash, record.hash, 'sal diferente a cada senha');
});

test('token: assinado, com validade, e recusado se adulterado', async () => {
  const token = await createToken('u-1', secret);
  assert.equal(await verifyToken(token, secret), 'u-1');
  assert.equal(await verifyToken(token, 'outro-segredo'), null);
  const [payload, sig] = token.split('.');
  assert.equal(await verifyToken(`${payload}x.${sig}`, secret), null);
  const old = await createToken('u-1', secret, Date.now() - 31 * 864e5);
  assert.equal(await verifyToken(old, secret), null, 'vence em 30 dias');
});

test('cadastro, entrada e senha errada', async () => {
  const db = buildSeed();
  const reg = await call(db, 'POST', '/auth/register', { name: 'Maria', password: 'segura1' });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);
  assert.equal(reg.body.user.name, 'Maria');
  assert.equal((await call(db, 'POST', '/auth/register', { name: 'maria', password: 'outra12' })).status, 409, 'nome repetido');
  assert.equal((await call(db, 'POST', '/auth/register', { name: 'Ana', password: '123' })).status, 422, 'senha curta');
  assert.equal((await call(db, 'POST', '/auth/login', { name: 'MARIA', password: 'segura1' })).status, 200);
  const wrong = await call(db, 'POST', '/auth/login', { name: 'Maria', password: 'errada' });
  assert.equal(wrong.status, 401);
  assert.equal((await call(db, 'POST', '/auth/login', { name: 'Ninguém', password: 'qualquer' })).status, 401, 'mesma mensagem para nome inexistente');
});

test('a coleção de senhas nunca sai da API e contas não são criadas pelo CRUD', async () => {
  const db = buildSeed();
  await call(db, 'POST', '/auth/register', { name: 'Maria', password: 'segura1' });
  assert.equal((await call(db, 'GET', '/credentials')).status, 404);
  const users = await call(db, 'GET', '/users');
  assert.ok(!JSON.stringify(users.body).includes('hash'));
  assert.equal((await call(db, 'POST', '/users', { name: 'Pirata' })).status, 403);
});

test('conta antiga (sem senha) pede para definir senha; depois disso, entra normalmente', async () => {
  const db = buildSeed();
  const login = await call(db, 'POST', '/auth/login', { name: 'José', password: 'qualquer1' });
  assert.equal(login.status, 409);
  assert.equal(login.body.code, 'needs_password');
  const claim = await call(db, 'POST', '/auth/claim', { name: 'jose', password: 'jose123' });
  assert.equal(claim.status, 200);
  assert.equal(claim.body.user.id, 'u-jose');
  assert.equal((await call(db, 'POST', '/auth/claim', { name: 'José', password: 'outra12' })).status, 409, 'não dá para trocar a senha de quem já tem');
  assert.equal((await call(db, 'POST', '/auth/login', { name: 'José', password: 'jose123' })).status, 200);
});

test('permissões: visitante lê e calcula rotas, mas não relata; cada um só mexe no que é seu', async () => {
  const db = buildSeed();
  const maria = (await call(db, 'POST', '/auth/register', { name: 'Maria', password: 'segura1' })).body;
  const ana = (await call(db, 'POST', '/auth/register', { name: 'Ana', password: 'segura2' })).body;
  const report = { segmentId: 'r1-t01', type: 'obra', kind: 'obstacle' };

  assert.equal((await call(db, 'GET', '/reports')).status, 200, 'leitura livre');
  assert.equal((await call(db, 'POST', '/places', { name: 'Praça', lat: -22.9, lon: -43.2 })).status, 201, 'visitante calcula rotas novas');
  assert.equal((await call(db, 'POST', '/reports', { ...report, userId: maria.user.id })).status, 401, 'visitante não relata');
  assert.equal((await call(db, 'POST', '/reports', { ...report, userId: ana.user.id }, maria.token)).status, 403, 'não relata em nome de outra pessoa');

  const created = await call(db, 'POST', '/reports', { ...report, userId: maria.user.id }, maria.token);
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal((await call(db, 'PATCH', `/reports/${id}`, { description: 'x' }, ana.token)).status, 403, 'Ana não edita relato da Maria');
  assert.equal((await call(db, 'DELETE', `/reports/${id}`, undefined, ana.token)).status, 403);
  assert.equal((await call(db, 'POST', '/votes', { reportId: id, userId: ana.user.id, type: 'confirm' }, ana.token)).status, 201, 'Ana confirma');
  assert.equal((await call(db, 'PATCH', `/users/${maria.user.id}`, { profile: 'idoso' }, ana.token)).status, 403, 'Ana não altera a conta da Maria');
  assert.equal((await call(db, 'PATCH', `/users/${maria.user.id}`, { profile: 'idoso' }, maria.token)).status, 200);
  assert.equal((await call(db, 'DELETE', `/reports/${id}`, undefined, maria.token)).status, 204, 'Maria apaga o próprio relato');
  assert.equal((await call(db, 'PATCH', '/users/u-jose', { name: 'x' }, 'token-falso.abc')).status, 401, 'token inválido = visitante');
});
