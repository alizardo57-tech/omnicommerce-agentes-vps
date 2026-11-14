let ultimoPedidoVisto = null;

function tocarAlertaNovoPedido() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1046, 1318].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
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

async function verificarPedidosOnline() {
  const telaCli = document.getElementById('telaCliente');
  if (!telaCli || telaCli.classList.contains('hidden')) return;

  try {
    const res = await api('/api/cliente/pedidos-online');
    const lista = res.pedidos || [];
    const pendentes = lista.filter(p => p.statusPreparo !== 'PRONTO').length;

    const btnAba = document.querySelector('#cliAbasModulos button[data-mod="pedidos"]');
    if (btnAba) {
      btnAba.innerHTML = `<i class="fa-solid fa-fire-burner mr-1.5"></i> Pedidos & Cozinha${pendentes > 0 ? ` <span class="ml-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px]">${pendentes}</span>` : ''}`;
    }

    if (lista.length) {
      const topo = lista[0];
      if (ultimoPedidoVisto && ultimoPedidoVisto !== topo.id) tocarAlertaNovoPedido();
      ultimoPedidoVisto = topo.id;
    }

    if (document.getElementById('listaPedidosCozinha') && typeof carregarPedidosCozinha === 'function') {
      carregarPedidosCozinha();
    }
  } catch {}
}

async function atualizarFeedConversas() {
  const feed = document.getElementById('feedConversasCamila');
  if (!feed) return;
  try {
    const res = await api('/api/cliente/conversas');
    const lista = res.conversas || [];
    if (!lista.length) {
      feed.innerHTML = '<p class="text-xs text-stone-500 dark:text-zinc-400">Nenhuma conversa recebida ainda. Teste pelo link do WhatsApp/Instagram!</p>';
      return;
    }
    feed.innerHTML = lista.map(c => `
      <div class="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-xs space-y-1">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${c.canal === 'Instagram' ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}">${c.canal || 'WhatsApp'}</span>
          <span class="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">${new Date(c.data).toLocaleTimeString('pt-BR')}</span>
        </div>
        <div class="text-stone-700 dark:text-zinc-300"><strong>Cliente:</strong> ${c.entrada}</div>
        <div class="text-emerald-800 dark:text-emerald-300"><strong>Camila:</strong> ${c.resposta}</div>
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
  box.innerHTML += `<div class="p-2.5 rounded-xl bg-stone-800 dark:bg-zinc-700 text-white max-w-[80%] ml-auto">${msg}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;
  try {
    const res = await api('/api/cliente/camila/chat', { method: 'POST', body: JSON.stringify({ mensagem: msg }) });
    box.innerHTML += `<div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-stone-800 dark:text-emerald-200 max-w-[85%]"><strong class="text-emerald-800 dark:text-emerald-300">Camila:</strong> ${res.resposta}</div>`;
    atualizarFeedConversas();
  } catch (err) {
    box.innerHTML += `<div class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">${err.message}</div>`;
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
