const express = require('express');
const { salvarDb } = require('../db/store');
const { garantirBaseSaaS, verificarSenha, criarNovoCliente } = require('../db/tenants');
const { SETORES } = require('../config/setores');
const { gerarToken, autenticar, exigirSuperAdmin, exigirModulo } = require('../middleware/auth');
const { executarAgente } = require('../agents/orquestrador');

const router = express.Router();

router.post('/auth/login', (req, res) => {
  const { email, senha } = req.body || {};
  const db = garantirBaseSaaS();
  const emailNorm = String(email || '').trim().toLowerCase();
  const usuario = db.usuarios.find(u => u.email === emailNorm);

  if (!usuario || !verificarSenha(senha || '', usuario.senhaHash)) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  let tenant = null;
  if (usuario.tenantId) {
    tenant = db.tenants.find(t => t.id === usuario.tenantId) || null;
    if (!tenant || !tenant.ativo) {
      return res.status(403).json({ erro: 'Esta loja está suspensa. Fale com o Administrador Geral.' });
    }
  }

  const token = gerarToken({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    tenantId: usuario.tenantId
  });

  res.json({
    ok: true,
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role, tenantId: usuario.tenantId },
    tenant,
    produtosSetor: tenant ? (tenant.produtos || (SETORES[tenant.setor] ? SETORES[tenant.setor].produtosIniciais : [])) : []
  });
});

router.get('/auth/me', autenticar, (req, res) => {
  const db = garantirBaseSaaS();
  const tenant = req.usuario.tenantId
    ? db.tenants.find(t => t.id === req.usuario.tenantId) || null
    : null;
  res.json({
    usuario: req.usuario,
    tenant,
    produtosSetor: tenant ? (tenant.produtos || (SETORES[tenant.setor] ? SETORES[tenant.setor].produtosIniciais : [])) : []
  });
});

router.get('/superadmin/clientes', autenticar, exigirSuperAdmin, (req, res) => {
  const db = garantirBaseSaaS();
  const lista = db.tenants.map(t => {
    const admin = db.usuarios.find(u => u.tenantId === t.id);
    return { ...t, emailAdmin: admin ? admin.email : '' };
  });
  res.json({ clientes: lista, setores: Object.keys(SETORES) });
});

router.post('/superadmin/clientes', autenticar, exigirSuperAdmin, (req, res) => {
  try {
    const criado = criarNovoCliente(req.body || {});
    res.status(201).json({ ok: true, ...criado });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.patch('/superadmin/clientes/:id/modulos', autenticar, exigirSuperAdmin, (req, res) => {
  const db = garantirBaseSaaS();
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  const { modulos, setor, ativo, instrucoesCamila, novoProduto } = req.body || {};
  if (modulos && typeof modulos === 'object') {
    tenant.modulos = {
      pdv: Boolean(modulos.pdv),
      erp: Boolean(modulos.erp),
      agenda: Boolean(modulos.agenda),
      whatsapp_ia: Boolean(modulos.whatsapp_ia),
      agentes11: Boolean(modulos.agentes11)
    };
  }
  if (setor && SETORES[setor]) {
    tenant.setor = setor;
  }
  if (typeof ativo === 'boolean') {
    tenant.ativo = ativo;
  }
  if (typeof instrucoesCamila === 'string') {
    tenant.instrucoesCamila = instrucoesCamila;
  }
  if (novoProduto && novoProduto.nome) {
    if (!Array.isArray(tenant.produtos)) {
      tenant.produtos = JSON.parse(JSON.stringify(SETORES[tenant.setor]?.produtosIniciais || []));
    }
    tenant.produtos.unshift({
      id: Date.now(),
      nome: String(novoProduto.nome),
      preco: Number(novoProduto.preco || 0),
      custo: Number(novoProduto.custo || 0),
      estoque: Number(novoProduto.estoque || 50)
    });
  }

  salvarDb(db);
  res.json({ ok: true, tenant });
});

router.post('/cliente/camila/chat', autenticar, exigirModulo('whatsapp_ia'), async (req, res) => {
  try {
    const db = garantirBaseSaaS();
    const tenant = req.usuario.tenantId ? db.tenants.find(t => t.id === req.usuario.tenantId) : null;
    const { mensagem, canal = 'WhatsApp' } = req.body || {};
    if (!mensagem) return res.status(400).json({ erro: 'Digite uma mensagem para a Camila.' });
    const resultado = await executarAgente({ agenteId: 'camila', mensagem, tenant, canal });
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/cliente/conversas', autenticar, (req, res) => {
  const db = garantirBaseSaaS();
  const tid = req.usuario.tenantId;
  const lista = (db.logsAgentes || []).filter(l => !tid || l.tenantId === tid).slice(0, 30);
  res.json({ conversas: lista });
});

// Endpoint público de demonstração para o cliente testar WhatsApp/Instagram pelo link
router.get('/demo/loja/:tenantId', (req, res) => {
  const db = garantirBaseSaaS();
  const tenant = db.tenants.find(t => t.id === req.params.tenantId && t.ativo);
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });
  const produtos = tenant.produtos || (SETORES[tenant.setor] ? SETORES[tenant.setor].produtosIniciais : []);
  res.json({ id: tenant.id, nome: tenant.nome, setor: tenant.setor, produtos });
});

router.post('/demo/chat/:tenantId', async (req, res) => {
  try {
    const db = garantirBaseSaaS();
    const tenant = db.tenants.find(t => t.id === req.params.tenantId && t.ativo);
    if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });
    const { mensagem, canal = 'WhatsApp', jaEnviouLink = false, historico = [] } = req.body || {};
    if (!mensagem) return res.status(400).json({ erro: 'Mensagem vazia.' });
    const resultado = await executarAgente({ agenteId: 'camila', mensagem, tenant, canal, jaEnviouLink: Boolean(jaEnviouLink), historico });
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
