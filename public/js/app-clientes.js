let clientesCache = [];

async function renderClientesModule(box, t) {
  box.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-zinc-800">
        <div>
          <h3 class="text-lg font-black text-stone-900 dark:text-white">Cadastro de Clientes • ${t.nome}</h3>
          <p class="text-xs text-stone-500 dark:text-zinc-400" id="cliResumoTxt">Carregando clientes...</p>
        </div>
        <input id="cliBuscaInput" oninput="filtrarTabelaClientes()" placeholder="Buscar nome ou telefone..." class="bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white">
      </div>

      <form onsubmit="cadastrarClienteLoja(event)" class="grid grid-cols-1 sm:grid-cols-6 gap-2 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 text-xs">
        <input id="cadCliNome" required placeholder="Nome completo" class="sm:col-span-2 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
        <input id="cadCliZap" required placeholder="Telefone / WhatsApp" class="bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
        <input id="cadCliEnd" placeholder="Endereço completo" class="sm:col-span-2 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-stone-900 dark:text-white">
        <button type="submit" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black">+ Salvar Cliente</button>
      </form>

      <div class="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-stone-200 dark:border-zinc-800">
        <table class="w-full text-left text-xs">
          <thead class="bg-stone-50 dark:bg-zinc-950 text-stone-600 dark:text-zinc-400 border-b border-stone-200 dark:border-zinc-800">
            <tr><th class="py-2.5 px-3">Nome</th><th class="py-2.5 px-3">Telefone / WhatsApp</th><th class="py-2.5 px-3">Endereço</th><th class="py-2.5 px-3">Cashback</th><th class="py-2.5 px-3">Pedidos</th></tr>
          </thead>
          <tbody id="tbodyClientesLoja" class="divide-y divide-stone-100 dark:divide-zinc-800"></tbody>
        </table>
      </div>
    </div>`;
  await carregarClientesLoja();
}

async function carregarClientesLoja() {
  const res = await api('/api/cliente/fidelidade');
  clientesCache = res.clientes || [];
  const el = document.getElementById('cliResumoTxt');
  if (el) el.innerText = `${clientesCache.length} clientes cadastrados • Cashback ativo: ${res.cashbackTaxa ?? 5}%`;
  filtrarTabelaClientes();
}

function filtrarTabelaClientes() {
  const tb = document.getElementById('tbodyClientesLoja');
  if (!tb) return;
  const q = (document.getElementById('cliBuscaInput')?.value || '').trim().toLowerCase();
  const lista = (!q ? clientesCache : clientesCache.filter(c =>
    (c.nome || '').toLowerCase().includes(q) || (c.whatsapp || '').includes(q) || (c.endereco || '').toLowerCase().includes(q)
  )).slice(0, 150);

  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-stone-500 dark:text-zinc-400">Nenhum cliente encontrado.</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(c => `
    <tr class="hover:bg-stone-50 dark:hover:bg-zinc-800/40">
      <td class="py-2 px-3 font-bold text-stone-900 dark:text-white">${c.nome || '-'}</td>
      <td class="py-2 px-3 font-mono text-emerald-700 dark:text-emerald-400">${c.whatsapp || '-'}</td>
      <td class="py-2 px-3 text-stone-600 dark:text-zinc-300">${c.endereco || '-'}</td>
      <td class="py-2 px-3 font-mono font-bold">R$ ${Number(c.cashbackSaldo || 0).toFixed(2)}</td>
      <td class="py-2 px-3 font-mono">${c.qtdPedidos || 0}</td>
    </tr>`).join('');
}

async function cadastrarClienteLoja(e) {
  e.preventDefault();
  await api('/api/cliente/clientes', {
    method: 'POST',
    body: JSON.stringify({
      nome: document.getElementById('cadCliNome').value,
      whatsapp: document.getElementById('cadCliZap').value,
      endereco: document.getElementById('cadCliEnd').value
    })
  });
  e.target.reset();
  await carregarClientesLoja();
}
