const fs = require('fs');
const path = require('path');

const LOJAS_DIR = path.join(__dirname, '..', '..', 'data', 'lojas');

function garantirPastaLojas() {
  if (!fs.existsSync(LOJAS_DIR)) {
    fs.mkdirSync(LOJAS_DIR, { recursive: true });
  }
}

function limparId(tenantId) {
  return String(tenantId || 'global').replace(/[^a-zA-Z0-9_-]/g, '');
}

function lerDbLoja(tenantId) {
  garantirPastaLojas();
  const id = limparId(tenantId);
  const arq = path.join(LOJAS_DIR, `${id}.json`);
  if (!fs.existsSync(arq)) {
    const inicial = { tenantId: id, pedidosOnline: [], logsAgentes: [] };
    fs.writeFileSync(arq, JSON.stringify(inicial, null, 2), 'utf8');
    return inicial;
  }
  return JSON.parse(fs.readFileSync(arq, 'utf8'));
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

module.exports = { lerDbLoja, salvarDbLoja, buscarPedidoPorIdGlobal };