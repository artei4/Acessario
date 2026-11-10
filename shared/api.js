/**
 * Camada da API acima do núcleo REST: autenticação e permissões.
 *
 * Rotas de conta (não passam pelo CRUD genérico):
 *   POST /auth/register  { name, password }  cria a conta          → { user, token }
 *   POST /auth/login     { name, password }  entra                 → { user, token }
 *   POST /auth/claim     { name, password }  define a senha de uma conta antiga, criada antes das senhas
 *   GET  /auth/me        (com token)         conta do token
 *
 * Regras das demais rotas (CRUD genérico de restCore.js):
 *   - leitura é livre, exceto a coleção `credentials` (hashes de senha), que nunca sai da API;
 *   - contas só são criadas por /auth/register (POST /users é recusado);
 *   - relatos, votos e buscas: criar exige token, e o `userId` do corpo tem de ser o do token;
 *     editar e apagar, só o dono;
 *   - conta: editar e apagar, só a própria;
 *   - lugares, rotas e trechos: criar é livre (visitantes também calculam rotas novas);
 *     editar e apagar exige estar logado.
 */
import { handleRequest } from './restCore.js';
import { MIN_PASSWORD_LENGTH, createToken, hashPassword, verifyPassword, verifyToken } from './auth.js';

const OWNED = new Set(['reports', 'votes', 'searches']);
const OPEN_CREATE = new Set(['places', 'routes', 'segments']);
const PRIVATE = new Set(['credentials']);

const DEFAULT_PREFERENCES = { avoidStairs: true, preferFlat: false, includeSupportPoints: true, avoidUnsafe: false };

const fail = (status, error) => ({ status, body: { error }, changed: false });

/** Compara nomes sem diferenciar maiúsculas, acentos e espaços extras. */
export function normalizeName(name = '') {
  return String(name).normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Usuário sem campos internos, para devolver ao app. */
const publicUser = (user) => user && { ...user };

function findUserByName(db, name) {
  const wanted = normalizeName(name);
  return (db.users ?? []).find((u) => normalizeName(u.name) === wanted) ?? null;
}

function credentialOf(db, userId) {
  return (db.credentials ?? []).find((c) => c.userId === userId) ?? null;
}

function validName(name) {
  const clean = String(name ?? '').trim().replace(/\s+/g, ' ');
  return clean.length >= 2 && clean.length <= 40 ? clean : null;
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH && password.length <= 200;
}

async function session(user, secret) {
  return { status: 200, body: { user: publicUser(user), token: await createToken(user.id, secret) }, changed: false };
}

async function handleAuth(db, { method, path, body = {} }, { secret, userId }) {
  const action = path.replace(/^\/auth\/?/, '').replace(/\/$/, '');
  db.credentials ??= [];

  if (method === 'GET' && action === 'me') {
    if (!userId) return fail(401, 'Entre na sua conta.');
    const user = db.users.find((u) => u.id === userId);
    return user ? { status: 200, body: { user: publicUser(user) }, changed: false } : fail(401, 'Conta não encontrada.');
  }
  if (method !== 'POST') return fail(405, 'Método não permitido');

  const name = validName(body.name);
  if (!name) return fail(422, 'O nome precisa ter entre 2 e 40 letras.');
  const user = findUserByName(db, name);

  if (action === 'login') {
    const credential = user && credentialOf(db, user.id);
    if (user && !credential) return { status: 409, body: { error: 'Esta conta foi criada antes das senhas. Defina uma senha para ela.', code: 'needs_password' }, changed: false };
    if (!user || !(await verifyPassword(String(body.password ?? ''), credential))) return fail(401, 'Nome ou senha incorretos.');
    return session(user, secret);
  }

  if (!validPassword(body.password)) return fail(422, `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);

  if (action === 'register') {
    if (user) return fail(409, 'Já existe uma conta com esse nome. Entre com a senha ou escolha outro nome.');
    const created = { id: `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, name, profile: null, preferences: DEFAULT_PREFERENCES, createdAt: new Date().toISOString() };
    db.users.push(created);
    db.credentials.push({ id: `cred-${created.id}`, userId: created.id, ...(await hashPassword(body.password)) });
    const result = await session(created, secret);
    return { ...result, status: 201, changed: true };
  }

  if (action === 'claim') {
    if (!user) return fail(404, 'Não existe conta com esse nome.');
    if (credentialOf(db, user.id)) return fail(409, 'Esta conta já tem senha. Entre com ela.');
    db.credentials.push({ id: `cred-${user.id}`, userId: user.id, ...(await hashPassword(body.password)) });
    const result = await session(user, secret);
    return { ...result, changed: true };
  }

  return fail(404, 'Rota não encontrada');
}

function parse(path) {
  const [collection, id] = path.replace(/^\/+|\/+$/g, '').split('/');
  return { collection, id };
}

/** Confere permissões de uma requisição ao CRUD genérico. Devolve um erro ou null. */
export function authorize(db, { method, path, body = {} }, userId) {
  const verb = method.toUpperCase();
  const { collection, id } = parse(path);
  if (PRIVATE.has(collection)) return fail(404, `Coleção "${collection}" não existe`);
  if (verb === 'GET') return null;

  if (collection === 'users') {
    if (verb === 'POST') return fail(403, 'Crie contas pela tela de entrada.');
    if (!userId) return fail(401, 'Entre na sua conta para continuar.');
    if (id !== userId) return fail(403, 'Você só pode alterar a sua própria conta.');
    if (body.id && body.id !== userId) return fail(403, 'Não é possível trocar o id da conta.');
    return null;
  }

  if (OPEN_CREATE.has(collection)) {
    if (verb === 'POST') return null;
    return userId ? null : fail(401, 'Entre na sua conta para continuar.');
  }

  if (OWNED.has(collection)) {
    if (!userId) return fail(401, 'Entre com uma conta para relatar, confirmar ou salvar buscas.');
    if (verb === 'POST') return body.userId === userId ? null : fail(403, 'O relato precisa ser da sua conta.');
    const item = (db[collection] ?? []).find((x) => x.id === id);
    if (!item) return null; // o núcleo REST responde 404
    if (item.userId !== userId) return fail(403, 'Você só pode alterar o que é seu.');
    if (body.userId && body.userId !== userId) return fail(403, 'Não é possível passar para outra conta.');
    return null;
  }

  return userId ? null : fail(401, 'Entre na sua conta para continuar.');
}

/**
 * Executa uma requisição da API (autenticação + permissões + CRUD).
 * @param {object} db
 * @param {{ method, path, query, body, token }} request
 * @param {{ secret: string }} options
 */
export async function handleApiRequest(db, request, { secret }) {
  const userId = request.token ? await verifyToken(request.token, secret) : null;
  if (request.path.replace(/^\/+/, '').startsWith('auth')) return handleAuth(db, request, { secret, userId });

  const denied = authorize(db, request, userId);
  if (denied) return denied;

  // ao apagar a conta, apaga também a senha
  const result = handleRequest(db, request);
  if (result.changed && request.method.toUpperCase() === 'DELETE' && parse(request.path).collection === 'users') {
    db.credentials = (db.credentials ?? []).filter((c) => c.userId !== parse(request.path).id);
  }
  return result;
}

/** Lê o token do cabeçalho Authorization ("Bearer <token>"). */
export function tokenFromHeader(header) {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? '');
  return match ? match[1].trim() : null;
}
