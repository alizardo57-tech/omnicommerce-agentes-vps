let listaPedidosCache = [];
let tempoPreparoAtual = 35;
let filtroPedidos = 'todos';
let timerPedidosHandle = null;

function fmtMMSS(seg) {
  const s = Math.max(0, Math.floor(Math.abs(seg)));
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

async function renderPedidosCliente(box, t) {
  box.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-zinc-800">
        <div>
          <h3 class="text-lg font-black text-stone-900 dark:text-white">Pedidos & Cozinha • ${t.nome}</h3>
          <p class="text-xs text-stone-500 dark:text-zinc-400">Temporizador em tempo real, alerta de atraso e aviso automático de Pedido Pronto</p>
        </div>
        <div class="flex items-center gap-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl p-1.5 text-xs">
          <span class="font-bold text-stone-600 dark:text-zinc-400 px-1.5">⏱️ Tempo (Demanda):</span>
          <button onclick="ajustarTempoPreparo(-5)" class="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 font-black">-5m</button>
          <span id="txtTempoPreparo" class="font-black text-emerald-700 dark:text-emerald-400 px-2">${tempoPreparoAtual} min</span>
          <button onclick="ajustarTempoPreparo(5)" class="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 font-black">+5m</button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 text-xs">
        <button onclick="mudarFiltroPedidos('todos')" class="px-3 py-1.5 rounded-lg font-bold bg-stone-200 dark:bg-zinc-800 text-stone-900 dark:text-white">Todos</button>
        <button onclick="mudarFiltroPedidos('preparando')" class="px-3 py-1.5 rounded-lg font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">Em Preparo</button>
        <button onclick="mudarFiltroPedidos('atraso')" class="px-3 py-1.5 rounded-lg font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300">Em Atraso</button>
        <button onclick="mudarFiltroPedidos('pronto')" class="px-3 py-1.5 rounded-lg font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">Prontos</button>
      </div>

      <div id="listaPedidosCozinha" class="space-y-3">Carregando pedidos...</div>
    </div>`;

  await carregarPedidosCozinha();
  clearInterval(timerPedidosHandle);
  timerPedidosHandle = setInterval(atualizarTemporizadoresDom, 1000);
}

async function ajustarTempoPreparo(delta) {
  const novo = Math.max(5, Math.min(180, tempoPreparoAtual + delta));
  const res = await api('/api/cliente/preparo-tempo', { method: 'PUT', body: JSON.stringify({ tempoPreparoMin: novo }) });
  tempoPreparoAtual = res.tempoPreparoMin;
  const el = document.getElementById('txtTempoPreparo');
  if (el) el.innerText = `${tempoPreparoAtual} min`;
}

function mudarFiltroPedidos(f) {
  filtroPedidos = f;
  desenharListaPedidos();
}

async function carregarPedidosCozinha() {
  try {
    const res = await api('/api/cliente/pedidos-online');
    listaPedidosCache = res.pedidos || [];
    if (typeof res.tempoPreparoMin === 'number') {
      tempoPreparoAtual = res.tempoPreparoMin;
      const el = document.getElementById('txtTempoPreparo');
      if (el) el.innerText = `${tempoPreparoAtual} min`;
    }
    desenharListaPedidos();
  } catch {}
}

function estaEmAtraso(p) {
  if (p.statusPreparo === 'PRONTO') return false;
  const lim = (p.tempoPreparoMin || tempoPreparoAtual) * 60;
  const pass = (Date.now() - new Date(p.criadoEm).getTime()) / 1000;
  return pass > lim;
}

function desenharListaPedidos() {
  const box = document.getElementById('listaPedidosCozinha');
  if (!box) return;
  const filtrados = listaPedidosCache.filter(p => {
    if (filtroPedidos === 'pronto') return p.statusPreparo === 'PRONTO';
    if (filtroPedidos === 'atraso') return estaEmAtraso(p);
    if (filtroPedidos === 'preparando') return p.statusPreparo !== 'PRONTO' && !estaEmAtraso(p);
    return true;
  });
  if (!filtrados.length) {
    box.innerHTML = '<p class="text-xs text-stone-500 dark:text-zinc-400 py-8 text-center">Nenhum pedido nesta categoria.</p>';
    return;
  }
  box.innerHTML = filtrados.map(p => {
    const pronto = p.statusPreparo === 'PRONTO';
    const atrasado = estaEmAtraso(p);
    const itensTxt = (p.itens || []).map(i => `${i.qtd}x ${i.nome}`).join(', ');
    return `
      <div class="p-4 rounded-2xl border ${atrasado ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30' : pronto ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950'} flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1 text-xs min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <strong class="text-sm text-stone-900 dark:text-white">${p.clienteNome} (${p.id})</strong>
            <span data-timer-id="${p.id}" class="px-2.5 py-0.5 rounded-full text-[11px] font-black ${pronto ? 'bg-emerald-600 text-white' : atrasado ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-white'}">
              ${pronto ? '✅ PRONTO' : atrasado ? '🚨 EM ATRASO' : '⏱️ Preparando...'}
            </span>
          </div>
          <div class="font-bold text-emerald-700 dark:text-emerald-400">${itensTxt}</div>
          <div class="text-stone-600 dark:text-zinc-400">${p.modalidade === 'entrega' ? '🚚 Entrega: ' + p.endereco : '🏪 Retirada'} • ${String(p.formaPagamento).toUpperCase()} • R$ ${Number(p.total).toFixed(2)}</div>
        </div>
        <div class="flex items-center gap-2">
          ${!pronto ? `<button onclick="marcarPedidoPronto('${p.id}')" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm">✅ Pedido Pronto</button>` : ''}
          <a href="/cupom.html?pedido=${p.id}" target="_blank" class="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black">🖨️ Cupom</a>
        </div>
      </div>`;
  }).join('');
  atualizarTemporizadoresDom();
}

function atualizarTemporizadoresDom() {
  for (const p of listaPedidosCache) {
    const el = document.querySelector(`[data-timer-id="${p.id}"]`);
    if (!el || p.statusPreparo === 'PRONTO') continue;
    const limSeg = (p.tempoPreparoMin || tempoPreparoAtual) * 60;
    const passSeg = (Date.now() - new Date(p.criadoEm).getTime()) / 1000;
    const diff = limSeg - passSeg;
    el.innerText = diff >= 0 ? `⏱️ Faltam ${fmtMMSS(diff)}` : `🚨 ATRASADO +${fmtMMSS(diff)}`;
  }
}

async function marcarPedidoPronto(pedidoId) {
  await api(`/api/cliente/pedidos/${pedidoId}/pronto`, { method: 'POST' });
  await carregarPedidosCozinha();
}
