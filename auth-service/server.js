'use strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const { credentials, findUser, secret, jwtOptions, verifyOptions } = require('./core.cjs');
const { requestLog, errors, start } = require('./runtime.cjs');
const PORT = Number(process.env.PORT || 3002);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT invalida');
const JWT_SECRET = secret(process.env.JWT_SECRET);
if (JWT_SECRET.startsWith('demo-local-')) console.warn('ATENCAO: chave publica de demonstracao; uso somente local.');
const app = express();
app.disable('x-powered-by');
app.use(requestLog('auth-service'));
app.use(express.json({limit:'16kb', strict:true}));
app.get('/health', (req,res) => res.json({status:'healthy', service:'auth-service', scope:'process', uptime:process.uptime()}));
app.post('/login', (req,res) => {
  const input = credentials(req.body);
  const user = findUser(input);
  if (!user) return res.status(401).json({error:'Credenciais invalidas'});
  const token = jwt.sign(user, JWT_SECRET, jwtOptions);
  res.set('Cache-Control','no-store');
  res.json({message:'Login realizado', token, tokenType:'Bearer', expiresIn:3600, user});
});
app.post('/verify', (req,res) => {
  res.set('Cache-Control','no-store');
  const token = req.body && req.body.token;
  if (typeof token !== 'string' || token.length < 1 || token.length > 8192)
    return res.status(401).json({valid:false, error:'Token invalido ou ausente'});
  try {
    const decoded = jwt.verify(token, JWT_SECRET, verifyOptions);
    if (typeof decoded !== 'object' || !Number.isInteger(decoded.exp) || !Number.isInteger(decoded.id)
        || typeof decoded.email !== 'string' || !['admin','user'].includes(decoded.role))
      return res.status(401).json({valid:false, error:'Claims invalidas'});
    res.json({valid:true, user:{id:decoded.id,email:decoded.email,role:decoded.role},
      expiresAt:new Date(decoded.exp * 1000).toISOString()});
  } catch {
    res.status(401).json({valid:false, error:'Token invalido ou expirado'});
  }
});
// Logout/revogacao NAO implementados. Descartar um JWT nao o invalida no servidor.
app.use((req,res) => res.status(404).json({error:'Endpoint nao encontrado'}));
app.use(errors);
if (require.main === module) start(app, PORT, 'auth-service');
module.exports = app;
