const { garantirBaseSaaS } = require('../db/tenants');
const { lerDbLoja, salvarDbLoja } = require('../db/tenantStore');
const { enviarMensagemWhatsApp } = require('./whatsapp');

const MS_DIA = 24 * 60 * 60 * 1000;

function montarMensagemReativacao(tenant, cliente) {
  const nome = (cliente.nome || 'cliente').split(' ')[0];
  const saldo = Number(cliente.cashbackSaldo || 0);
  const link = `https://omnicommerce-agentes-api.onrender.com/loja.html?loja=${tenant.id}`;
  const parteCashback = saldo > 0
    ? `Você ainda tem R$ ${saldo.toFixed(2).replace('.', ',')} de cashback esperando por você! `
    : '';

  if (tenant.setor === 'pizzaria') {
    return `Oi ${nome}, tudo bem? Aqui é a Camila da ${tenant.nome}! Faz um tempinho que você não pede com a gente e bateu aquela saudade. ${parteCashback}Hoje temos promoções com borda grátis e você pode montar sua pizza 1/2 a 1/2 direto no nosso cardápio: ${link}`;
  }
  return `Oi ${nome}, tudo bem? Aqui é a Camila da ${tenant.nome}! Faz uns dias que você não passa por aqui. ${parteCashback}Confira nossas novidades e promoções no catálogo oficial: ${link}`;
}

async function processarReativacaoLoja(tenant, diasMinimos = 15, agoraMs = Date.now()) {
  const dbLoja = lerDbLoja(tenant.id);
  const clientes = Object.values(dbLoja.clientesFidelidade || {});
  const detalhes = [];
  let contatados = 0;

  for (const c of clientes) {
    const dataRef = c.ultimoPedido?.criadoEm;
    if (!dataRef || !c.whatsapp) continue;

    const diasInativo = (agoraMs - new Date(dataRef).getTime()) / MS_DIA;
    if (diasInativo < diasMinimos) continue;

    if (c.ultimoContatoReativacao) {
      const diasDesdeContato = (agoraMs - new Date(c.ultimoContatoReativacao).getTime()) / MS_DIA;
      if (diasDesdeContato < diasMinimos) continue;
    }

    const texto = montarMensagemReativacao(tenant, c);
    const envio = await enviarMensagemWhatsApp(c.whatsapp, texto);

    c.ultimoContatoReativacao = new Date(agoraMs).toISOString();
    contatados += 1;
    detalhes.push({ nome: c.nome, whatsapp: c.whatsapp, diasInativo: Math.floor(diasInativo), enviadoWhatsApp: envio.enviado, motivo: envio.motivo || 'OK' });

    dbLoja.logsAgentes.unshift({
      data: c.ultimoContatoReativacao,
      agente: '💬 Camila Reativação (15d)',
      canal: envio.enviado ? 'WhatsApp' : 'Simulação/Log',
      tenantId: tenant.id,
      setor: tenant.setor,
      entrada: `Inativo há ${Math.floor(diasInativo)} dias (${c.nome} - ${c.whatsapp})`,
      resposta: texto
    });
  }

  if (contatados > 0) {
    dbLoja.logsAgentes = dbLoja.logsAgentes.slice(0, 100);
    salvarDbLoja(tenant.id, dbLoja);
  }

  return { tenantId: tenant.id, totalAvaliados: clientes.length, contatados, detalhes };
}

async function rodarReativacaoInativos15Dias(diasMinimos = 15) {
  const db = garantirBaseSaaS();
  const resultados = [];
  for (const tenant of (db.tenants || [])) {
    if (!tenant.ativo || !tenant.modulos?.whatsapp_ia) continue;
    resultados.push(await processarReativacaoLoja(tenant, diasMinimos));
  }
  return resultados;
}

module.exports = { processarReativacaoLoja, rodarReativacaoInativos15Dias, montarMensagemReativacao };
