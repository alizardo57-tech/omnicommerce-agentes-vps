let ultimoPedidoVisto = null;
let alertaAtivo = false;

function tocarAlertaNovoPedido() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1046, 1318].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.14 + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.14);
      osc.stop(ctx.currentTime + i * 0.14 + 0.14);
    });
  } catch {}
}

function dispensarAlertaPedido() {
  alertaAtivo = false;
  const el = document.getElementById('alertaNovoPedidoBanner');
  if (el) {
    el.classList.remove('animate-pulse', 'border-rose-500', 'bg-rose-50');
    el.classList.add('border-emerald-300', 'bg-emerald-50');
  }
}

async function verificarPedidosOnline() {
  const telaCli = document.getElementById('telaCliente');
  if (!telaCli || telaCli.classList.contains('hidden')) return;

  let container = document.getElementById('painelPedidosAoVivo');
  if (!container) {
    const modBox = document.getElementById('cliConteudoModulo');
    if (!modBox) return;
    container = document.createElement('div');
    container.id = 'painelPedidosAoVivo';
    container.className = 'mb-4 space-y-2';
    modBox.parentNode.insertBefore(container, modBox);
  }

  try {
    const res = await api('/api/cliente/pedidos-online');
    const lista = res.pedidos || [];
    if (!lista.length) { container.innerHTML = ''; return; }
    const topo = lista[0];
    if (ultimoPedidoVisto && ultimoPedidoVisto !== topo.id) {
      alertaAtivo = true;
      tocarAlertaNovoPedido();
    }
    ultimoPedidoVisto = topo.id;
    const itensTxt = (topo.itens || []).map(i => `${i.qtd}x ${i.nome}`).join(', ');
    container.innerHTML = `
      <div id="alertaNovoPedidoBanner" class="p-4 rounded-2xl border-2 shadow-sm ${alertaAtivo ? 'animate-pulse border-rose-500 bg-rose-50' : 'border-emerald-300 bg-emerald-50'} flex flex-wrap items-center justify-between gap-3">
        <div class="text-xs">
          <div class="font-black text-stone-900 text-sm">${alertaAtivo ? '🔔 NOVO PEDIDO CHEGANDO!' : '📦 Último Pedido Recebido'} • ${topo.clienteNome} (${topo.id})</div>
          <div class="text-emerald-800 font-bold mt-0.5">${itensTxt}</div>
          <div class="text-stone-600 mt-0.5">${topo.modalidade === 'entrega' ? '🚚 Entrega: ' + topo.endereco : '🏪 Retirada / Estúdio'} • ${String(topo.formaPagamento).toUpperCase()}${topo.trocoPara ? ' (Troco: ' + topo.trocoPara + ')' : ''} • <strong class="text-stone-900">R$ ${Number(topo.total).toFixed(2)}</strong></div>
        </div>
        <div class="flex items-center gap-2">
          <a href="/cupom.html?pedido=${topo.id}" target="_blank" onclick="dispensarAlertaPedido()" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm">🖨️ Imprimir Cupom (2 Vias)</a>
          ${alertaAtivo ? '<button onclick="dispensarAlertaPedido()" class="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-bold hover:bg-stone-100">✔️ Ciente</button>' : ''}
        </div>
      </div>`;
  } catch {}
}

async function atualizarFeedConversas() {
  const feed = document.getElementById('feedConversasCamila');
  if (!feed) return;
  try {
    const res = await api('/api/cliente/conversas');
    const lista = res.conversas || [];
    if (lista.length === 0) {
      feed.innerHTML = '<p class="text-xs text-stone-500">Nenhuma conversa recebida ainda. Teste pelo link do WhatsApp/Instagram!</p>';
      return;
    }
    feed.innerHTML = lista.map(c => `
      <div class="p-3 rounded-xl bg-white border border-stone-200 text-xs space-y-1 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${c.canal === 'Instagram' ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-700'}">${c.canal || 'WhatsApp'}</span>
          <span class="text-[10px] text-stone-400 font-mono">${new Date(c.data).toLocaleTimeString('pt-BR')}</span>
        </div>
        <div class="text-stone-700"><strong>Cliente:</strong> ${c.entrada}</div>
        <div class="text-emerald-800"><strong>Camila:</strong> ${c.resposta}</div>
      </div>
    `).join('');
  } catch {}
}

async function enviarChatCamila(e) {
  e.preventDefault();
  const input = document.getElementById('inputChatCamila');
  const msg = input.value.trim();
  if (!msg) return;
  const box = document.getElementById('chatCamilaMsgs');
  box.innerHTML += `<div class="p-2.5 rounded-xl bg-stone-800 text-white max-w-[80%] ml-auto">${msg}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;
  try {
    const res = await api('/api/cliente/camila/chat', { method: 'POST', body: JSON.stringify({ mensagem: msg }) });
    box.innerHTML += `<div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-stone-800 max-w-[85%]"><strong class="text-emerald-800">Camila:</strong> ${res.resposta}</div>`;
    atualizarFeedConversas();
  } catch (err) {
    box.innerHTML += `<div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">${err.message}</div>`;
  }
  box.scrollTop = box.scrollHeight;
}

setInterval(() => { atualizarFeedConversas(); verificarPedidosOnline(); }, 5000);

window.addEventListener('DOMContentLoaded', () => {
  const lojaUrl = new URLSearchParams(window.location.search).get('loja');
  if (!lojaUrl) return;
  const emailMapa = { cli_bellapizza: 'bellapizza@loja.com', cli_studiovip: 'studiovip@loja.com', cli_fornonobre: 'fornonobre@loja.com' };
  setTimeout(() => {
    if (typeof sessaoAtual !== 'undefined' && sessaoAtual?.tenant?.id && sessaoAtual.tenant.id !== lojaUrl) {
      if (typeof sair === 'function') sair();
    }
    const inp = document.getElementById('loginEmail');
    if (inp && emailMapa[lojaUrl] && !inp.value) inp.value = emailMapa[lojaUrl];
  }, 400);
});