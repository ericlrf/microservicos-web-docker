'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const gateway = require('../api-gateway/core.cjs');
const catalog = require('../catalog-service/core.cjs');
const auth = require('../auth-service/core.cjs');

test('Bearer valido',()=>assert.equal(gateway.bearerToken('Bearer aaa.bbb.ccc'),'aaa.bbb.ccc'));
test('Esquema Bearer insensivel a caixa',()=>assert.equal(gateway.bearerToken('bearer aaa.bbb.ccc'),'aaa.bbb.ccc'));
for (const [name,value] of [['ausente',undefined],['Basic','Basic abc'],['vazio','Bearer '],['excesso','Bearer '+ 'a'.repeat(8300)],['espacos','Bearer  aaa.bbb.ccc']])
  test('Bearer rejeita '+name,()=>assert.equal(gateway.bearerToken(value),null));
test('Configuracao padrao do gateway',()=>assert.deepEqual(gateway.config({}),{port:8080,timeout:3000,authUrl:'http://auth-service:3002',catalogUrl:'http://catalog-service:3001'}));
test('Configuracao permite host de teste',()=>assert.equal(gateway.config({AUTH_URL:'http://127.0.0.1:13002'}).authUrl,'http://127.0.0.1:13002'));
for (const [name,value] of [['protocolo','ftp://host'],['credenciais','http://user:senha@host'],['caminho','http://host/api'],['query','http://host/?x=1']])
  test('Upstream rejeita '+name,()=>assert.throws(()=>gateway.upstream(value,'')));
test('Porta invalida rejeitada',()=>assert.throws(()=>gateway.config({PORT:'99999'})));
test('Timeout zero rejeitado',()=>assert.throws(()=>gateway.config({UPSTREAM_TIMEOUT_MS:'0'})));
test('Catalogo tem seis produtos',()=>assert.equal(catalog.products.length,6));
test('Pagina padrao retorna todos os seis produtos',()=>assert.equal(catalog.paginate(catalog.products).data.length,6));
test('Paginacao retorna apenas IDs 3 e 4',()=>assert.deepEqual(catalog.paginate(catalog.products,{page:'2',limit:'2'}).data.map(x=>x.id),[3,4]));
test('Total nao confunde quantidade retornada',()=>{const r=catalog.paginate(catalog.products,{limit:'2'});assert.equal(r.count,6);assert.equal(r.pagination.retornados,2);});
test('Pagina alem do fim retorna lista vazia',()=>assert.deepEqual(catalog.paginate(catalog.products,{page:'100'}).data,[]));
for (const value of ['0','-1','1.2','1abc','1e3','', ['1','2']])
  test('Paginacao rejeita '+JSON.stringify(value),()=>assert.throws(()=>catalog.paginate(catalog.products,{page:value}),{status:400}));
test('Limit maior que 100 rejeitado',()=>assert.throws(()=>catalog.paginate(catalog.products,{limit:'101'}),{status:400}));
test('Filtro de categoria',()=>assert.deepEqual(catalog.category('MOVEIS').map(x=>x.id),[4]));
test('Categoria desconhecida',()=>assert.deepEqual(catalog.category('nada'),[]));
test('ID estritamente numerico',()=>assert.throws(()=>catalog.integer('1abc','id'),{status:400}));
test('Login normaliza email',()=>assert.equal(auth.credentials({email:' ADMIN@DEMO.COM ',senha:'admin123'}).email,'admin@demo.com'));
test('Login valido nao expoe senha',()=>assert.deepEqual(auth.findUser(auth.credentials({email:'admin@demo.com',senha:'admin123'})),{id:1,email:'admin@demo.com',role:'admin'}));
test('Senha incorreta nao autentica',()=>assert.equal(auth.findUser({email:'admin@demo.com',senha:'errada'}),null));
test('Usuario desconhecido nao autentica',()=>assert.equal(auth.findUser({email:'nada@demo.com',senha:'admin123'}),null));
for (const input of [undefined,{},[],{email:'x',senha:123},{email:' ',senha:'a'}])
  test('Credenciais malformadas: '+JSON.stringify(input),()=>assert.throws(()=>auth.credentials(input),{status:400}));
test('Segredo ausente rejeitado',()=>assert.throws(()=>auth.secret(undefined)));
test('Segredo curto rejeitado',()=>assert.throws(()=>auth.secret('curto')));
test('Segredo com 32 bytes aceito',()=>assert.equal(auth.secret('a'.repeat(32)).length,32));
test('Opcoes JWT restringem algoritmo, emissor e audiencia',()=>{assert.deepEqual(auth.verifyOptions.algorithms,['HS256']);assert.equal(auth.verifyOptions.issuer,'auth-service');assert.equal(auth.verifyOptions.audience,'api-gateway');});
