import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const target = fileURLToPath(new URL('../.env', import.meta.url));
try {
  writeFileSync(target, 'JWT_SECRET=' + randomBytes(32).toString('hex') + '\nGATEWAY_PORT=8080\n', {flag:'wx',mode:0o600});
  console.log('.env criada com chave aleatoria. O segredo nao foi exibido.');
} catch (err) {
  if (err.code === 'EEXIST') { console.error('.env ja existe; nenhum arquivo foi sobrescrito.'); process.exit(1); }
  throw err;
}
