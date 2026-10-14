'use strict';
function bearerToken(header) {
  if (typeof header !== 'string' || header.length > 8200) return null;
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(header);
  return match ? match[1] : null;
}
function positiveInteger(value, name, fallback, maximum) {
  const text = value === undefined ? String(fallback) : String(value);
  if (!/^[1-9][0-9]*$/.test(text)) throw new Error(name + ' deve ser inteiro positivo');
  const number = Number(text);
  if (!Number.isSafeInteger(number) || number > maximum) throw new Error(name + ' fora do intervalo permitido');
  return number;
}
function upstream(value, fallback) {
  const url = new URL(value || fallback);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('Upstream deve conter somente protocolo, host e porta');
  return url.origin;
}
function config(env = process.env) {
  return {
    port: positiveInteger(env.PORT, 'PORT', 8080, 65535),
    timeout: positiveInteger(env.UPSTREAM_TIMEOUT_MS, 'UPSTREAM_TIMEOUT_MS', 3000, 30000),
    authUrl: upstream(env.AUTH_URL, 'http://auth-service:3002'),
    catalogUrl: upstream(env.CATALOG_URL, 'http://catalog-service:3001')
  };
}
module.exports = { bearerToken, positiveInteger, upstream, config };
