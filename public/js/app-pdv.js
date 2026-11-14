let pdvSacola = [];

function extrairSaboresPizza(produtos) {
  return (produtos || []).filter(p => !/borda|coca|fanta|suco|água|agua|heineken|império|imperio|trufa|pré-assada|pre-assada|brotinho|1 sabor|2 sabores/i.test(p.nome) && Number(p.preco) >= 40);
}

function renderPdvCliente(box, t, produtos) {
  const sabores = t.setor === 'pizzaria' ? extrairSaboresPizza(produtos) : [];
  box.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-lg font-black text-stone-900 dark:text-white">PDV Caixa • ${t.nome}</h3>
          <input id="pdvBusca" oninput="filtrarPdvGrid()" placeholder="Buscar item no cardápio..." class="bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600">
        </div>
        ${sabores.length >= 2 ? `
          <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-2.5">
            <div class="text-xs font-black text-amber-900 dark:text-amber-300">🍕 Montar Pizza 1/2 a 1/2 (cobra o maior valor)</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <select id="pdvMeio1" class="bg-white dark:bg-zinc-950 border border-amber-300 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-stone-900 dark:text-white font-medium">
                ${sabores.map(s => `<option value="${s.id}">${s.nome} (R$ ${Number(s.preco).toFixed(2)})</option>`).join('')}
              </select>
              <select id="pdvMeio2" class="bg-white dark:bg-zinc-950 border border-amber-300 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-stone-900 dark:text-white font-medium">
                ${sabores.map((s, idx) => `<option value="${s.id}" ${idx === 1 ? 'selected' : ''}>${s.nome} (R$ ${Number(s.preco).toFixed(2)})</option>`).join('')}
              </select>
              <button type="button" onclick="pdvAddMeioAMeio()" class="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white dark:text-zinc-950 font-black shadow-sm transition">+ Adicionar 1/2 a 1/2</button>
            </div>
          </div>` : ''}
        <div id="pdvGrid" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[430px] overflow-y-auto pr-1">
          ${produtos.map(p => `
            <div data-nome="${p.nome.toLowerCase()}" class="p-3 rounded-xl bg-stone-50 dark:bg-zinc-950 hover:bg-white dark:hover:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="text-xs font-bold text-stone-900 dark:text-white truncate">${p.nome}</div>
                <div class="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-0.5">R$ ${Number(p.preco).toFixed(2)} • <span class="text-stone-500 dark:text-zinc-400 font-sans">${p.estoque} un</span></div>
              </div>
              <button onclick="pdvAddItem(${p.id})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex-shrink-0 shadow-sm">+</button>
            </div>`).join('')}
        </div>
      </div>

      <div class="bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
        <div>
          <h4 class="text-sm font-black text-stone-900 dark:text-white mb-2">🧾 Comanda / Pedido</h4>
          <div id="pdvSacolaLista" class="space-y-1.5 max-h-48 overflow-y-auto text-xs"></div>
        </div>
        <form onsubmit="pdvFinalizarPedido(event)" class="space-y-2.5 text-xs border-t border-stone-200 dark:border-zinc-800 pt-3">
          <input id="pdvCliNome" required placeholder="Nome do cliente" class="w-full bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
          <input id="pdvCliZap" placeholder="WhatsApp (opcional)" class="w-full bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
          <div class="grid grid-cols-2 gap-2">
            <select id="pdvModalidade" onchange="document.getElementById('pdvEnd').classList.toggle('hidden', this.value!=='entrega')" class="bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-stone-900 dark:text-white font-medium">
              <option value="retirada">🏪 Balcão / Retirada</option>
              <option value="entrega">🚚 Entrega (+R$ 15)</option>
            </select>
            <select id="pdvPag" onchange="document.getElementById('pdvTroco').classList.toggle('hidden', this.value!=='dinheiro')" class="bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-stone-900 dark:text-white font-medium">
              <option value="dinheiro">💵 Dinheiro</option>
              <option value="pix">💠 PIX</option>
              <option value="credito">💳 Crédito</option>
              <option value="debito">💳 Débito</option>
            </select>
          </div>
          <input id="pdvEnd" placeholder="Endereço completo de entrega" class="hidden w-full bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
          <input id="pdvTroco" placeholder="Troco para quanto? (opcional)" class="w-full bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
          <div id="pdvTotalTxt" class="text-right text-base font-black text-emerald-700 dark:text-emerald-400">Total: R$ 0,00</div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm transition">✅ Lançar Pedido & Baixar Estoque</button>
          <div id="pdvMsgOk" class="text-center text-emerald-700 dark:text-emerald-300 font-bold"></div>
        </form>
      </div>
    </div>`;
  renderPdvSacola();
}

function filtrarPdvGrid() {
  const q = (document.getElementById('pdvBusca')?.value || '').trim().toLowerCase();
  document.querySelectorAll('#pdvGrid > div').forEach(el => {
    el.style.display = !q || el.dataset.nome.includes(q) ? '' : 'none';
  });
}

function pdvAddItem(id) {
  const p = (sessaoAtual.produtosSetor || []).find(x => Number(x.id) === Number(id));
  if (!p) return;
  const ex = pdvSacola.find(i => i.id === p.id && i.nome === p.nome);
  if (ex) ex.qtd += 1;
  else pdvSacola.push({ id: p.id, nome: p.nome, preco: p.preco, qtd: 1 });
  renderPdvSacola();
}

function pdvAddMeioAMeio() {
  const prods = sessaoAtual.produtosSetor || [];
  const s1 = prods.find(p => String(p.id) === document.getElementById('pdvMeio1').value);
  const s2 = prods.find(p => String(p.id) === document.getElementById('pdvMeio2').value);
  if (!s1 || !s2) return;
  const precoMaior = Math.max(Number(s1.preco), Number(s2.preco));
  const nome = `Pizza G 1/2 ${s1.nome} + 1/2 ${s2.nome}`;
  pdvSacola.push({ id: s1.id, nome, preco: precoMaior, qtd: 1 });
  renderPdvSacola();
}

function renderPdvSacola() {
  const box = document.getElementById('pdvSacolaLista');
  const totEl = document.getElementById('pdvTotalTxt');
  if (!box || !totEl) return;
  if (!pdvSacola.length) {
    box.innerHTML = '<p class="text-slate-500">Nenhum item lançado ainda.</p>';
    totEl.innerText = 'Total: R$ 0,00';
    return;
  }
  box.innerHTML = pdvSacola.map((i, idx) => `
    <div class="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800">
      <span class="text-stone-800 dark:text-zinc-200 font-medium truncate pr-2">${i.qtd}x ${i.nome}</span>
      <button type="button" onclick="pdvSacola.splice(${idx},1);renderPdvSacola()" class="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold">✕</button>
    </div>`).join('');
  const total = pdvSacola.reduce((a, b) => a + b.preco * b.qtd, 0);
  totEl.innerText = `Total: R$ ${total.toFixed(2)}`;
}

async function pdvFinalizarPedido(e) {
  e.preventDefault();
  if (!pdvSacola.length) return alert('Adicione pelo menos 1 item na comanda.');
  const t = sessaoAtual.tenant;
  const modalidade = document.getElementById('pdvModalidade').value;
  const formaPagamento = document.getElementById('pdvPag').value;
  const resp = await fetch(`/api/demo/pedido/${t.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clienteNome: document.getElementById('pdvCliNome').value,
      clienteWhatsapp: document.getElementById('pdvCliZap').value || 'Balcão',
      modalidade,
      formaPagamento,
      trocoPara: formaPagamento === 'dinheiro' ? document.getElementById('pdvTroco').value : '',
      endereco: modalidade === 'entrega' ? document.getElementById('pdvEnd').value : 'Balcão / Retirada',
      itens: pdvSacola
    })
  });
  const d = await resp.json();
  if (!resp.ok) return alert(d.erro || 'Erro ao lançar pedido');
  pdvSacola = [];
  renderPdvSacola();
  document.getElementById('pdvMsgOk').innerHTML = `✅ ${d.pedido.id} lançado! <a href="/cupom.html?pedido=${d.pedido.id}" target="_blank" class="underline text-amber-700 dark:text-amber-300 ml-1">Imprimir Cupom</a>`;
  if (typeof verificarPedidosOnline === 'function') verificarPedidosOnline();
}

function renderErpCliente(box, t, produtos) {
  box.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h3 class="text-lg font-black text-stone-900 dark:text-white">ERP Estoque & CMV (${t.nome})</h3>
      <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300">${produtos.length} itens cadastrados</span>
    </div>
    <form onsubmit="erpCadastrarProduto(event)" class="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 text-xs">
      <input id="erpNovoNome" required placeholder="Nome do produto/sabor" class="sm:col-span-2 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
      <input id="erpNovoPreco" required type="number" step="0.01" placeholder="Preço R$" class="bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
      <input id="erpNovoEst" required type="number" placeholder="Estoque" value="50" class="bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
      <button type="submit" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm transition">+ Cadastrar</button>
    </form>
    <div class="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-stone-200 dark:border-zinc-800"><table class="w-full text-left text-xs"><thead class="bg-stone-50 dark:bg-zinc-950 text-stone-600 dark:text-zinc-400 border-b border-stone-200 dark:border-zinc-800"><tr><th class="py-2.5 px-3">Produto</th><th class="py-2.5 px-3">Preço (R$)</th><th class="py-2.5 px-3">Estoque</th><th class="py-2.5 px-3 text-right">Ação</th></tr></thead>
    <tbody class="divide-y divide-stone-100 dark:divide-zinc-800">${produtos.map(p => `<tr class="hover:bg-stone-50 dark:hover:bg-zinc-800/50">
      <td class="py-2 px-3"><input id="erpEditNome_${p.id}" value="${String(p.nome).replace(/"/g, '&quot;')}" class="w-full min-w-[160px] bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-stone-900 dark:text-white font-bold"></td>
      <td class="py-2 px-3"><input id="erpEditPreco_${p.id}" type="number" step="0.01" value="${Number(p.preco).toFixed(2)}" class="w-24 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-emerald-700 dark:text-emerald-400 font-mono font-bold"></td>
      <td class="py-2 px-3"><input id="erpEditEst_${p.id}" type="number" value="${Number(p.estoque || 0)}" class="w-20 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-stone-700 dark:text-zinc-200 font-mono"></td>
      <td class="py-2 px-3 text-right"><button type="button" onclick="erpSalvarProduto(${p.id}, this)" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition">Salvar</button></td>
    </tr>`).join('')}</tbody></table></div>`;
}

async function erpSalvarProduto(id, btn) {
  const nome = document.getElementById(`erpEditNome_${id}`)?.value;
  const preco = Number(document.getElementById(`erpEditPreco_${id}`)?.value);
  const estoque = Number(document.getElementById(`erpEditEst_${id}`)?.value);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  await api(`/api/cliente/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome, preco, estoque })
  });
  if (btn) { btn.textContent = '✓ Salvo'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Salvar'; }, 1200); }
}

async function erpCadastrarProduto(e) {
  e.preventDefault();
  await api('/api/cliente/config', {
    method: 'PUT',
    body: JSON.stringify({
      novoProduto: {
        nome: document.getElementById('erpNovoNome').value,
        preco: Number(document.getElementById('erpNovoPreco').value),
        estoque: Number(document.getElementById('erpNovoEst').value)
      }
    })
  });
  if (typeof recarregarPermissoesCliente === 'function') recarregarPermissoesCliente();
}