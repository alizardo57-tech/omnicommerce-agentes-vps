async function atualizarFeedConversas() {
  const feed = document.getElementById('feedConversasCamila');
  if (!feed) return;
  try {
    const res = await api('/api/cliente/conversas');
    const lista = res.conversas || [];
    if (lista.length === 0) {
      feed.innerHTML = '<p class="text-xs text-slate-500">Nenhuma conversa recebida ainda. Teste pelo link do WhatsApp/Instagram!</p>';
      return;
    }
    feed.innerHTML = lista.map(c => `
      <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded text-[10px] font-black ${c.canal === 'Instagram' ? 'bg-pink-500/20 text-pink-300' : 'bg-emerald-500/20 text-emerald-300'}">${c.canal || 'WhatsApp'}</span>
          <span class="text-[10px] text-slate-500 font-mono">${new Date(c.data).toLocaleTimeString('pt-BR')}</span>
        </div>
        <div class="text-slate-300"><strong>Cliente:</strong> ${c.entrada}</div>
        <div class="text-emerald-300"><strong>Camila:</strong> ${c.resposta}</div>
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
  box.innerHTML += `<div class="p-2.5 rounded-xl bg-slate-800 text-white max-w-[80%] ml-auto">${msg}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;
  try {
    const res = await api('/api/cliente/camila/chat', { method: 'POST', body: JSON.stringify({ mensagem: msg }) });
    box.innerHTML += `<div class="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 max-w-[85%]"><strong>Camila:</strong> ${res.resposta}</div>`;
    atualizarFeedConversas();
  } catch (err) {
    box.innerHTML += `<div class="p-2.5 rounded-xl bg-rose-950/50 text-rose-300 text-xs">${err.message}</div>`;
  }
  box.scrollTop = box.scrollHeight;
}

setInterval(atualizarFeedConversas, 5000);
