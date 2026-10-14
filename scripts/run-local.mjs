import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
if (!process.env.JWT_SECRET) throw new Error('Execute: node --env-file=.env scripts/run-local.mjs');
const children=[];
let stopping=false;
function stop(code=0) {if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),1200);}
for(const [name,port] of [['auth-service',3002],['catalog-service',3001],['api-gateway',Number(process.env.GATEWAY_PORT||8080)]]) {
  const child=spawn(process.execPath,['server.js'],{cwd:join(root,name),stdio:'inherit',env:{...process.env,PORT:String(port),AUTH_URL:'http://127.0.0.1:3002',CATALOG_URL:'http://127.0.0.1:3001'}});
  children.push(child);
  child.on('error',err=>{console.error(err.message);stop(1);});
  child.on('exit',code=>{if(!stopping)stop(code||1);});
}
for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>stop(0));
