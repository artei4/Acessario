/**
 * Criptografia da autenticação, com a Web Crypto (globalThis.crypto.subtle), que existe
 * no Node 20+ e nos navegadores. Assim o mesmo código roda no servidor local, na Vercel
 * e no modo demonstração.
 *
 * - Senhas: PBKDF2-SHA256 com sal aleatório. Só o hash é guardado, nunca a senha.
 * - Sessão: token assinado com HMAC-SHA256 ("dados.assinatura"), válido por 30 dias.
 *   O servidor confere a assinatura a cada gravação; não precisa guardar sessões.
 */

const ITERATIONS = 100_000;
const TOKEN_DAYS = 30;
const encoder = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;

export const MIN_PASSWORD_LENGTH = 6;

function toBase64Url(bytes) {
  let binary = '';
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Compara sem parar no primeiro byte diferente (evita vazar informação pelo tempo). */
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password, salt, iterations) {
  const key = await subtle().importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** @returns {Promise<{ algorithm, iterations, salt, hash }>} registro para guardar no banco */
export async function hashPassword(password) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return { algorithm: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64Url(salt), hash: toBase64Url(hash) };
}

export async function verifyPassword(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const hash = await pbkdf2(password, fromBase64Url(record.salt), record.iterations ?? ITERATIONS);
  return sameBytes(hash, fromBase64Url(record.hash));
}

async function hmacKey(secret) {
  return subtle().importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** Token de sessão para a conta `userId`. */
export async function createToken(userId, secret, now = Date.now()) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ sub: userId, exp: now + TOKEN_DAYS * 24 * 60 * 60 * 1000 })));
  const signature = await subtle().sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

/** Devolve o id da conta se o token for válido e não tiver vencido; senão, null. */
export async function verifyToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  try {
    const ok = await subtle().verify('HMAC', await hmacKey(secret), fromBase64Url(signature), encoder.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return typeof data.sub === 'string' && data.exp > now ? data.sub : null;
  } catch {
    return null;
  }
}
