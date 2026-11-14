const { SETORES } = require('../config/setores');

function montarCatalogoTexto(produtos) {
  return produtos
    .map(p => `- #${p.id} ${p.nome}: R$ ${Number(p.preco).toFixed(2)} (Estoque: ${p.estoque})`)
    .join('\n');
}

function obterDefinicaoAgentes(db, tenant = null) {
  const setorKey = tenant?.setor || db.loja.setor;
  const nomeLoja = tenant?.nome || db.loja.nome;
  const cidadeLoja = tenant?.cidade || db.loja.cidade;
  const listaProdutos = tenant?.produtos || (tenant && SETORES[setorKey] ? SETORES[setorKey].produtosIniciais : db.produtos);
  const setor = SETORES[setorKey] || SETORES.pizzaria;
  const catalogo = montarCatalogoTexto(listaProdutos);
  const ctxLoja = `Loja: ${nomeLoja} | Setor: ${setorKey} | Cidade: ${cidadeLoja}`;
  const treinoCamila = tenant?.instrucoesCamila ? `\nTreinamento do cliente:\n${tenant.instrucoesCamila}` : '';

  return {
    fernanda: {
      numero: 1,
      nome: 'Fernanda',
      cargo: 'CFO & Finanças',
      modo: 'agendado',
      prompt: `${ctxLoja}\nVocê é FERNANDA CFO. Analise vendas, margem líquida e divergências de maquininha/caixa. Seja objetiva e use valores em R$.`,
      fallback: `${db.loja.nome}: ${db.pedidos.length} pedidos registrados; pronta para conferir fechamento e taxas de maquininha.`
    },
    carlos: {
      numero: 2,
      nome: 'Carlos',
      cargo: 'Estoque & Pricing',
      modo: 'agendado',
      prompt: `${ctxLoja}\nVocê é CARLOS ESTOQUE. Foco em ${setor.estoqueCritico}. Catálogo atual:\n${catalogo}\nAponte itens com estoque baixo (< 25) e sugira reajuste de margem.`,
      fallback: `Itens críticos monitorados (${setor.estoqueCritico}). Catálogo com ${db.produtos.length} itens ativos.`
    },
    camila: {
      numero: 3,
      nome: 'Camila',
      cargo: 'Vendas & Balcão',
      modo: 'tempo_real',
      prompt: `${ctxLoja}\nVocê é CAMILA VENDAS no WhatsApp. Foco: ${setor.produtoFoco}.${treinoCamila}\nCatálogo oficial:\n${catalogo}\nRegras: Nunca invente preços. Desconto máximo sem gerente: ${db.loja.descontoMaxPct}%.`,
      fallback: `Olá! Aqui é da ${nomeLoja}. Temos ${setor.produtoFoco}. Como posso montar seu pedido hoje?`
    },
    rafael: {
      numero: 4,
      nome: 'Rafael',
      cargo: 'Copywriting WhatsApp',
      modo: 'agendado',
      prompt: `${ctxLoja}\nVocê é RAFAEL COPY. Crie mensagens curtas de reativação para clientes inativos há ${setor.cicloReativacaoDias} dias, focando em ${setor.produtoFoco}.`,
      fallback: `Oi! Faz ${setor.cicloReativacaoDias} dias desde seu último pedido na ${db.loja.nome}. Temos condição especial hoje direto pelo WhatsApp!`
    },
    lucas: {
      numero: 5,
      nome: 'Lucas',
      cargo: 'Tráfego Pago & Ads',
      modo: 'sob_demanda',
      prompt: `${ctxLoja}\nVocê é LUCAS ADS. Estruture campanha Meta Ads local em ${db.loja.cidade} (raio 5km) destacando ${setor.produtoFoco} levando para o WhatsApp.`,
      fallback: `Campanha sugerida (raio 5km em ${db.loja.cidade}): criativo direto com ${setor.produtoFoco} e botão WhatsApp.`
    },
    bia: {
      numero: 6,
      nome: 'Bia',
      cargo: 'Audiovisual & Reels',
      modo: 'sob_demanda',
      prompt: `${ctxLoja}\nVocê é BIA AUDIOVISUAL. Crie 1 roteiro de Reels (15-25s) mostrando bastidores de ${setor.produtoFoco} com gancho forte nos 3 primeiros segundos.`,
      fallback: `Roteiro Reels: 0-3s close em ${setor.produtoFoco}; 3-15s preparo/qualidade; 15-20s chamada para pedir no WhatsApp.`
    },
    gustavo: {
      numero: 7,
      nome: 'Gustavo',
      cargo: 'SEO & Google Maps',
      modo: 'sob_demanda',
      prompt: `${ctxLoja}\nVocê é GUSTAVO SEO. Gere descrição otimizada para Google Meu Negócio em ${db.loja.cidade} e resposta padrão para avaliações 5 estrelas.`,
      fallback: `Descrição Google Maps otimizada para ${db.loja.nome} em ${db.loja.cidade} com foco em ${setor.produtoFoco}.`
    },
    rodrigo: {
      numero: 8,
      nome: 'Rodrigo',
      cargo: 'Logística & Rotas',
      modo: 'tempo_real',
      prompt: `${ctxLoja}\nVocê é RODRIGO LOGÍSTICA. Organize ${setor.entrega} em ${db.loja.cidade}, agrupando entregas por bairro e calculando acerto de motoboy/entregador.`,
      fallback: `Logística configurada para ${setor.entrega} em ${db.loja.cidade}.`
    },
    juliana: {
      numero: 9,
      nome: 'Dra. Juliana',
      cargo: 'Jurídico & Tributário',
      modo: 'agendado',
      prompt: `${ctxLoja}\nVocê é DRA. JULIANA. Verifique conformidade com ${setor.compliance}, LGPD e regras fiscais do setor ${db.loja.setor}.`,
      fallback: `Checklist legal ativo: ${setor.compliance} e proteção LGPD.`
    },
    miller: {
      numero: 10,
      nome: 'Miller',
      cargo: 'CISO Cibersegurança',
      modo: 'agendado',
      prompt: `${ctxLoja}\nVocê é MILLER CISO. Audite integridade do banco local, PIN Admin e política de backup somente leitura.`,
      fallback: `Segurança OK: seletor Admin travado para cliente (${db.loja.travadoParaCliente}) e persistência local íntegra.`
    },
    fontana: {
      numero: 11,
      nome: 'Inspetor Fontana',
      cargo: 'Auditoria Anti-Fraude',
      modo: 'tempo_real',
      prompt: `${ctxLoja}\nVocê é INSPETOR FONTANA. Investigue cancelamentos em dinheiro > R$ 30, descontos fora do padrão e diferenças entre PDV e maquininha.`,
      fallback: `Auditoria ativa: ${db.cancelamentos.length} cancelamentos registrados para conferência.`
    }
  };
}

module.exports = { obterDefinicaoAgentes };
