const express = require('express');
const { garantirBaseSaaS } = require('../db/tenants');
const { salvarDb } = require('../db/store');
const { SETORES } = require('../config/setores');
const { autenticar } = require('../middleware/auth');
const { lerDbLoja, salvarDbLoja } = require('../db/tenantStore');

const router = express.Router();

router.post('/cliente/clientes', autenticar, (req, res) => {
  const { nome, whatsapp, endereco } = req.body || {};
  const zapLimpo = String(whatsapp || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (!nome || zapLimpo.length < 8) {
    return res.status(400).json({ erro: 'Informe nome e WhatsApp/telefone com pelo menos 8 dígitos.' });
  }
  const dbLoja = lerDbLoja(req.usuario.tenantId);
  const existente = dbLoja.clientesFidelidade[zapLimpo] || {};
  dbLoja.clientesFidelidade[zapLimpo] = {
    whatsapp: zapLimpo,
    chave: zapLimpo,
    nome: String(nome).trim(),
    endereco: String(endereco || existente.endereco || '').trim(),
    cashbackSaldo: Number(existente.cashbackSaldo || 0),
    totalGasto: Number(existente.totalGasto || 0),
    qtdPedidos: Number(existente.qtdPedidos || 0),
    ultimoPedido: existente.ultimoPedido || null,
    historicoPedidos: existente.historicoPedidos || [],
    origem: existente.origem || 'cadastro_manual'
  };
  salvarDbLoja(req.usuario.tenantId, dbLoja);
  res.json({ ok: true, cliente: dbLoja.clientesFidelidade[zapLimpo] });
});

router.put('/cliente/produtos/:id', autenticar, (req, res) => {
  const db = garantirBaseSaaS();
  const tenant = db.tenants.find(t => t.id === req.usuario.tenantId);
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });
  if (!Array.isArray(tenant.produtos)) {
    tenant.produtos = JSON.parse(JSON.stringify(SETORES[tenant.setor]?.produtosIniciais || []));
  }
  const prod = tenant.produtos.find(p => Number(p.id) === Number(req.params.id));
  if (!prod) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const { nome, preco, estoque } = req.body || {};
  if (nome !== undefined && String(nome).trim()) prod.nome = String(nome).trim();
  if (preco !== undefined && !Number.isNaN(Number(preco))) prod.preco = Number(Number(preco).toFixed(2));
  if (estoque !== undefined && !Number.isNaN(Number(estoque))) prod.estoque = Math.max(0, Number(estoque));
  salvarDb(db);
  res.json({ ok: true, produto: prod });
});

module.exports = router;
