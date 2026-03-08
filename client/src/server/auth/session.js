import crypto from 'node:crypto';

export const SESSION_COOKIE_NAME = 'machine_shop_session';

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const DEFAULT_SESSION_SECRET = 'machine-shop-next-session-dev-secret';

function getSessionSecret() {
  return process.env.NEXT_AUTH_SESSION_SECRET || DEFAULT_SESSION_SECRET;
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(encodedPayload) {
  return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
}

function signPayload(encodedPayload) {
  return crypto.createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = encodePayload({
    ...user,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  });
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function readSessionToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (signPayload(payload) !== signature) {
    return null;
  }

  const decoded = decodePayload(payload);
  const now = Math.floor(Date.now() / 1000);

  if (!decoded.exp || decoded.exp < now) {
    return null;
  }

  return decoded;
}

export function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf('=');
      const key = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;
      const value = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : '';

      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

export function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const payload = readSessionToken(cookies[SESSION_COOKIE_NAME]);

  if (!payload) {
    return null;
  }

  const { iat, exp, ...user } = payload;
  return user;
}

export function buildSessionCookie(token) {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secureFlag}`;
}

export function clearSessionCookie() {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;
}
