'use strict';
const express = require('express');
// Importar a fabrica, nao uma instancia ja criada.
const httpProxy = require('http-proxy');
const { bearerToken, config } = require('./core.cjs');
const { requestLog, errors, start } = require('./runtime.cjs');
const cfg = config();
const app = express();
app.disable('x-powered-by');
app.use(requestLog('api-gateway', true));
// IMPORTANTE: sem express.json() antes do proxy. O stream original e encaminhado.
// trust proxy permanece false: esta demo nao esta atras de outro proxy confiavel.

function proxyTo(target, service) {
  const proxy = httpProxy.createProxyServer({target, changeOrigin:true,
    proxyTimeout:cfg.timeout, timeout:cfg.timeout + 1000});
  proxy.on('error', (err, req, res) => {
    if (res.headersSent || res.writableEnded || res.destroyed) return;
    const status = ['ETIMEDOUT','ESOCKETTIMEDOUT','ECONNRESET'].includes(err.code) ? 504 : 503;
    res.status(status).json({error:service + ' indisponivel', requestId:req.requestId});
  });
  return proxy;
}
const authProxy = proxyTo(cfg.authUrl, 'auth-service');
const catalogProxy = proxyTo(cfg.catalogUrl, 'catalog-service');

app.get('/health', (req, res) => res.json({status:'healthy', service:'api-gateway',
  scope:'process', uptime:process.uptime()}));

// Prontidao agregada: verifica respostas de saude das duas dependencias.
app.get('/ready', async (req, res) => {
  const checks = await Promise.all([
    ['auth-service', cfg.authUrl], ['catalog-service', cfg.catalogUrl]
  ].map(async ([service, url]) => {
    try {
      const response = await fetch(url + '/health', {signal:AbortSignal.timeout(cfg.timeout),
        headers:{'X-Request-ID':req.requestId}});
      const body = await response.json();
      return [service, response.ok && body.status === 'healthy' && body.service === service ? 'healthy' : 'unavailable'];
    } catch { return [service, 'unavailable']; }
  }));
  const ready = checks.every(([, status]) => status === 'healthy');
  res.status(ready ? 200 : 503).json({status:ready ? 'ready' : 'not_ready',
    dependencies:Object.fromEntries(checks), requestId:req.requestId});
});
app.get('/', (req, res) => res.json({message:'Microsservicos - demonstracao local',
  public:['GET /health','GET /ready','POST /auth/login','POST /auth/verify'],
  protected:['GET /api/products','GET /api/products/:id','GET /api/products/category/:categoria']}));

// app.use remove /auth de req.url durante este middleware:
// POST /auth/login -> POST /login; POST /auth/verify -> POST /verify.
app.use('/auth', (req, res) => authProxy.web(req, res));

async function authenticateRequest(req, res, next) {
  const token = bearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({error:'Token requerido ou formato invalido', requestId:req.requestId});
  try {
    const response = await fetch(cfg.authUrl + '/verify', {
      method:'POST', signal:AbortSignal.timeout(cfg.timeout),
      headers:{'Content-Type':'application/json', 'X-Request-ID':req.requestId},
      body:JSON.stringify({token})
    });
    if (response.status === 401) return res.status(401).json({error:'Token invalido ou expirado', requestId:req.requestId});
    if (!response.ok) return res.status(503).json({error:'Validacao de autenticacao indisponivel', requestId:req.requestId});
    const result = await response.json();
    if (result.valid !== true || !result.user) return res.status(401).json({error:'Token invalido', requestId:req.requestId});
    req.user = result.user;
    next();
  } catch (err) {
    const status = ['TimeoutError','AbortError'].includes(err.name) ? 504 : 503;
    res.status(status).json({error:'auth-service indisponivel', requestId:req.requestId});
  }
}
// /api/products -> /products. Nao anunciar CRUD: este catalogo e somente leitura.
app.use('/api', (req, res, next) => {
  if (!/^\/products(?:\/|$)/.test(req.path)) return res.status(404).json({error:'Endpoint nao encontrado'});
  next();
}, authenticateRequest, (req, res) => {
  // Nao propagar o token nem uma identidade enviada pelo cliente ao catalogo.
  delete req.headers.authorization;
  delete req.headers['x-user-id'];
  delete req.headers['x-user-role'];
  catalogProxy.web(req, res);
});
app.use((req, res) => res.status(404).json({error:'Endpoint nao encontrado', requestId:req.requestId}));
app.use(errors);
if (require.main === module) start(app, cfg.port, 'api-gateway');
module.exports = app;
