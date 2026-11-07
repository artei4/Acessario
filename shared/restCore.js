/**
 * Núcleo REST genérico, sem dependências de Node ou do navegador.
 *
 * É usado de dois jeitos:
 *  - pelo servidor HTTP (server/index.js), que persiste o banco em server/db.json;
 *  - pelo cliente "local" do front (src/api/localClient.js), que persiste em localStorage.
 *
 * Assim o comportamento da API é exatamente o mesmo nos dois modos.
 *
 * Rotas suportadas para cada coleção do banco:
 *   GET    /:colecao                  lista (filtros ?campo=valor, ?campo=a&campo=b, _sort, _order, _limit, q)
 *   GET    /:colecao/:id              item
 *   POST   /:colecao                  cria
 *   PUT    /:colecao/:id              substitui
 *   PATCH  /:colecao/:id              atualiza parcialmente
 *   DELETE /:colecao/:id              remove (com remoção em cascata configurada em CASCADE)
 */

/** Ao remover um item, remove também os dependentes: coleção -> [[coleçãoFilha, campoFK]] */
export const CASCADE = {
  reports: [['votes', 'reportId']],
  users: [
    ['votes', 'userId'],
    ['searches', 'userId'],
  ],
};

/** Campos obrigatórios na criação, por coleção. */
export const REQUIRED_FIELDS = {
  reports: ['segmentId', 'type', 'kind', 'userId'],
  votes: ['reportId', 'userId', 'type'],
  searches: ['userId', 'originId', 'destinationId'],
  users: ['name'],
};

const ID_PREFIX = {
  reports: 'rep',
  votes: 'vot',
  searches: 'src',
  users: 'u',
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function generateId(collection) {
  const prefix = ID_PREFIX[collection] ?? collection.slice(0, 3);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${random}`;
}

function parsePath(path) {
  const clean = path.split('?')[0].replace(/^\/+|\/+$/g, '');
  const [collection, id, ...rest] = clean.split('/').map(decodeURIComponent);
  if (rest.length > 0) throw new HttpError(404, 'Rota não encontrada');
  return { collection, id };
}

/** Converte "true"/"false"/números vindos da query string para comparação justa. */
function matches(itemValue, queryValues) {
  return queryValues.some((qv) => String(itemValue) === String(qv));
}

function applyListQuery(items, query = {}) {
  let result = items;

  for (const [key, raw] of Object.entries(query)) {
    if (key.startsWith('_') || key === 'q') continue;
    const values = Array.isArray(raw) ? raw : [raw];
    result = result.filter((item) => matches(item[key], values));
  }

  if (query.q) {
    const term = String(query.q).toLocaleLowerCase('pt-BR');
    result = result.filter((item) =>
      Object.values(item).some(
        (v) => typeof v === 'string' && v.toLocaleLowerCase('pt-BR').includes(term),
      ),
    );
  }

  if (query._sort) {
    const field = String(query._sort);
    const dir = query._order === 'desc' ? -1 : 1;
    result = [...result].sort((a, b) => (a[field] > b[field] ? dir : a[field] < b[field] ? -dir : 0));
  }

  if (query._limit) result = result.slice(0, Number(query._limit));
  return result;
}

function validateBody(collection, body, { partial = false } = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'O corpo da requisição deve ser um objeto JSON');
  }
  if (partial) return;
  const missing = (REQUIRED_FIELDS[collection] ?? []).filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === '',
  );
  if (missing.length > 0) {
    throw new HttpError(422, `Campos obrigatórios ausentes: ${missing.join(', ')}`);
  }
}

function removeCascade(db, collection, id) {
  for (const [child, fk] of CASCADE[collection] ?? []) {
    if (!db[child]) continue;
    const doomed = db[child].filter((item) => item[fk] === id);
    db[child] = db[child].filter((item) => item[fk] !== id);
    doomed.forEach((item) => removeCascade(db, child, item.id));
  }
}

/**
 * Executa uma requisição sobre o banco em memória.
 * @param {object} db         banco ({ colecao: [itens] }); é alterado no lugar
 * @param {object} request    { method, path, query, body }
 * @returns {{ status: number, body: any, changed: boolean }}
 */
export function handleRequest(db, { method, path, query = {}, body }) {
  try {
    const { collection, id } = parsePath(path);
    if (!collection || !Array.isArray(db[collection])) {
      throw new HttpError(404, `Coleção "${collection}" não existe`);
    }
    const items = db[collection];
    const index = id ? items.findIndex((item) => item.id === id) : -1;
    const verb = method.toUpperCase();

    if (verb === 'GET' && !id) return { status: 200, body: applyListQuery(items, query), changed: false };

    if (verb === 'POST' && !id) {
      validateBody(collection, body);
      if (body.id && items.some((item) => item.id === body.id)) {
        throw new HttpError(409, 'Já existe um item com esse id');
      }
      const created = { ...body, id: body.id ?? generateId(collection) };
      items.push(created);
      return { status: 201, body: created, changed: true };
    }

    if (!id) throw new HttpError(405, 'Método não permitido nesta rota');
    if (index === -1) throw new HttpError(404, 'Item não encontrado');

    switch (verb) {
      case 'GET':
        return { status: 200, body: items[index], changed: false };
      case 'PUT':
        validateBody(collection, body);
        items[index] = { ...body, id };
        return { status: 200, body: items[index], changed: true };
      case 'PATCH':
        validateBody(collection, body, { partial: true });
        items[index] = { ...items[index], ...body, id };
        return { status: 200, body: items[index], changed: true };
      case 'DELETE':
        items.splice(index, 1);
        removeCascade(db, collection, id);
        return { status: 204, body: null, changed: true };
      default:
        throw new HttpError(405, 'Método não permitido');
    }
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return { status, body: { error: error.message }, changed: false };
  }
}

/** Lê uma query string ("a=1&a=2&b=3") para objeto, agrupando chaves repetidas em arrays. */
export function parseQueryString(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const query = {};
  for (const [key, value] of params) {
    if (key in query) query[key] = [].concat(query[key], value);
    else query[key] = value;
  }
  return query;
}
