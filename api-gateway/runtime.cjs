'use strict';
const { randomUUID } = require('node:crypto');
function requestLog(service, replaceId = false) {
  return (req, res, next) => {
    const supplied = req.headers['x-request-id'];
    req.requestId = !replaceId && typeof supplied === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(supplied)
      ? supplied : randomUUID();
    req.headers['x-request-id'] = req.requestId;
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const start = Date.now();
    // Nao registrar senhas, tokens, corpo JSON nem parametros da query.
    const path = req.path;
    res.on('finish', () => console.log(JSON.stringify({service, requestId: req.requestId,
      method: req.method, path, status: res.statusCode, durationMs: Date.now() - start})));
    next();
  };
}
function errors(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.type === 'entity.parse.failed' ? 400 : err.type === 'entity.too.large' ? 413
    : Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  const message = status === 400 ? 'JSON ou parametros invalidos' : status === 413
    ? 'Corpo da requisicao muito grande' : status < 500 ? err.message : 'Erro interno do servidor';
  if (status >= 500) console.error(JSON.stringify({event:'internal_error', requestId:req.requestId, message:err.message}));
  res.status(status).json({error:message, requestId:req.requestId});
}
function start(app, port, service) {
  const server = app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({service, event:'listening', port})));
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.on('error', err => { console.error(err.message); process.exit(1); });
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  });
  return server;
}
module.exports = { requestLog, errors, start };
