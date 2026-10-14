import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:8080';
const baseURL = new URL(base);
if (!['http:','https:'].includes(baseURL.protocol)) throw new Error('BASE_URL invalida');
let passed = 0;
async function request(path, options = {}) {
  const {token, body, raw, method='GET'} = options;
  const headers = {};
  if (token !== undefined) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined || raw !== undefined) headers['Content-Type']='application/json';
  const response = await fetch(new URL(path, baseURL), {method, headers,
    body:raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body),
    signal:AbortSignal.timeout(6000), redirect:'error'});
  const text = await response.text();
  let data;
  try {data=JSON.parse(text);} catch {throw new Error(path + ': resposta nao e JSON (HTTP '+response.status+')');}
  return {status:response.status, data, headers:response.headers};
}
async function check(name, callback) {
  await callback(); passed++;
  console.log('[OK] '+String(passed).padStart(2,'0')+' '+name);
}
let token;
try {
  await check('Saude do gateway',async()=>{const r=await request('/health');assert.equal(r.status,200);assert.equal(r.data.status,'healthy');assert.equal(r.data.service,'api-gateway');});
  await check('Prontidao das dependencias',async()=>{const r=await request('/ready');assert.equal(r.status,200);assert.equal(r.data.status,'ready');assert.equal(r.data.dependencies['auth-service'],'healthy');assert.equal(r.data.dependencies['catalog-service'],'healthy');});
  await check('Catalogo sem token retorna 401',async()=>{const r=await request('/api/products');assert.equal(r.status,401);});
  await check('Credenciais incorretas retornam 401',async()=>{const r=await request('/auth/login',{method:'POST',body:{email:'admin@demo.com',senha:'errada'}});assert.equal(r.status,401);assert.equal(r.data.token,undefined);});
  await check('Login incompleto retorna 400',async()=>{const r=await request('/auth/login',{method:'POST',body:{email:'admin@demo.com'}});assert.equal(r.status,400);});
  await check('JSON malformado retorna 400',async()=>{const r=await request('/auth/login',{method:'POST',raw:'{"email":'});assert.equal(r.status,400);});
  await check('Login preserva o corpo JSON pelo proxy',async()=>{const r=await request('/auth/login',{method:'POST',body:{email:'admin@demo.com',senha:'admin123'}});assert.equal(r.status,200);assert.equal(typeof r.data.token,'string');assert.equal(r.data.token.split('.').length,3);assert.equal(r.data.user.email,'admin@demo.com');assert.equal(r.data.user.senha,undefined);assert.equal(r.headers.get('cache-control'),'no-store');token=r.data.token;});
  await check('Verificacao de JWT valido',async()=>{const r=await request('/auth/verify',{method:'POST',body:{token}});assert.equal(r.status,200);assert.equal(r.data.valid,true);assert.equal(r.data.user.id,1);});
  await check('Verificacao de JWT invalido',async()=>{const r=await request('/auth/verify',{method:'POST',body:{token:'invalido'}});assert.equal(r.status,401);assert.equal(r.data.valid,false);});
  await check('Catalogo autenticado',async()=>{const r=await request('/api/products',{token});assert.equal(r.status,200);assert.equal(r.data.success,true);assert.equal(r.data.count,6);assert.equal(r.data.data.length,6);});
  await check('Paginacao realmente limita data',async()=>{const r=await request('/api/products?page=2&limit=2',{token});assert.equal(r.status,200);assert.equal(r.data.pagination.pagina,2);assert.equal(r.data.data.length,2);assert.deepEqual(r.data.data.map(x=>x.id),[3,4]);});
  await check('Produto por ID',async()=>{const r=await request('/api/products/1',{token});assert.equal(r.status,200);assert.equal(r.data.data.id,1);});
  await check('Produto inexistente retorna 404',async()=>{const r=await request('/api/products/999',{token});assert.equal(r.status,404);assert.equal(r.data.success,false);});
  await check('Categoria moveis',async()=>{const r=await request('/api/products/category/moveis',{token});assert.equal(r.status,200);assert.equal(r.data.count,1);assert.equal(r.data.data[0].id,4);});
  await check('Categoria inexistente retorna lista vazia',async()=>{const r=await request('/api/products/category/inexistente',{token});assert.equal(r.status,200);assert.deepEqual(r.data.data,[]);});
  await check('Page=0 retorna 400',async()=>{const r=await request('/api/products?page=0',{token});assert.equal(r.status,400);});
  await check('Limit excessivo retorna 400',async()=>{const r=await request('/api/products?limit=101',{token});assert.equal(r.status,400);});
  await check('ID parcialmente numerico retorna 400',async()=>{const r=await request('/api/products/1abc',{token});assert.equal(r.status,400);});
  await check('Token forjado retorna 401',async()=>{const r=await request('/api/products',{token:'aaaa.bbbb.cccc'});assert.equal(r.status,401);});
  await check('Identificador de rastreio presente',async()=>{const r=await request('/api/products',{token});assert.match(r.headers.get('x-request-id')||'',/^[a-zA-Z0-9-]{1,80}$/);});
  await check('Endpoint desconhecido retorna 404',async()=>{const r=await request('/nao-existe');assert.equal(r.status,404);});
  await check('Nao ha falso endpoint de logout',async()=>{const r=await request('/auth/logout',{method:'POST',body:{}});assert.equal(r.status,404);});
  console.log('SUCESSO: '+passed+' verificacoes HTTP. Token completo nao exibido.');
} catch (err) {
  console.error('FALHA apos '+passed+' verificacoes: '+err.message);
  process.exitCode=1;
}
