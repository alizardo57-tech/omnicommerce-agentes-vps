const params = new URLSearchParams(window.location.search);
const lojaId = params.get('loja') || 'cli_studiovip';
let produtosVitrine = [];
let lojaNome = 'Bella Pizza';
let lojaHandle = 'bellapizza';
let lojaLogo = '/img/bella-pizza-logo.jpg';
let lojaSetor = '';
let categoriaAtiva = 'Todas';
let sacola = [];
let curtidos = new Set();
let modalidade = 'entrega';
let formaPagamento = 'pix';
let pedidoAtual = null;

const FALLBACK_IMG = '/img/bella-pizza-logo.jpg';
document.getElementById('btnVoltarChat').href = `/demo-chat.html?loja=${lojaId}`;
const brl = v => Number(v).toFixed(2).replace('.', ',');

function ehPromocao(p) {
  return /borda gr[aá]tis|promo|pré-assada|pre-assada/i.test(`${p.categoria} ${p.nome}`);
}
function ehBebida(p) {
  return /bebida|coca|fanta|guaran[aá]|suco|[aá]gua|heineken|imp[eé]rio|imperio|refrigerante|sprite/i.test(`${p.categoria} ${p.nome}`);
}

async function carregarVitrine() {
  const resp = await fetch(`/api/demo/loja/${lojaId}`);
  const d = await resp.json();
  lojaNome = d.nome || 'Loja Online';
  lojaSetor = d.setor || '';
  lojaHandle = lojaNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  lojaLogo = lojaSetor === 'pizzaria' ? '/img/bella-pizza-logo.jpg' : '/img/produtos/101.jpg';
  produtosVitrine = d.produtos || [];

  document.title = `${lojaNome} • Cardápio Oficial`;
  document.getElementById('topoHandle').innerText = lojaHandle;
  document.getElementById('perfilLogo').src = lojaLogo;
  document.getElementById('statPosts').innerText = produtosVitrine.length;
  document.getElementById('vitrineNome').innerText = lojaNome;
  document.getElementById('vitrineSub').innerText = lojaSetor === 'pizzaria'
    ? 'Forno artesanal • Entrega rápida & Retirada • Monte 1/2 a 1/2 ou escolha direto no feed'
    : 'Catálogo oficial • Escolha no feed e finalize via PIX, cartão ou dinheiro';

  renderAcoesPerfil();
  renderCategorias();
  renderSecoesEspeciais();
  renderVitrine(produtosVitrine);
}

function renderAcoesPerfil() {
  const box = document.getElementById('acoesPerfil');
  if (!box) return;
  const btnMeio = lojaSetor === 'pizzaria'
    ? `<button onclick="abrirMeioAMeio()" class="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold">Montar Pizza 1/2 a 1/2</button>`
    : '';
  box.innerHTML = `
    ${btnMeio}
    <a href="/demo-chat.html?loja=${lojaId}" class="flex-1 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-center">Pedir c/ Camila</a>
    <button onclick="abrirCarrinho()" class="py-2 px-3.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold">Sacola</button>
  `;
}

function renderCategorias() {
  const el = document.getElementById('filtrosCategoria');
  if (!el) return;
  const catsBrutas = [...new Set(produtosVitrine.map(p => p.categoria).filter(Boolean))];
  const cats = lojaSetor === 'pizzaria'
    ? ['Todas', 'Monte sua Pizza', 'Promoções', ...catsBrutas.filter(c => !/monte sua pizza|borda gr[aá]tis/i.test(c))]
    : ['Todas', ...catsBrutas];

  el.innerHTML = cats.map(c => {
    const ativa = categoriaAtiva === c;
    const itemFoto = c === 'Todas'
      ? lojaLogo
      : (produtosVitrine.find(p => (c === 'Promoções' ? ehPromocao(p) : p.categoria === c) && p.imagem)?.imagem || lojaLogo);
    const acao = c === 'Monte sua Pizza' ? 'abrirMeioAMeio()' : `selecionarCategoria('${c}')`;
    return `
      <button onclick="${acao}" class="flex flex-col items-center gap-1 flex-shrink-0">
        <div class="w-14 h-14 rounded-full p-[2px] ${ativa ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-fuchsia-600' : 'bg-zinc-300'}">
          <img src="${itemFoto}" onerror="this.src='${lojaLogo}'" alt="${c}" class="w-full h-full rounded-full object-cover border-2 border-white bg-zinc-100">
        </div>
        <span class="text-[11px] max-w-[72px] truncate ${ativa ? 'font-extrabold text-zinc-900' : 'font-medium text-zinc-500'}">${c}</span>
      </button>`;
  }).join('');
}

function cardCarrosselHtml(p) {
  return `
    <div class="w-40 flex-shrink-0 snap-start bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
      <div>
        <div class="aspect-square bg-zinc-100 overflow-hidden">
          <img src="${p.imagem || FALLBACK_IMG}" onerror="this.src='${FALLBACK_IMG}'" alt="${p.nome}" class="w-full h-full object-cover">
        </div>
        <div class="p-2.5">
          <div class="text-xs font-bold text-zinc-900 line-clamp-2 leading-snug">${p.nome}</div>
          <div class="text-xs font-extrabold text-emerald-700 mt-1">R$ ${brl(p.preco)}</div>
        </div>
      </div>
      <div class="px-2.5 pb-2.5">
        <button onclick="adicionarSacola(${p.id})" class="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold">+ Adicionar</button>
      </div>
    </div>`;
}

function renderSecoesEspeciais() {
  const box = document.getElementById('secoesEspeciais');
  if (!box || lojaSetor !== 'pizzaria') { if (box) box.innerHTML = ''; return; }
  const promos = produtosVitrine.filter(ehPromocao);
  const bebidas = produtosVitrine.filter(ehBebida);

  box.innerHTML = `
    <div class="px-4">
      <button onclick="abrirMeioAMeio()" class="w-full p-4 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex items-center justify-between shadow-sm hover:opacity-95 transition text-left">
        <div class="flex items-center gap-3">
          <img src="${lojaLogo}" class="w-12 h-12 rounded-xl object-cover border border-white/20">
          <div>
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">1ª Opção • Mais Pedida</div>
            <div class="text-sm font-black">Monte sua Pizza 1/2 a 1/2</div>
            <div class="text-[11px] text-zinc-300">Escolha 2 sabores e continue para doces ou refrigerante</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right text-zinc-400"></i>
      </button>
    </div>

    ${promos.length ? `
    <section class="space-y-2">
      <div class="px-4 flex items-center justify-between">
        <h2 class="text-sm font-black text-zinc-900">2ª Opção • Promoções (Borda Grátis & Ofertas)</h2>
        <span class="text-[11px] text-zinc-500">Deslize pro lado →</span>
      </div>
      <div class="flex gap-3 overflow-x-auto px-4 pb-1 snap-x no-scrollbar">${promos.map(cardCarrosselHtml).join('')}</div>
    </section>` : ''}

    ${bebidas.length ? `
    <section id="secBebidas" class="space-y-2">
      <div class="px-4 flex items-center justify-between">
        <h2 class="text-sm font-black text-zinc-900">Refrigerantes & Bebidas</h2>
        <span class="text-[11px] text-zinc-500">Deslize pro lado →</span>
      </div>
      <div class="flex gap-3 overflow-x-auto px-4 pb-1 snap-x no-scrollbar">${bebidas.map(cardCarrosselHtml).join('')}</div>
    </section>` : ''}`;
}

function abrirMeioAMeio() {
  const sabores = produtosVitrine.filter(p => !ehBebida(p) && !/borda|trufa|pré-assada|pre-assada|brotinho|1 sabor|2 sabores/i.test(p.nome) && Number(p.preco) >= 40);
  if (sabores.length < 2) return;
  document.getElementById('modalTitulo').innerText = 'Monte sua Pizza (1/2 a 1/2)';
  document.getElementById('modalCheckout').classList.remove('hidden');
  document.getElementById('conteudoCheckout').innerHTML = `
    <div class="space-y-3 text-xs">
      <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">Escolha os 2 sabores da sua Pizza Grande 1/2 a 1/2 (cobra o maior valor).</div>
      <div><label class="font-bold text-zinc-700 block mb-1">1ª Metade (1/2):</label>
        <select id="lojaMeio1" onchange="atualizarPrecoMeio()" class="w-full border border-zinc-300 rounded-xl px-3 py-2.5">${sabores.map(s => `<option value="${s.id}">${s.nome} — R$ ${brl(s.preco)}</option>`).join('')}</select>
      </div>
      <div><label class="font-bold text-zinc-700 block mb-1">2ª Metade (1/2):</label>
        <select id="lojaMeio2" onchange="atualizarPrecoMeio()" class="w-full border border-zinc-300 rounded-xl px-3 py-2.5">${sabores.map((s, i) => `<option value="${s.id}" ${i === 1 ? 'selected' : ''}>${s.nome} — R$ ${brl(s.preco)}</option>`).join('')}</select>
      </div>
      <div id="precoMeioTxt" class="text-right font-extrabold text-base text-zinc-900"></div>
      <button onclick="confirmarMeioAMeio()" class="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold">Adicionar Pizza na Sacola</button>
    </div>`;
  atualizarPrecoMeio();
}

function atualizarPrecoMeio() {
  const s1 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio1')?.value);
  const s2 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio2')?.value);
  if (s1 && s2) document.getElementById('precoMeioTxt').innerText = `Valor: R$ ${brl(Math.max(Number(s1.preco), Number(s2.preco)))}`;
}

function confirmarMeioAMeio() {
  const s1 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio1').value);
  const s2 = produtosVitrine.find(p => String(p.id) === document.getElementById('lojaMeio2').value);
  if (!s1 || !s2) return;
  sacola.push({ id: s1.id, nome: `Pizza G 1/2 ${s1.nome} + 1/2 ${s2.nome}`, preco: Math.max(Number(s1.preco), Number(s2.preco)), qtd: 1 });
  atualizarBadge();
  document.getElementById('modalTitulo').innerText = 'Pizza adicionada! Continuar?';
  document.getElementById('conteudoCheckout').innerHTML = `
    <div class="space-y-2.5 text-xs">
      <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-center">Pizza 1/2 ${s1.nome} + 1/2 ${s2.nome} adicionada à sacola!</div>
      <button onclick="abrirMeioAMeio()" class="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold">+ Montar outra Pizza (1/2 a 1/2)</button>
      <button onclick="fecharCarrinho();selecionarCategoria('Pizzas Doces')" class="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold">Escolher Pizza Doce</button>
      <button onclick="fecharCarrinho();document.getElementById('secBebidas')?.scrollIntoView({behavior:'smooth'})" class="w-full py-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold">Escolher Refrigerante / Bebida</button>
      <button onclick="abrirCarrinho()" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Finalizar Pedido na Sacola</button>
    </div>`;
}

function selecionarCategoria(cat) {
  categoriaAtiva = cat;
  renderCategorias();
  filtrarVitrine();
  document.getElementById('gridVitrine')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filtrarVitrine() {
  const q = document.getElementById('buscaVitrine').value.trim().toLowerCase();
  const base = categoriaAtiva === 'Todas'
    ? produtosVitrine
    : categoriaAtiva === 'Promoções'
      ? produtosVitrine.filter(ehPromocao)
      : produtosVitrine.filter(p => p.categoria === categoriaAtiva);
  renderVitrine(!q ? base : base.filter(p => p.nome.toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q)));
}

function exigePresencial(nome) { return /aplica[çc][ãa]o|troca de joia/i.test(String(nome || '')); }
function sacolaBloqueiaEntrega() { return sacola.some(i => exigePresencial(i.nome)); }

function curtirPost(id) {
  if (curtidos.has(id)) curtidos.delete(id);
  else curtidos.add(id);
  const ic = document.getElementById(`like_${id}`);
  if (ic) ic.className = curtidos.has(id) ? 'fa-solid fa-heart text-rose-600 text-xl' : 'fa-regular fa-heart text-zinc-900 text-xl';
}

function renderVitrine(lista) {
  const box = document.getElementById('gridVitrine');
  if (!lista.length) {
    box.innerHTML = '<p class="text-center text-xs text-zinc-500 py-12">Nenhum item encontrado nesta categoria.</p>';
    return;
  }
  box.innerHTML = lista.map(p => {
    const liked = curtidos.has(p.id);
    const precoFmt = brl(p.preco);
    const legenda = p.descricao || (lojaSetor === 'pizzaria' ? 'Ingredientes selecionados e massa artesanal assada na hora.' : 'Item oficial disponível na loja.');
    return `
    <article class="pb-5">
      <div class="px-3.5 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <img src="${lojaLogo}" alt="${lojaNome}" class="w-8 h-8 rounded-full object-cover border border-zinc-200">
          <div class="min-w-0">
            <div class="text-xs font-bold text-zinc-900 truncate">${p.nome}</div>
            <div class="text-[11px] text-zinc-500">${p.categoria || lojaNome}</div>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold flex-shrink-0">R$ ${precoFmt}</span>
      </div>
      <div ondblclick="curtirPost(${p.id})" class="aspect-[4/3] bg-zinc-100 overflow-hidden relative select-none">
        <img src="${p.imagem || FALLBACK_IMG}" onerror="this.src='${FALLBACK_IMG}'" decoding="async" loading="lazy" alt="${p.nome}" class="w-full h-full object-cover">
      </div>
      <div class="px-3.5 pt-3 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-4">
            <button onclick="curtirPost(${p.id})" aria-label="Curtir"><i id="like_${p.id}" class="${liked ? 'fa-solid fa-heart text-rose-600' : 'fa-regular fa-heart text-zinc-900'} text-xl"></i></button>
            <a href="/demo-chat.html?loja=${lojaId}&item=${encodeURIComponent(p.nome)}" title="Perguntar à Camila"><i class="fa-regular fa-comment text-xl text-zinc-900"></i></a>
          </div>
          <button onclick="adicionarSacola(${p.id})" class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-sm">+ Pedir • R$ ${precoFmt}</button>
        </div>
        <div class="text-xs leading-relaxed text-zinc-800">
          <span class="font-bold mr-1">${lojaHandle}</span>
          <span class="font-semibold">${p.nome}</span> — <span class="text-zinc-600">${legenda}</span>
        </div>
      </div>
    </article>`;
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
function atualizarBadge() { document.getElementById('badgeSacola').innerText = sacola.reduce((a, b) => a + b.qtd, 0); }
function abrirCarrinho() { pedidoAtual = null; document.getElementById('modalTitulo').innerText = 'Finalizar Pedido'; document.getElementById('modalCheckout').classList.remove('hidden'); renderCheckout(); }
function fecharCarrinho() { document.getElementById('modalCheckout').classList.add('hidden'); }
function definirModalidade(m) { if (m === 'entrega' && sacolaBloqueiaEntrega()) return; modalidade = m; renderCheckout(); }
function definirPagamento(p) { formaPagamento = p; renderCheckout(); }

function renderCheckout() {
  const box = document.getElementById('conteudoCheckout');
  if (pedidoAtual) {
    const pago = pedidoAtual.status === 'PAGO', confirmado = pedidoAtual.status === 'PEDIDO_CONFIRMADO';
    const labelsPag = { pix: 'PIX', credito: 'Cartão de Crédito', debito: 'Cartão de Débito', dinheiro: 'Dinheiro' };
    const qrUrl = pedidoAtual.pixCopiaCola ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pedidoAtual.pixCopiaCola)}` : '';
    box.innerHTML = `
      <div class="p-4 rounded-2xl ${(pago || confirmado) ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'} text-center">
        <div class="font-bold ${(pago || confirmado) ? 'text-emerald-800' : 'text-amber-800'}">${pago ? 'Pagamento PIX Confirmado!' : confirmado ? 'Pedido Confirmado!' : 'Aguardando Pagamento PIX'}</div>
        <div class="text-xs text-zinc-600 mt-1">Pedido ${pedidoAtual.id} • ${labelsPag[pedidoAtual.formaPagamento] || 'PIX'} • Total R$ ${brl(pedidoAtual.total)}</div>
        ${pedidoAtual.trocoPara ? `<div class="text-xs text-zinc-700 font-semibold mt-1">Troco para: ${pedidoAtual.trocoPara}</div>` : ''}
      </div>
      ${(!pago && !confirmado && qrUrl) ? `
        <div class="flex flex-col items-center gap-3">
          <img src="${qrUrl}" alt="QR Code PIX" class="w-40 h-40 rounded-xl border border-zinc-200 p-1 bg-white">
          <button onclick="copiarPix()" class="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold">Copiar código PIX Copia e Cola</button>
          <button onclick="simularWebhookBanco()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Simular Confirmação do Banco (Webhook)</button>
        </div>` : `
        <div class="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
          <strong>${pedidoAtual.modalidade === 'entrega' ? 'Entrega para:' : 'Retirada na loja'}</strong><br>${pedidoAtual.endereco}<br>
          <span class="text-zinc-500">Pagamento: ${labelsPag[pedidoAtual.formaPagamento] || pedidoAtual.formaPagamento}</span>
        </div>
        <a href="/demo-chat.html?loja=${lojaId}&pedido=${encodeURIComponent(pedidoAtual.id)}" class="block text-center w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">Enviar Ordem do Pedido para a Camila</a>`}`;
    return;
  }
  if (!sacola.length) { box.innerHTML = '<p class="text-center text-zinc-500 py-8 text-xs">Sua sacola está vazia. Escolha um item no cardápio!</p>'; return; }
  const bloqueado = sacolaBloqueiaEntrega();
  if (bloqueado && modalidade === 'entrega') modalidade = 'retirada';
  const subtotal = sacola.reduce((a, b) => a + b.preco * b.qtd, 0), frete = modalidade === 'entrega' ? 15 : 0, total = subtotal + frete;
  box.innerHTML = `
    <div class="space-y-2">${sacola.map(i => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
        <div class="font-semibold text-zinc-800 flex-1 pr-2">${i.nome}</div>
        <div class="flex items-center gap-2">
          <button onclick="alterarQtd(${i.id},-1)" class="w-6 h-6 rounded-lg bg-white border border-zinc-300 font-bold">-</button>
          <span class="font-bold">${i.qtd}</span>
          <button onclick="alterarQtd(${i.id},1)" class="w-6 h-6 rounded-lg bg-white border border-zinc-300 font-bold">+</button>
          <span class="font-bold text-zinc-900 w-16 text-right">R$ ${brl(i.preco * i.qtd)}</span>
        </div>
      </div>`).join('')}</div>
    <div class="grid grid-cols-2 gap-2 text-xs">
      <button type="button" ${bloqueado ? 'disabled' : ''} onclick="definirModalidade('entrega')" class="p-3 rounded-xl border font-semibold ${bloqueado ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-60' : modalidade === 'entrega' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700'}">Receber em casa (+R$ 15)</button>
      <button type="button" onclick="definirModalidade('retirada')" class="p-3 rounded-xl border font-semibold ${modalidade === 'retirada' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700'}">Retirar na loja (Grátis)</button>
    </div>
    <form onsubmit="gerarPedidoPix(event)" class="space-y-2.5 text-xs">
      <input id="chkNome" required placeholder="Seu nome completo" class="w-full border border-zinc-300 rounded-xl px-3 py-2.5">
      <input id="chkZap" required placeholder="Seu WhatsApp (com DDD)" class="w-full border border-zinc-300 rounded-xl px-3 py-2.5">
      ${modalidade === 'entrega' ? '<input id="chkEnd" required placeholder="Endereço completo (Rua, nº, bairro)" class="w-full border border-zinc-300 rounded-xl px-3 py-2.5">' : ''}
      <div class="grid grid-cols-2 gap-2">
        <button type="button" onclick="definirPagamento('pix')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'pix' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-zinc-200 text-zinc-700'}">PIX</button>
        <button type="button" onclick="definirPagamento('credito')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'credito' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-zinc-200 text-zinc-700'}">Cartão Crédito</button>
        <button type="button" onclick="definirPagamento('debito')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'debito' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-zinc-200 text-zinc-700'}">Cartão Débito</button>
        <button type="button" onclick="definirPagamento('dinheiro')" class="p-2.5 rounded-xl border font-semibold ${formaPagamento === 'dinheiro' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-zinc-200 text-zinc-700'}">Dinheiro</button>
      </div>
      ${formaPagamento === 'dinheiro' ? '<input id="chkTroco" placeholder="Troco para quanto? (ex: R$ 100 ou Não)" class="w-full border border-zinc-300 rounded-xl px-3 py-2.5">' : ''}
      <div class="flex justify-between font-bold text-sm pt-2 border-t border-zinc-200"><span>Total do pedido</span><span>R$ ${brl(total)}</span></div>
      <button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">${formaPagamento === 'pix' ? 'Gerar PIX para Pagamento' : 'Confirmar Pedido'}</button>
    </form>`;
}

async function gerarPedidoPix(e) {
  e.preventDefault();
  const body = {
    clienteNome: document.getElementById('chkNome').value,
    clienteWhatsapp: document.getElementById('chkZap').value,
    modalidade, formaPagamento,
    trocoPara: formaPagamento === 'dinheiro' ? (document.getElementById('chkTroco')?.value || 'Sem troco') : '',
    endereco: modalidade === 'entrega' ? document.getElementById('chkEnd').value : 'Retirada na loja',
    itens: sacola
  };
  const resp = await fetch(`/api/demo/pedido/${lojaId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await resp.json();
  if (d.ok) { pedidoAtual = d.pedido; if (formaPagamento !== 'pix') { sacola = []; atualizarBadge(); } renderCheckout(); }
}
function copiarPix() { if (pedidoAtual) { navigator.clipboard.writeText(pedidoAtual.pixCopiaCola); alert('Código PIX copiado!'); } }
async function simularWebhookBanco() {
  if (!pedidoAtual) return;
  const resp = await fetch(`/api/pagamentos/webhook/${lojaId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pedidoId: pedidoAtual.id, status: 'approved' }) });
  const d = await resp.json();
  if (d.ok) { pedidoAtual = d.pedido; sacola = []; atualizarBadge(); renderCheckout(); }
}

carregarVitrine();