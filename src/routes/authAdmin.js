const express = require('express');
const { salvarDb } = require('../db/store');
const { lerDbLoja, salvarDbLoja, buscarPedidoPorIdGlobal, buscarClienteLoja, registrarPedidoCliente } = require('../db/tenantStore');
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
      estoque: Number(novoProduto.estoque || 50),
      imagem: String(novoProduto.imagem || '')
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
  const tid = req.usuario.tenantId;
  if (tid) {
    const dbLoja = lerDbLoja(tid);
    return res.json({ conversas: (dbLoja.logsAgentes || []).slice(0, 30) });
  }
  const db = garantirBaseSaaS();
  res.json({ conversas: (db.logsAgentes || []).slice(0, 30) });
});

router.get('/cliente/pedidos-online', autenticar, (req, res) => {
  const tid = req.usuario.tenantId;
  if (!tid) return res.json({ pedidos: [] });
  const dbLoja = lerDbLoja(tid);
  res.json({ pedidos: (dbLoja.pedidosOnline || []).slice(0, 20) });
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

// Baixa automática de estoque no ERP do cliente
function baixarEstoqueTenant(tenant, itens) {
  if (!tenant) return;
  if (!Array.isArray(tenant.produtos)) {
    tenant.produtos = JSON.parse(JSON.stringify(SETORES[tenant.setor]?.produtosIniciais || []));
  }
  for (const item of (itens || [])) {
    const prod = tenant.produtos.find(p => Number(p.id) === Number(item.id));
    if (prod) {
      prod.estoque = Math.max(0, Number(prod.estoque || 0) - Number(item.qtd || 1));
    }
  }
}

// Consulta cliente recorrente + saldo de cashback pelo WhatsApp
router.get('/demo/cliente/:tenantId', (req, res) => {
  const { cliente, cashbackTaxa } = buscarClienteLoja(req.params.tenantId, req.query.whatsapp || '');
  res.json({ ok: true, encontrado: Boolean(cliente), cliente, cashbackTaxa });
});

router.get('/cliente/fidelidade', autenticar, (req, res) => {
  const dbLoja = lerDbLoja(req.usuario.tenantId);
  const clientes = Object.values(dbLoja.clientesFidelidade || {}).sort((a, b) => (b.qtdPedidos || 0) - (a.qtdPedidos || 0));
  res.json({ ok: true, cashbackTaxa: dbLoja.cashbackTaxa ?? 5, clientes });
});

router.put('/cliente/fidelidade', autenticar, (req, res) => {
  const dbLoja = lerDbLoja(req.usuario.tenantId);
  const taxa = Number(req.body?.cashbackTaxa);
  if (!Number.isNaN(taxa) && taxa >= 0 && taxa <= 50) dbLoja.cashbackTaxa = taxa;
  salvarDbLoja(req.usuario.tenantId, dbLoja);
  res.json({ ok: true, cashbackTaxa: dbLoja.cashbackTaxa });
});

// Checkout Online (Entrega ou Retirada) + PIX + Cashback + CRM por Loja
router.post('/demo/pedido/:tenantId', (req, res) => {
  const db = garantirBaseSaaS();
  const tenant = db.tenants.find(t => t.id === req.params.tenantId && t.ativo);
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });
  const { clienteNome = 'Cliente', clienteWhatsapp = '', itens = [], modalidade = 'entrega', endereco = '', formaPagamento = 'pix', trocoPara = '', usarCashback = false } = req.body || {};
  if (!Array.isArray(itens) || !itens.length) return res.status(400).json({ erro: 'Carrinho vazio.' });

  const exigePresencial = itens.some(i => /aplica[çc][ãa]o|troca de joia/i.test(String(i.nome || '')));
  if (exigePresencial && modalidade === 'entrega') {
    return res.status(400).json({ erro: 'Itens com Aplicação ou Troca de Joia são presenciais no estúdio e estão bloqueados para entrega.' });
  }

  const subtotal = itens.reduce((acc, i) => acc + Number(i.preco || 0) * Number(i.qtd || 1), 0);
  const frete = modalidade === 'entrega' ? 15 : 0;
  const totalBruto = subtotal + frete;
  const pedidoId = `PED-${Date.now().toString(36).toUpperCase()}`;
  const isPix = formaPagamento === 'pix';

  const pedido = {
    id: pedidoId,
    tenantId: tenant.id,
    clienteNome,
    clienteWhatsapp,
    itens,
    modalidade,
    endereco: modalidade === 'entrega' ? endereco : 'Retirada / Atendimento na Loja',
    formaPagamento,
    trocoPara: formaPagamento === 'dinheiro' ? String(trocoPara || 'Sem troco') : '',
    subtotal,
    frete,
    total: totalBruto,
    status: isPix ? 'AGUARDANDO_PAGAMENTO' : 'PEDIDO_CONFIRMADO',
    estoqueBaixado: !isPix,
    pixCopiaCola: '',
    criadoEm: new Date().toISOString()
  };

  const { dbLoja } = registrarPedidoCliente(tenant.id, pedido, Boolean(usarCashback));
  if (isPix) {
    pedido.pixCopiaCola = `00020126580014br.gov.bcb.pix0136${tenant.id}@omnicommerce.pix520400005303986540${pedido.total.toFixed(2)}5802BR5913${tenant.nome.slice(0, 13)}6009SAO PAULO62070503${pedidoId.slice(-4)}6304ABCD`;
  }
  if (!isPix) {
    baixarEstoqueTenant(tenant, itens);
    salvarDb(db);
  }
  dbLoja.pedidosOnline.unshift(pedido);
  dbLoja.pedidosOnline = dbLoja.pedidosOnline.slice(0, 100);
  salvarDbLoja(tenant.id, dbLoja);
  res.json({ ok: true, pedido });
});

router.get('/demo/pedido/:pedidoId', (req, res) => {
  const pedido = buscarPedidoPorIdGlobal(req.params.pedidoId);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  res.json({ ok: true, pedido });
});

router.post('/pagamentos/webhook/:tenantId', (req, res) => {
  const db = garantirBaseSaaS();
  const dbLoja = lerDbLoja(req.params.tenantId);
  const { pedidoId, status = 'approved' } = req.body || {};
  const pedido = (dbLoja.pedidosOnline || []).find(p => p.id === pedidoId);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado para webhook.' });
  if (['approved', 'CONFIRMED', 'PAGO'].includes(String(status))) {
    pedido.status = 'PAGO';
    pedido.pagoEm = new Date().toISOString();
    if (!pedido.estoqueBaixado) {
      const tenant = db.tenants.find(t => t.id === pedido.tenantId);
      baixarEstoqueTenant(tenant, pedido.itens);
      pedido.estoqueBaixado = true;
      salvarDb(db);
    }
    dbLoja.logsAgentes.unshift({
      data: pedido.pagoEm,
      agente: '💳 Gateway PIX',
      canal: 'Webhook',
      tenantId: pedido.tenantId,
      setor: 'pagamento',
      entrada: `Pedido ${pedido.id} (${pedido.clienteNome})`,
      resposta: `Pagamento confirmado R$ ${Number(pedido.total).toFixed(2)} • ${pedido.modalidade === 'entrega' ? 'Entrega: ' + pedido.endereco : 'Retirada na loja'}`
    });
    dbLoja.logsAgentes = dbLoja.logsAgentes.slice(0, 100);
    salvarDbLoja(req.params.tenantId, dbLoja);
  }
  res.json({ ok: true, pedido });
});

module.exports = router;
