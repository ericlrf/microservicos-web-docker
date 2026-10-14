import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
let count = 0;
function walk(dir) {
  for (const item of readdirSync(dir, {withFileTypes:true})) {
    if (['node_modules','.git'].includes(item.name)) continue;
    const path=join(dir,item.name);
    if (item.isDirectory()) walk(path);
    else if (/\.(js|cjs|mjs)$/.test(path)) {
      const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});
      if (result.status !== 0) process.exit(result.status || 1);
      count++;
    }
  }
}
walk(root);
console.log('Sintaxe JavaScript validada em ' + count + ' arquivos.');
