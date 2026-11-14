const { lerDb, salvarDb } = require('../db/store');
const { gerarRespostaIA } = require('../services/llm');
const { enviarMensagemWhatsApp } = require('../services/whatsapp');
const { enfileirarExecucao } = require('../services/filaCamila');
const { obterDefinicaoAgentes } = require('./definicoes11');

async function executarAgente({ agenteId, mensagem, clienteTelefone = null, enviarWhatsApp = false, tenant = null, canal = 'Painel', jaEnviouLink = false }) {
  const db = lerDb();
  const agentes = obterDefinicaoAgentes(db, tenant, { jaEnviouLink });
  const agente = agentes[agenteId];
  if (!agente) {
    throw new Error(`Agente desconhecido: ${agenteId}`);
  }

  const resposta = await enfileirarExecucao(() =>
    gerarRespostaIA(agente.prompt, mensagem, agente.fallback)
  );

  db.logsAgentes.unshift({
    data: new Date().toISOString(),
    agente: `${agente.numero}. ${agente.nome}`,
    canal,
    tenantId: tenant?.id || 'global',
    setor: tenant?.setor || db.loja.setor,
    entrada: mensagem.slice(0, 140),
    resposta: resposta.slice(0, 350)
  });
  db.logsAgentes = db.logsAgentes.slice(0, 100);
  salvarDb(db);

  let statusWhatsApp = null;
  if (enviarWhatsApp && clienteTelefone) {
    statusWhatsApp = await enviarMensagemWhatsApp(clienteTelefone, resposta);
  }

  return {
    agente: `${agente.numero}. ${agente.nome} (${agente.cargo})`,
    setor: db.loja.setor,
    resposta,
    statusWhatsApp
  };
}

async function notificarDonoAlerta(mensagemAlerta) {
  const db = lerDb();
  if (!db.loja.donoWhatsapp) return { enviado: false, motivo: 'DONO_WHATSAPP não definido' };
  return enviarMensagemWhatsApp(db.loja.donoWhatsapp, mensagemAlerta);
}

async function rodarRotinaDiariaAgentes() {
  const db = lerDb();
  const totalVendas = db.pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const resumo = await executarAgente({
    agenteId: 'fernanda',
    mensagem: `Gere o resumo diário da loja ${db.loja.nome}: ${db.pedidos.length} pedidos somando R$ ${totalVendas.toFixed(2)} e ${db.cancelamentos.length} cancelamentos.`
  });
  await executarAgente({
    agenteId: 'carlos',
    mensagem: 'Liste os produtos abaixo de 30 unidades em estoque para reposição.'
  });
  await notificarDonoAlerta(`📊 *Fechamento Diário (${db.loja.nome})*\n${resumo.resposta}`);
  return resumo;
}

module.exports = { executarAgente, notificarDonoAlerta, rodarRotinaDiariaAgentes };
