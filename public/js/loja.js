const params = new URLSearchParams(window.location.search);
const lojaId = params.get('loja') || 'cli_studiovip';
let produtosVitrine = [];
let lojaSetor = '';
let categoriaAtiva = 'Todas';
let sacola = [];
let modalidade = 'entrega';
let formaPagamento = 'pix';
let pedidoAtual = null;

const FALLBACK_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f5f5f4"/><circle cx="200" cy="140" r="44" fill="none" stroke="#a8a29e" stroke-width="6"/><text x="200" y="220" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="14">Foto do Produto</text></svg>'
);

document.getElementById('btnVoltarChat').href = `/demo-chat.html?loja=${lojaId}`;

async function carregarVitrine() {
  const resp = await fetch(`/api/demo/loja/${lojaId}`);
  const d = await resp.json();
  document.getElementById('vitrineNome').innerText = d.nome || 'Loja Online';
  document.getElementById('vitrineSub').innerText = 'Escolha seus itens e finalize com PIX, cartão ou dinheiro';
  lojaSetor = d.setor || '';
  produtosVitrine = d.produtos || [];
  renderCategorias();
  renderVitrine(produtosVitrine);
}

function renderCategorias() {
  const el = document.getElementById('filtrosCategoria');
  if (!el) return;
  const cats = ['Todas', ...new Set(produtosVitrine.map(p => p.categoria).filter(Boolean))];
  const btnMeio = lojaSetor === 'pizzaria'
    ? `<button onclick="abrirMeioAMeio()" class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-white shadow-sm">🍕 Montar 1/2 a 1/2</button>`
    : '';
  if (cats.length <= 1 && !btnMeio) { el.innerHTML = ''; return; }
  el.innerHTML = btnMeio + cats.map(c => `
    <button onclick="selecionarCategoria('${c}')" class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
      categoriaAtiva === c ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
    }">${c}</button>
  `).join('');
}

function abrirMeioAMeio() {
  const sabores = produtosVitrine.filter(p => !/borda|coca|fanta|suco|água|agua|heineken|império|imperio|trufa|pré-assada|pre-assada|brotinho|1 sabor|2 sabores/i.test(p.nome) && Number(p.preco) >= 40);
  if (sabores.length < 2) return;
  document.getElementById('modalCheckout').classList.remove('hidden');
  document.getElementById('conteudoCheckout').innerHTML = `
    <div class="space-y-3 text-xs">
      <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">🍕 Monte sua Pizza Grande 1/2 a 1/2 (cobra o maior valor entre os 2 sabores)</div>
      <div><label class="font-bold text-stone-700 block mb-1">1ª Metade (1/2):</label>
        <select id="lojaMeio1" onchange="atualizarPrecoMeio()" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">${sabores.map(s => `<option value="${s.id}">${s.nome} — R$ ${Number(s.preco).toFixed(2).replace('.', ',')}</option>`).join('')}</select>
      </div>
      <div><label class="font-bold text-stone-700 block mb-1">2ª Metade (1/2):</label>
        <select id="lojaMeio2" onchange="atualizarPrecoMeio()" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">${sabores.map((s, i) => `<option value="${s.id}" ${i === 1 ? 'selected' : ''}>${s.nome} — R$ ${Number(s.preco).toFixed(2).replace('.', ',')}</option>`).join('')}</select>
      </div>
      <div id="precoMeioTxt" class="text-right font-extrabold text-base text-stone-900"></div>
      <button onclick="confirmarMeioAMeio()" class="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold">Adicionar Pizza 1/2 a 1/2 na Sacola</button>
    </div>`;
  atualizarPrecoMeio();
}

function atualizarPrecoMeio() {
  const s1 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio1')?.value);
  const s2 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio2')?.value);
  if (s1 && s2) {
    const val = Math.max(Number(s1.preco), Number(s2.preco));
    document.getElementById('precoMeioTxt').innerText = `Valor: R$ ${val.toFixed(2).replace('.', ',')}`;
  }
}

function confirmarMeioAMeio() {
  const s1 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio1').value);
  const s2 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio2').value);
  if (!s1 || !s2) return;
  sacola.push({ id: s1.id, nome: `Pizza G 1/2 ${s1.nome} + 1/2 ${s2.nome}`, preco: Math.max(Number(s1.preco), Number(s2.preco)), qtd: 1 });
  atualizarBadge();
  abrirCarrinho();
}

function selecionarCategoria(cat) {
  categoriaAtiva = cat;
  renderCategorias();
  filtrarVitrine();
}

function filtrarVitrine() {
  const q = document.getElementById('buscaVitrine').value.trim().toLowerCase();
  const base = categoriaAtiva === 'Todas' ? produtosVitrine : produtosVitrine.filter(p => p.categoria === categoriaAtiva);
  renderVitrine(!q ? base : base.filter(p => p.nome.toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q)));
}

function exigePresencial(nome) {
  return /aplica[çc][ãa]o|troca de joia/i.test(String(nome || ''));
}

function sacolaBloqueiaEntrega() {
  return sacola.some(i => exigePresencial(i.nome));
}

function renderVitrine(lista) {
  const box = document.getElementById('gridVitrine');
  box.innerHTML = lista.map(p => {
    const presencial = exigePresencial(p.nome);
    return `
    <article class="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
      <div class="aspect-[4/3] bg-stone-100 overflow-hidden relative">
        <img src="${p.imagem || FALLBACK_IMG}" onerror="this.src='${FALLBACK_IMG}'" alt="${p.nome}" class="w-full h-full object-cover">
        <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-stone-700 text-[11px] font-semibold shadow-sm">${p.estoque} disponíveis</span>
        <span class="absolute bottom-3 left-3 px-2.5 py-1 rounded-full ${presencial ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'} text-[10px] font-bold shadow-sm">
          ${presencial ? '📍 Somente no estúdio' : '🚚 Entrega ou Retirada'}
        </span>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h2 class="text-sm font-bold text-stone-900 leading-snug">${p.nome}</h2>
          ${p.descricao ? `<p class="text-xs text-stone-500 mt-1 line-clamp-2">${p.descricao}</p>` : ''}
          <p class="text-lg font-extrabold text-stone-900 mt-2">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</p>
        </div>
        <div class="mt-4 flex gap-2">
          <button onclick="adicionarSacola(${p.id})" class="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition">
            Adicionar à sacola
          </button>
          <a href="/demo-chat.html?loja=${lojaId}&item=${encodeURIComponent(p.nome)}" title="Perguntar no WhatsApp" class="px-3 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-emerald-700 text-xs font-semibold flex items-center justify-center">
            <i class="fa-brands fa-whatsapp text-base"></i>
          </a>
        </div>
      </div>
    </article>
  `;
  }).join('');
}

function adicionarSacola(id) {
  const prod = produtosVitrine.find(p => p.id === id);
  if (!prod) return;
  const ex = sacola.find(i => i.id === id);
  if (ex) ex.qtd += 1;
  else sacola.push({ id: prod.id, nome: prod.nome, preco: prod.preco, qtd: 1 });
  atualizarBadge();
  abrirCarrinho();
}

function alterarQtd(id, delta) {
  const item = sacola.find(i => i.id === id);
  if (!item) return;
  item.qtd += delta;
  if (item.qtd <= 0) sacola = sacola.filter(i => i.id !== id);
  atualizarBadge();
  renderCheckout();
}

function atualizarBadge() {
  document.getElementById('badgeSacola').innerText = sacola.reduce((a, b) => a + b.qtd, 0);
}

function abrirCarrinho() {
  pedidoAtual = null;
  document.getElementById('modalCheckout').classList.remove('hidden');
  renderCheckout();
}

function fecharCarrinho() {
  document.getElementById('modalCheckout').classList.add('hidden');
}

function definirModalidade(m) {
  if (m === 'entrega' && sacolaBloqueiaEntrega()) return;
  modalidade = m;
  renderCheckout();
}

function definirPagamento(p) {
  formaPagamento = p;
  renderCheckout();
}

function renderCheckout() {
  const box = document.getElementById('conteudoCheckout');
  if (pedidoAtual) {
    const pago = pedidoAtual.status === 'PAGO';
    const confirmado = pedidoAtual.status === 'PEDIDO_CONFIRMADO';
    const labelsPag = { pix: 'PIX', credito: 'Cartão de Crédito', debito: 'Cartão de Débito', dinheiro: 'Dinheiro' };
    const qrUrl = pedidoAtual.pixCopiaCola ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pedidoAtual.pixCopiaCola)}` : '';
    box.innerHTML = `
      <div class="p-4 rounded-2xl ${(pago || confirmado) ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'} text-center">
        <div class="text-2xl mb-1">${(pago || confirmado) ? '✅' : '⏳'}</div>
        <div class="font-bold ${(pago || confirmado) ? 'text-emerald-800' : 'text-amber-800'}">
          ${pago ? 'Pagamento PIX Confirmado pelo Banco!' : confirmado ? 'Pedido Confirmado!' : 'Aguardando Pagamento PIX'}
        </div>
        <div class="text-xs text-stone-600 mt-1">Pedido ${pedidoAtual.id} • ${labelsPag[pedidoAtual.formaPagamento] || 'PIX'} • Total R$ ${Number(pedidoAtual.total).toFixed(2).replace('.', ',')}</div>
        ${pedidoAtual.trocoPara ? `<div class="text-xs text-stone-700 font-semibold mt-1">Troco para: ${pedidoAtual.trocoPara}</div>` : ''}
      </div>
      ${(!pago && !confirmado && qrUrl) ? `
        <div class="flex flex-col items-center gap-3">
          <img src="${qrUrl}" alt="QR Code PIX" class="w-40 h-40 rounded-xl border border-stone-200 p-1 bg-white">
          <button onclick="copiarPix()" class="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold">Copiar código PIX Copia e Cola</button>
          <button onclick="simularWebhookBanco()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Simular Confirmação do Banco (Webhook)</button>
        </div>` : `
        <div class="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <strong>${pedidoAtual.modalidade === 'entrega' ? 'Entrega para:' : 'Retirada / Atendimento na loja'}</strong><br>
          ${pedidoAtual.endereco}<br>
          <span class="text-stone-500">Pagamento: ${labelsPag[pedidoAtual.formaPagamento] || pedidoAtual.formaPagamento} ${pedidoAtual.formaPagamento !== 'pix' ? '(na entrega / balcão)' : ''}</span>
        </div>
        <a href="/demo-chat.html?loja=${lojaId}&pedido=${encodeURIComponent(pedidoAtual.id)}" class="block text-center w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">Enviar Ordem do Pedido para a Camila</a>`}`;
    return;
  }

  if (!sacola.length) {
    box.innerHTML = '<p class="text-center text-stone-500 py-8 text-xs">Sua sacola está vazia. Escolha uma peça no catálogo!</p>';
    return;
  }

  const bloqueado = sacolaBloqueiaEntrega();
  if (bloqueado && modalidade === 'entrega') modalidade = 'retirada';
  const subtotal = sacola.reduce((a, b) => a + b.preco * b.qtd, 0);
  const frete = modalidade === 'entrega' ? 15 : 0;
  const total = subtotal + frete;

  box.innerHTML = `
    <div class="space-y-2">${sacola.map(i => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
        <div class="font-semibold text-stone-800 flex-1 pr-2">${i.nome}</div>
        <div class="flex items-center gap-2">
          <button onclick="alterarQtd(${i.id},-1)" class="w-6 h-6 rounded-lg bg-white border border-stone-300 font-bold">-</button>
          <span class="font-bold">${i.qtd}</span>
          <button onclick="alterarQtd(${i.id},1)" class="w-6 h-6 rounded-lg bg-white border border-stone-300 font-bold">+</button>
          <span class="font-bold text-stone-900 w-16 text-right">R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>`).join('')}</div>
    ${bloqueado ? '<div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">🔒 Itens com <strong>Aplicação</strong> ou <strong>Troca de Joia</strong> são presenciais no estúdio (entrega bloqueada).</div>' : ''}
    <div class="grid grid-cols-2 gap-2 text-xs">
      <button type="button" ${bloqueado ? 'disabled' : ''} onclick="definirModalidade('entrega')" class="p-3 rounded-xl border font-semibold ${bloqueado ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-60' : modalidade === 'entrega' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-700'}">🚚 ${bloqueado ? 'Entrega bloqueada' : 'Receber em casa (+R$ 15)'}</button>
      <button type="button" onclick="definirModalidade('retirada')" class="p-3 rounded-xl border font-semibold ${modalidade === 'retirada' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-700'}">🏪 ${bloqueado ? 'No estúdio (Obrigatório)' : 'Retirar na loja (Grátis)'}</button>
    </div>
    <form onsubmit="gerarPedidoPix(event)" class="space-y-2.5 text-xs">
      <input id="chkNome" required placeholder="Seu nome completo" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">
      <input id="chkZap" required placeholder="Seu WhatsApp (com DDD)" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">
      ${modalidade === 'entrega' ? '<input id="chkEnd" required placeholder="Endereço completo (Rua, nº, bairro, CEP)" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">' : ''}
      <div class="pt-1">
        <div class="font-semibold text-stone-700 mb-1.5">Forma de pagamento:</div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" onclick="definirPagamento('pix')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'pix' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-stone-700'}">💠 PIX</button>
          <button type="button" onclick="definirPagamento('credito')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'credito' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-stone-700'}">💳 Cartão Crédito</button>
          <button type="button" onclick="definirPagamento('debito')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'debito' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-stone-700'}">💳 Cartão Débito</button>
          <button type="button" onclick="definirPagamento('dinheiro')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'dinheiro' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-stone-700'}">💵 Dinheiro</button>
        </div>
      </div>
      ${formaPagamento === 'dinheiro' ? '<input id="chkTroco" placeholder="Precisa de troco para quanto? (ex: R$ 200,00 ou Não)" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">' : ''}
      <div class="flex justify-between font-bold text-sm pt-2 border-t border-stone-200">
        <span>Total do pedido</span>
        <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
      </div>
      <button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
        ${formaPagamento === 'pix' ? 'Gerar PIX para Pagamento' : 'Confirmar Pedido'}
      </button>
    </form>`;
}

async function gerarPedidoPix(e) {
  e.preventDefault();
  const body = {
    clienteNome: document.getElementById('chkNome').value,
    clienteWhatsapp: document.getElementById('chkZap').value,
    modalidade,
    formaPagamento,
    trocoPara: formaPagamento === 'dinheiro' ? (document.getElementById('chkTroco')?.value || 'Sem troco') : '',
    endereco: modalidade === 'entrega' ? document.getElementById('chkEnd').value : 'Retirada na loja',
    itens: sacola
  };
  const resp = await fetch(`/api/demo/pedido/${lojaId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await resp.json();
  if (d.ok) {
    pedidoAtual = d.pedido;
    if (formaPagamento !== 'pix') { sacola = []; atualizarBadge(); }
    renderCheckout();
  }
}

function copiarPix() {
  if (!pedidoAtual) return;
  navigator.clipboard.writeText(pedidoAtual.pixCopiaCola);
  alert('Código PIX copiado!');
}

async function simularWebhookBanco() {
  if (!pedidoAtual) return;
  const resp = await fetch(`/api/pagamentos/webhook/${lojaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pedidoId: pedidoAtual.id, status: 'approved' })
  });
  const d = await resp.json();
  if (d.ok) { pedidoAtual = d.pedido; sacola = []; atualizarBadge(); renderCheckout(); }
}

carregarVitrine();