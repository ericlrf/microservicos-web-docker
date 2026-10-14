'use strict';
const express = require('express');
const {products, integer, paginate, category} = require('./core.cjs');
const {requestLog, errors, start} = require('./runtime.cjs');
const PORT = Number(process.env.PORT || 3001);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT invalida');
const app = express();
app.disable('x-powered-by');
app.use(requestLog('catalog-service'));
// Catalogo apenas de leitura: nenhuma rota POST, PUT, PATCH ou DELETE.
// Nesta demo, o gateway aplica a autenticacao. Nao publicar esta porta no host.
app.get('/health', (req,res) => res.json({status:'healthy',service:'catalog-service',
  scope:'process',total_produtos:products.length,uptime:process.uptime()}));
app.get('/products', (req,res) => res.json(paginate(products, req.query)));
app.get('/products/category/:categoria', (req,res) => {
  const result = paginate(category(req.params.categoria), req.query);
  res.json({...result, categoria:req.params.categoria.toLowerCase()});
});
app.get('/products/:id', (req,res) => {
  const id = integer(req.params.id, 'id');
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({success:false,error:'Produto nao encontrado'});
  res.json({success:true,data:product});
});
app.use((req,res) => res.status(404).json({error:'Endpoint nao encontrado'}));
app.use(errors);
if (require.main === module) start(app, PORT, 'catalog-service');
module.exports = app;
