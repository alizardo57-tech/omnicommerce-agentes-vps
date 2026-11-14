const fs = require('fs');
const path = require('path');
const { SETORES } = require('../config/setores');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function garantirDiretorio() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function criarEstadoInicial() {
  const setorKey = SETORES[process.env.SETOR_INICIAL] ? process.env.SETOR_INICIAL : 'pizzaria';
  const setor = SETORES[setorKey];
  return {
    loja: {
      setor: setorKey,
      nome: process.env.NOME_LOJA || setor.nomePadrao,
      cidade: process.env.CIDADE_LOJA || 'Centro',
      donoWhatsapp: process.env.DONO_WHATSAPP || '',
      descontoMaxPct: 5,
      travadoParaCliente: true
    },
    produtos: JSON.parse(JSON.stringify(setor.produtosIniciais)),
    pedidos: [],
    cancelamentos: [],
    logsAgentes: []
  };
}

function lerDb() {
  garantirDiretorio();
  if (!fs.existsSync(DB_PATH)) {
    const inicial = criarEstadoInicial();
    salvarDb(inicial);
    return inicial;
  }
  const bruto = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(bruto);
}

function salvarDb(estado) {
  garantirDiretorio();
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(estado, null, 2), 'utf8');
  fs.renameSync(tempPath, DB_PATH);
}

function trocarSetorLoja(novoSetor, nomeCustom, cidadeCustom) {
  if (!SETORES[novoSetor]) {
    throw new Error(`Setor inválido: ${novoSetor}`);
  }
  const db = lerDb();
  const setor = SETORES[novoSetor];
  db.loja.setor = novoSetor;
  db.loja.nome = nomeCustom || setor.nomePadrao;
  if (cidadeCustom) db.loja.cidade = cidadeCustom;
  db.produtos = JSON.parse(JSON.stringify(setor.produtosIniciais));
  salvarDb(db);
  return db;
}

module.exports = { lerDb, salvarDb, trocarSetorLoja };
