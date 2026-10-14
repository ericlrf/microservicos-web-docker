'use strict';
// Probe de vida do processo; nao testa dependencias nem o fluxo funcional.
const http = require('node:http');
const port = Number(process.env.PORT || 3002);
const req = http.get({ hostname: '127.0.0.1', port, path: '/health', timeout: 2000 }, res => {
  res.resume();
  res.on('end', () => process.exit(res.statusCode === 200 ? 0 : 1));
});
req.on('timeout', () => { req.destroy(); process.exit(1); });
req.on('error', () => process.exit(1));
