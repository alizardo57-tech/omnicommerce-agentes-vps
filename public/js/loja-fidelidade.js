let clienteReconhecido = null;
let cashbackTaxaLoja = 5;
let usarCashbackPedido = false;
let zapDebounce = null;

function aoDigitarZap(val) {
  clearTimeout(zapDebounce);
  const dig = String(val || '').replace(/\D/g, '');
  if (dig.length < 8) {
    clienteReconhecido = null;
    usarCashbackPedido = false;
    renderBoxFidelidade();
    return;
  }
  zapDebounce = setTimeout(async () => {
    try {
      const r = await fetch(`/api/demo/cliente/${lojaId}?whatsapp=${encodeURIComponent(dig)}`);
      const d = await r.json();
      cashbackTaxaLoja = Number(d.cashbackTaxa ?? 5);
      clienteReconhecido = d.encontrado ? d.cliente : null;
      if (clienteReconhecido) {
        const nom = document.getElementById('chkNome');
        const end = document.getElementById('chkEnd');
        if (nom && !nom.value.trim()) nom.value = clienteReconhecido.nome || '';
        if (end && !end.value.trim() && clienteReconhecido.endereco) end.value = clienteReconhecido.endereco;
      } else {
        usarCashbackPedido = false;
      }
      renderBoxFidelidade();
      atualizarResumoTotalCheckout();
    } catch {}
  }, 300);
}

function toggleUsarCashback(checked) {
  usarCashbackPedido = Boolean(checked);
  atualizarResumoTotalCheckout();
}

function repetirUltimoPedido() {
  if (!clienteReconhecido?.ultimoPedido?.itens?.length) return;
  sacola = clienteReconhecido.ultimoPedido.itens.map(i => ({ ...i }));
  atualizarBadge();
  renderCheckout();
  setTimeout(() => {
    const zap = document.getElementById('chkZap');
    const nom = document.getElementById('chkNome');
    const end = document.getElementById('chkEnd');
    if (zap) zap.value = clienteReconhecido.whatsapp || '';
    if (nom) nom.value = clienteReconhecido.nome || '';
    if (end && clienteReconhecido.endereco) end.value = clienteReconhecido.endereco;
    renderBoxFidelidade();
    atualizarResumoTotalCheckout();
  }, 50);
}

function atualizarResumoTotalCheckout() {
  const el = document.getElementById('chkTotalValor');
  if (!el) return;
  const subtotal = sacola.reduce((a, b) => a + b.preco * b.qtd, 0);
  const frete = modalidade === 'entrega' ? 15 : 0;
  let total = subtotal + frete;
  if (usarCashbackPedido && clienteReconhecido?.cashbackSaldo > 0) {
    total = Math.max(0, total - Math.min(clienteReconhecido.cashbackSaldo, total));
  }
  el.innerText = `R$ ${brl(total)}`;
}

function renderBoxFidelidade() {
  const box = document.getElementById('boxClienteFidelidade');
  if (!box) return;
  if (!clienteReconhecido) {
    box.innerHTML = `<div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">✨ Cashback ativo: ganhe <strong>${cashbackTaxaLoja}%</strong> de volta neste pedido!</div>`;
    return;
  }
  const ult = clienteReconhecido.ultimoPedido;
  const ultTxt = ult ? (ult.itens || []).map(i => `${i.qtd}x ${i.nome}`).join(', ') : '';
  const saldo = Number(clienteReconhecido.cashbackSaldo || 0);
  box.innerHTML = `
    <div class="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-2 text-[11px]">
      <div class="flex items-center justify-between gap-2">
        <span class="font-extrabold text-sky-900">👋 Olá, ${clienteReconhecido.nome}! (${clienteReconhecido.qtdPedidos} pedidos)</span>
        <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">Cashback: R$ ${brl(saldo)}</span>
      </div>
      ${ult ? `
        <div class="text-zinc-700 bg-white/80 rounded-lg p-2 border border-sky-100">
          <div><strong>Último pedido:</strong> ${ultTxt} (R$ ${brl(ult.total)})</div>
          <button type="button" onclick="repetirUltimoPedido()" class="mt-1.5 px-2.5 py-1 rounded-md bg-zinc-900 text-white font-bold">↻ Repetir último pedido</button>
        </div>` : ''}
      ${saldo > 0 ? `
        <label class="flex items-center gap-2 font-bold text-emerald-800 cursor-pointer">
          <input type="checkbox" ${usarCashbackPedido ? 'checked' : ''} onchange="toggleUsarCashback(this.checked)" class="accent-emerald-600 w-4 h-4">
          <span>Usar meu cashback de R$ ${brl(saldo)} neste pedido</span>
        </label>` : ''}
    </div>`;
}
