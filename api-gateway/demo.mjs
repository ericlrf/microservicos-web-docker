import assert from 'node:assert/strict';
const base=new URL(process.argv[2] || 'http://127.0.0.1:8080');
async function call(label,path,options={},expected=200) {
  console.log('\n=== '+label+' ===');
  const response=await fetch(new URL(path,base),{...options,signal:AbortSignal.timeout(6000)});
  const data=await response.json();
  console.log((options.method||'GET')+' '+path+' -> HTTP '+response.status);
  assert.equal(response.status,expected);
  return data;
}
try {
  const health=await call('1. Vida do gateway','/health');console.log(JSON.stringify(health,null,2));
  const denied=await call('2. Catalogo sem token','/api/products',{},401);console.log(JSON.stringify(denied,null,2));
  const login=await call('3. Login','/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@demo.com',senha:'admin123'})});
  assert.equal(typeof login.token,'string');
  console.log(JSON.stringify({...login,token:login.token.slice(0,24)+'...[omitido]'},null,2));
  const catalog=await call('4. Catalogo autenticado','/api/products?page=1&limit=2',{headers:{Authorization:'Bearer '+login.token}});
  assert.equal(catalog.success,true);assert.equal(catalog.data.length,2);
  console.log(JSON.stringify(catalog,null,2));
  console.log('\nFluxo concluido. Execute test-api.mjs para a bateria de 22 verificacoes.');
} catch(err) {console.error('FALHA NA DEMO: '+err.message);process.exitCode=1;}
