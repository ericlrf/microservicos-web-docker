'use strict';
const products = require('./products.json');
function integer(value, name, fallback, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    const err = new Error(name + ' deve ser um inteiro positivo'); err.status=400; throw err;
  }
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n > max) { const err=new Error(name + ' fora do intervalo'); err.status=400; throw err; }
  return n;
}
function paginate(items, query = {}) {
  const page = integer(query.page, 'page', 1, 1000000);
  const limit = integer(query.limit, 'limit', 10, 100);
  const offset = (page - 1) * limit;
  const data = items.slice(offset, offset + limit);
  return {success:true, count:items.length, pagination:{total:items.length, pagina:page,
    limite:limit, total_paginas:Math.ceil(items.length/limit), retornados:data.length}, data};
}
function category(value) { return products.filter(p => p.categoria.toLowerCase() === value.toLowerCase()); }
module.exports = { products, integer, paginate, category };
