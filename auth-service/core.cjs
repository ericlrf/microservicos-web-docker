'use strict';
// Credenciais publicas e simuladas. Nao usar este armazenamento em producao.
const users = [
  {id:1, email:'admin@demo.com', senha:'admin123', role:'admin'},
  {id:2, email:'user@demo.com', senha:'user123', role:'user'}
];
function credentials(body) {
  if (!body || Array.isArray(body) || typeof body.email !== 'string' || typeof body.senha !== 'string'
      || body.email.length > 254 || body.senha.length < 1 || body.senha.length > 256) {
    const err = new Error('Email e senha validos sao obrigatorios'); err.status = 400; throw err;
  }
  const email = body.email.trim().toLowerCase();
  if (!email) { const err = new Error('Email obrigatorio'); err.status = 400; throw err; }
  return {email, senha:body.senha};
}
function findUser(input) {
  const user = users.find(u => u.email === input.email && u.senha === input.senha);
  if (!user) return null;
  // Nunca retornar senha no corpo da resposta nem no JWT.
  return {id:user.id, email:user.email, role:user.role};
}
function secret(value) {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') < 32)
    throw new Error('JWT_SECRET obrigatorio, com pelo menos 32 bytes; gere uma chave aleatoria');
  return value;
}
const jwtOptions = Object.freeze({algorithm:'HS256', expiresIn:'1h', issuer:'auth-service', audience:'api-gateway'});
const verifyOptions = Object.freeze({algorithms:['HS256'], issuer:'auth-service', audience:'api-gateway', maxAge:'1h'});
module.exports = { credentials, findUser, secret, jwtOptions, verifyOptions };
