const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

function semAcento(txt) {
  return String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatarComanda2Vias(p) {
  const dataFmt = new Date(p.criadoEm || Date.now()).toLocaleString('pt-BR');
  const pago = p.status === 'PAGO';
  const linha = '------------------------------------------';
  const itens = (p.itens || []).map(i => `${i.qtd}x ${semAcento(i.nome)}\r\n   Subtotal: R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`).join('\r\n');

  return [
    'VIA 1 - SEPARACAO (BALCAO / COZINHA)',
    `PEDIDO: ${p.id}`,
    linha,
    `CLIENTE: ${semAcento(p.clienteNome)}`,
    `WHATSAPP: ${p.clienteWhatsapp}`,
    `DATA: ${dataFmt}`,
    `TIPO: ${p.modalidade === 'entrega' ? 'ENTREGA MOTOBOY' : 'RETIRADA NA LOJA'}`,
    linha,
    'ITENS PARA SEPARAR:',
    itens,
    linha,
    `STATUS: ${p.status}`,
    '',
    '==========================================',
    '           CORTAR AQUI                    ',
    '==========================================',
    '',
    p.modalidade === 'entrega' ? 'VIA 2 - MOTOBOY / ENTREGA' : 'VIA 2 - CONTROLE CLIENTE',
    `PEDIDO: ${p.id}`,
    linha,
    `DESTINATARIO: ${semAcento(p.clienteNome)}`,
    `CONTATO: ${p.clienteWhatsapp}`,
    `ENDERECO: ${semAcento(p.endereco)}`,
    `PAGAMENTO: ${String(p.formaPagamento).toUpperCase()}`,
    p.trocoPara ? `TROCO PARA: ${semAcento(p.trocoPara)}` : null,
    `TOTAL: R$ ${Number(p.total).toFixed(2).replace('.', ',')}`,
    pago ? '*** JA PAGO VIA PIX - NAO COBRAR ***' : '*** COBRAR NA ENTREGA / BALCAO ***',
    '',
    '',
    '',
    ''
  ].filter(v => v !== null).join('\r\n');
}

function imprimirComandaAutomatica(pedido) {
  if (process.env.AUTO_PRINT !== 'true' || !pedido) return;
  const pasta = path.join(__dirname, '..', '..', 'data', 'comandas');
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
  const arq = path.join(pasta, `${pedido.id}.txt`);
  fs.writeFileSync(arq, formatarComanda2Vias(pedido), 'utf8');

  if (process.platform !== 'win32') return;
  const arqEsc = arq.replace(/'/g, "''");
  const printer = (process.env.PRINTER_NAME || '').trim().replace(/'/g, "''");
  const cmd = printer
    ? `Get-Content -Raw -Path '${arqEsc}' | Out-Printer -Name '${printer}'`
    : `$b = Get-Printer -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'Bematech|MP-' } | Select-Object -First 1; if ($b) { Get-Content -Raw -Path '${arqEsc}' | Out-Printer -Name $b.Name } else { Get-Content -Raw -Path '${arqEsc}' | Out-Printer }`;

  execFile('powershell.exe', ['-NoProfile', '-Command', cmd], err => {
    if (err) console.error('Erro ao imprimir na Bematech:', err.message);
    else console.log(`🖨️ Comanda 2 vias enviada para Bematech: ${pedido.id}`);
  });
}

module.exports = { formatarComanda2Vias, imprimirComandaAutomatica };
