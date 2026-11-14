const params = new URLSearchParams(window.location.search);
const lojaId = params.get('loja') || 'cli_studiovip';
let produtosVitrine = [];
let sacola = [];
let modalidade = 'entrega';
let pedidoAtual = null;

const FALLBACK_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f5f5f4"/><circle cx="200" cy="140" r="44" fill="none" stroke="#a8a29e" stroke-width="6"/><text x="200" y="220" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="14">Foto do Produto</text></svg>'
);

document.getElementById('btnVoltarChat').href = `/demo-chat.html?loja=${lojaId}`;

async function carregarVitrine() {
  const resp = await fetch(`/api/demo/loja/${lojaId}`);
  const d = await resp.json();
  document.getElementById('vitrineNome').innerText = d.nome || 'Loja Online';
  document.getElementById('vitrineSub').innerText = 'Escolha seus itens e finalize com PIX ou entrega';
  produtosVitrine = d.produtos || [];
  renderVitrine(produtosVitrine);
}

function filtrarVitrine() {
  const q = document.getElementById('buscaVitrine').value.trim().toLowerCase();
  renderVitrine(!q ? produtosVitrine : produtosVitrine.filter(p => p.nome.toLowerCase().includes(q)));
}

function renderVitrine(lista) {
  const box = document.getElementById('gridVitrine');
  box.innerHTML = lista.map(p => `
    <article class="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
      <div class="aspect-[4/3] bg-stone-100 overflow-hidden relative">
        <img src="${p.imagem || FALLBACK_IMG}" onerror="this.src='${FALLBACK_IMG}'" alt="${p.nome}" class="w-full h-full object-cover">
        <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-stone-700 text-[11px] font-semibold shadow-sm">${p.estoque} disponíveis</span>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h2 class="text-sm font-bold text-stone-900 leading-snug">${p.nome}</h2>
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
  `).join('');
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
  modalidade = m;
  renderCheckout();
}

function renderCheckout() {
  const box = document.getElementById('conteudoCheckout');
  if (pedidoAtual) {
    const pago = pedidoAtual.status === 'PAGO';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pedidoAtual.pixCopiaCola)}`;
    box.innerHTML = `
      <div class="p-4 rounded-2xl ${pago ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'} text-center">
        <div class="text-2xl mb-1">${pago ? '✅' : '⏳'}</div>
        <div class="font-bold ${pago ? 'text-emerald-800' : 'text-amber-800'}">${pago ? 'Pagamento Confirmado pelo Banco!' : 'Aguardando Pagamento PIX'}</div>
        <div class="text-xs text-stone-600 mt-1">Pedido ${pedidoAtual.id} • Total R$ ${Number(pedidoAtual.total).toFixed(2).replace('.', ',')}</div>
      </div>
      ${!pago ? `
        <div class="flex flex-col items-center gap-3">
          <img src="${qrUrl}" alt="QR Code PIX" class="w-40 h-40 rounded-xl border border-stone-200 p-1 bg-white">
          <button onclick="copiarPix()" class="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold">Copiar código PIX Copia e Cola</button>
          <button onclick="simularWebhookBanco()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Simular Confirmação do Banco (Webhook)</button>
        </div>` : `
        <div class="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <strong>${pedidoAtual.modalidade === 'entrega' ? 'Entrega confirmada para:' : 'Retirada / Agendamento na loja'}</strong><br>
          ${pedidoAtual.endereco}
        </div>
        <a href="/demo-chat.html?loja=${lojaId}&item=${encodeURIComponent('Acabei de pagar o pedido ' + pedidoAtual.id)}" class="block text-center w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">Voltar para o WhatsApp da Camila</a>`}`;
    return;
  }

  if (!sacola.length) {
    box.innerHTML = '<p class="text-center text-stone-500 py-8 text-xs">Sua sacola está vazia. Escolha uma peça no catálogo!</p>';
    return;
  }

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
    <div class="grid grid-cols-2 gap-2 text-xs">
      <button type="button" onclick="definirModalidade('entrega')" class="p-3 rounded-xl border font-semibold ${modalidade === 'entrega' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-700'}">🚚 Receber em casa (+R$ 15)</button>
      <button type="button" onclick="definirModalidade('retirada')" class="p-3 rounded-xl border font-semibold ${modalidade === 'retirada' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-700'}">🏪 Retirar na loja (Grátis)</button>
    </div>
    <form onsubmit="gerarPedidoPix(event)" class="space-y-2.5 text-xs">
      <input id="chkNome" required placeholder="Seu nome completo" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">
      <input id="chkZap" required placeholder="Seu WhatsApp (com DDD)" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">
      ${modalidade === 'entrega' ? '<input id="chkEnd" required placeholder="Endereço completo (Rua, nº, bairro, CEP)" class="w-full border border-stone-300 rounded-xl px-3 py-2.5">' : ''}
      <div class="flex justify-between font-bold text-sm pt-2 border-t border-stone-200">
        <span>Total a pagar no PIX</span>
        <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
      </div>
      <button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">Gerar PIX para Pagamento</button>
    </form>`;
}

async function gerarPedidoPix(e) {
  e.preventDefault();
  const body = {
    clienteNome: document.getElementById('chkNome').value,
    clienteWhatsapp: document.getElementById('chkZap').value,
    modalidade,
    endereco: modalidade === 'entrega' ? document.getElementById('chkEnd').value : 'Retirada na loja',
    itens: sacola
  };
  const resp = await fetch(`/api/demo/pedido/${lojaId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await resp.json();
  if (d.ok) { pedidoAtual = d.pedido; renderCheckout(); }
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