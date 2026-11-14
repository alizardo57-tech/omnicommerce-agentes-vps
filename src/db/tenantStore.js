const fs = require('fs');
const path = require('path');

const LOJAS_DIR = path.join(__dirname, '..', '..', 'data', 'lojas');

function garantirPastaLojas() {
  if (!fs.existsSync(LOJAS_DIR)) fs.mkdirSync(LOJAS_DIR, { recursive: true });
}

function limparId(tenantId) {
  return String(tenantId || 'global').replace(/[^a-zA-Z0-9_-]/g, '');
}

function normalizarZap(zap) {
  const digitos = String(zap || '').replace(/\D/g, '');
  if (digitos.length > 11 && digitos.startsWith('55')) return digitos.slice(2);
  return digitos;
}

function lerDbLoja(tenantId) {
  garantirPastaLojas();
  const id = limparId(tenantId);
  const arq = path.join(LOJAS_DIR, `${id}.json`);
  if (!fs.existsSync(arq)) {
    const inicial = { tenantId: id, cashbackTaxa: 5, tempoPreparoMin: 35, pedidosOnline: [], logsAgentes: [], clientesFidelidade: {} };
    fs.writeFileSync(arq, JSON.stringify(inicial, null, 2), 'utf8');
    return inicial;
  }
  const dados = JSON.parse(fs.readFileSync(arq, 'utf8'));
  if (!dados.clientesFidelidade) dados.clientesFidelidade = {};
  if (typeof dados.cashbackTaxa !== 'number') dados.cashbackTaxa = 5;
  if (typeof dados.tempoPreparoMin !== 'number') dados.tempoPreparoMin = 35;
  return dados;
}

function salvarDbLoja(tenantId, dados) {
  garantirPastaLojas();
  const id = limparId(tenantId);
  const arq = path.join(LOJAS_DIR, `${id}.json`);
  fs.writeFileSync(arq, JSON.stringify(dados, null, 2), 'utf8');
}

function buscarPedidoPorIdGlobal(pedidoId) {
  garantirPastaLojas();
  const arquivos = fs.readdirSync(LOJAS_DIR).filter(f => f.endsWith('.json'));
  for (const f of arquivos) {
    try {
      const dados = JSON.parse(fs.readFileSync(path.join(LOJAS_DIR, f), 'utf8'));
      const achado = (dados.pedidosOnline || []).find(p => p.id === pedidoId);
      if (achado) return achado;
    } catch {}
  }
  return null;
}

function buscarClienteLoja(tenantId, whatsapp) {
  const dbLoja = lerDbLoja(tenantId);
  const chave = normalizarZap(whatsapp);
  const cliente = chave.length >= 8 ? (dbLoja.clientesFidelidade[chave] || null) : null;
  return { cliente, cashbackTaxa: dbLoja.cashbackTaxa };
}

function registrarPedidoCliente(tenantId, pedido, usarCashback = false) {
  const dbLoja = lerDbLoja(tenantId);
  const chave = normalizarZap(pedido.clienteWhatsapp);
  const taxa = Number(dbLoja.cashbackTaxa ?? 5);
  let cashbackUsado = 0;

  if (chave.length >= 8) {
    const atual = dbLoja.clientesFidelidade[chave] || {
      whatsapp: pedido.clienteWhatsapp,
      chave,
      nome: pedido.clienteNome,
      endereco: '',
      cashbackSaldo: 0,
      totalGasto: 0,
      qtdPedidos: 0,
      ultimoPedido: null,
      historicoPedidos: []
    };
    if (usarCashback && atual.cashbackSaldo > 0) {
      cashbackUsado = Number(Math.min(atual.cashbackSaldo, pedido.total).toFixed(2));
      atual.cashbackSaldo = Number((atual.cashbackSaldo - cashbackUsado).toFixed(2));
      pedido.total = Number(Math.max(0, pedido.total - cashbackUsado).toFixed(2));
    }
    const cashbackGanho = Number(((pedido.total * taxa) / 100).toFixed(2));
    pedido.cashbackUsado = cashbackUsado;
    pedido.cashbackGanho = cashbackGanho;
    pedido.cashbackTaxa = taxa;

    atual.nome = pedido.clienteNome || atual.nome;
    atual.whatsapp = pedido.clienteWhatsapp || atual.whatsapp;
    if (pedido.modalidade === 'entrega' && pedido.endereco) atual.endereco = pedido.endereco;
    atual.cashbackSaldo = Number((atual.cashbackSaldo + cashbackGanho).toFixed(2));
    atual.totalGasto = Number((atual.totalGasto + pedido.total).toFixed(2));
    atual.qtdPedidos = Number(atual.qtdPedidos || 0) + 1;

    const resumo = {
      id: pedido.id,
      criadoEm: pedido.criadoEm,
      itens: pedido.itens,
      total: pedido.total,
      modalidade: pedido.modalidade,
      endereco: pedido.endereco
    };
    atual.ultimoPedido = resumo;
    atual.historicoPedidos = [resumo, ...(atual.historicoPedidos || [])].slice(0, 20);
    dbLoja.clientesFidelidade[chave] = atual;
    pedido.cashbackSaldoAtual = atual.cashbackSaldo;
  }
  return { dbLoja, cashbackUsado };
}

module.exports = { lerDbLoja, salvarDbLoja, buscarPedidoPorIdGlobal, buscarClienteLoja, registrarPedidoCliente };
