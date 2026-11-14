const express = require('express');
const { lerDb, salvarDb, trocarSetorLoja } = require('../db/store');
const { SETORES } = require('../config/setores');
const { obterDefinicaoAgentes } = require('../agents/definicoes11');
const { executarAgente, notificarDonoAlerta } = require('../agents/orquestrador');
const { obterEstadoHibrido } = require('../services/hibrido');

const router = express.Router();

router.get('/health', (req, res) => {
  const db = lerDb();
  res.json({ ok: true, loja: db.loja.nome, setor: db.loja.setor, agentesAtivos: 11 });
});

router.get('/hibrido/status', (req, res) => {
  res.json(obterEstadoHibrido());
});

router.get('/config', (req, res) => {
  const db = lerDb();
  const agentes = Object.entries(obterDefinicaoAgentes(db)).map(([id, a]) => ({
    id,
    numero: a.numero,
    nome: a.nome,
    cargo: a.cargo,
    modo: a.modo
  }));
  res.json({
    loja: db.loja,
    setoresDisponiveis: Object.keys(SETORES),
    agentes
  });
});

router.post('/admin/setor', (req, res) => {
  const pinEsperado = process.env.ADMIN_PIN || '2026';
  const { pin, setor, nomeLoja, cidade, descontoMaxPct } = req.body || {};
  if (String(pin || '') !== pinEsperado) {
    return res.status(401).json({ erro: 'PIN de administrador inválido' });
  }
  try {
    const db = trocarSetorLoja(setor, nomeLoja, cidade);
    if (typeof descontoMaxPct === 'number') {
      db.loja.descontoMaxPct = descontoMaxPct;
      salvarDb(db);
    }
    res.json({ ok: true, loja: db.loja, totalProdutos: db.produtos.length });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.get('/produtos', (req, res) => {
  const db = lerDb();
  res.json(db.produtos);
});

router.post('/pedidos', async (req, res) => {
  const { itens = [], formaPagamento = 'PIX', cliente = 'Balcão' } = req.body || {};
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Informe ao menos um item no pedido' });
  }
  const db = lerDb();
  let total = 0;
  for (const item of itens) {
    const prod = db.produtos.find(p => p.id === Number(item.id));
    if (!prod) continue;
    const qtd = Math.max(1, Number(item.qtd || 1));
    prod.estoque = Math.max(0, prod.estoque - qtd);
    total += prod.preco * qtd;
  }
  const estadoHibrido = obterEstadoHibrido();
  const pedido = {
    id: `PED-${Date.now().toString().slice(-6)}`,
    data: new Date().toISOString(),
    cliente,
    formaPagamento,
    total: Number(total.toFixed(2)),
    sincronizadoVps: estadoHibrido.modoAtivo === 'VPS',
    itens
  };
  db.pedidos.unshift(pedido);
  salvarDb(db);
  res.status(201).json({ ok: true, pedido, modoAtivo: estadoHibrido.modoAtivo });
});

router.post('/pedidos/sincronizar', (req, res) => {
  const { pedidos = [] } = req.body || {};
  if (!Array.isArray(pedidos)) return res.status(400).json({ erro: 'Lista inválida' });
  const db = lerDb();
  let inseridos = 0;
  for (const p of pedidos) {
    if (!db.pedidos.some(x => x.id === p.id)) {
      db.pedidos.unshift({ ...p, sincronizadoVps: true });
      inseridos++;
    }
  }
  salvarDb(db);
  res.json({ ok: true, inseridos });
});

router.post('/pedidos/cancelar', async (req, res) => {
  const { pedidoId, valor = 0, formaPagamento = 'Dinheiro', operador = 'Caixa 01' } = req.body || {};
  const db = lerDb();
  const registro = { pedidoId, valor: Number(valor), formaPagamento, operador, data: new Date().toISOString() };
  db.cancelamentos.unshift(registro);
  salvarDb(db);

  if (formaPagamento === 'Dinheiro' && Number(valor) >= 30) {
    const alerta = await executarAgente({
      agenteId: 'fontana',
      mensagem: `ALERTA: Cancelamento em dinheiro de R$ ${Number(valor).toFixed(2)} (Pedido ${pedidoId}) pelo operador ${operador}.`
    });
    await notificarDonoAlerta(`🚨 *Inspetor Fontana — Alerta de Caixa*\n${alerta.resposta}`);
  }
  res.json({ ok: true, registro });
});

router.post('/agentes/:id/executar', async (req, res) => {
  try {
    const { mensagem = 'Gere o relatório do seu setor.', clienteTelefone, enviarWhatsApp } = req.body || {};
    const resultado = await executarAgente({
      agenteId: req.params.id,
      mensagem,
      clienteTelefone,
      enviarWhatsApp: Boolean(enviarWhatsApp)
    });
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.post('/webhook/whatsapp', async (req, res) => {
  try {
    const data = req.body?.data || req.body || {};
    const fromMe = Boolean(data?.key?.fromMe);
    if (fromMe) return res.json({ ignorado: true });

    const remoteJid = data?.key?.remoteJid || req.body?.telefone || '';
    const texto = data?.message?.conversation || data?.message?.extendedTextMessage?.text || req.body?.mensagem || '';
    if (!texto || !remoteJid) {
      return res.json({ ignorado: true, motivo: 'Sem texto ou remetente' });
    }

    const ehLogistica = /entrega|motoboy|bairro|frete|chegando/i.test(texto);
    const agenteId = ehLogistica ? 'rodrigo' : 'camila';
    const resultado = await executarAgente({
      agenteId,
      mensagem: texto,
      clienteTelefone: remoteJid.split('@')[0],
      enviarWhatsApp: true,
      canal: 'WhatsApp'
    });
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Verificação do Webhook oficial da Meta (Instagram Direct)
router.get('/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'omnicommerce_meta_2026')) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recebimento de Directs do Instagram (Meta Graph API)
router.post('/webhook/instagram', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const texto = messaging?.message?.text || req.body?.mensagem || '';
    const senderId = messaging?.sender?.id || req.body?.usuario || 'instagram_user';
    if (!texto) return res.json({ ignorado: true });

    const resultado = await executarAgente({
      agenteId: 'camila',
      mensagem: texto,
      canal: 'Instagram'
    });
    res.json({ ok: true, senderId, ...resultado });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
