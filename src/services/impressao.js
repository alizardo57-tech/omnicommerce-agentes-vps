const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

function semAcento(txt) {
  return String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const LINHA = '------------------------------------------';

function formatarViaCozinha(p) {
  const dataFmt = new Date(p.criadoEm || Date.now()).toLocaleString('pt-BR');
  const itens = (p.itens || []).map(i => `${i.qtd}x ${semAcento(i.nome)}`).join('\r\n');
  return [
    'VIA 1 - COZINHA / SEPARACAO',
    `PEDIDO: ${p.id}`,
    LINHA,
    `CLIENTE: ${semAcento(p.clienteNome)}`,
    `WHATSAPP: ${p.clienteWhatsapp}`,
    `DATA: ${dataFmt}`,
    `TIPO: ${p.modalidade === 'entrega' ? 'ENTREGA MOTOBOY' : 'RETIRADA NA LOJA'}`,
    LINHA,
    'ITENS PARA PREPARO:',
    itens,
    LINHA,
    `STATUS: ${p.status}`
  ].join('\r\n');
}

function formatarViaMotoboy(p) {
  const pago = p.status === 'PAGO';
  const itens = (p.itens || []).map(i => `${i.qtd}x ${semAcento(i.nome)} (R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')})`).join('\r\n');
  return [
    p.modalidade === 'entrega' ? 'VIA 2 - MOTOBOY / ENTREGA' : 'VIA 2 - CONTROLE CLIENTE',
    `PEDIDO: ${p.id}`,
    LINHA,
    `DESTINATARIO: ${semAcento(p.clienteNome)}`,
    `CONTATO: ${p.clienteWhatsapp}`,
    `ENDERECO: ${semAcento(p.endereco)}`,
    LINHA,
    itens,
    LINHA,
    `PAGAMENTO: ${String(p.formaPagamento).toUpperCase()}`,
    p.trocoPara ? `TROCO PARA: ${semAcento(p.trocoPara)}` : null,
    `TOTAL: R$ ${Number(p.total).toFixed(2).replace('.', ',')}`,
    pago ? '*** JA PAGO VIA PIX - NAO COBRAR ***' : '*** COBRAR NA ENTREGA / BALCAO ***'
  ].filter(v => v !== null).join('\r\n');
}

function enviarArquivoNegritoBematech(arq, cb) {
  const arqEsc = arq.replace(/'/g, "''");
  const printer = (process.env.PRINTER_NAME || '').trim().replace(/'/g, "''");
  const selPrinter = printer
    ? `$doc.PrinterSettings.PrinterName = '${printer}'`
    : `$b = Get-Printer -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'Bematech|MP-' } | Select-Object -First 1; if ($b) { $doc.PrinterSettings.PrinterName = $b.Name }`;

  // Imprime via GDI em Fonte Negrito (FontStyle.Bold) para sair 100% legivel em cabeca termica fraca
  const ps = `
Add-Type -AssemblyName System.Drawing
$linhas = Get-Content -Path '${arqEsc}'
$doc = New-Object System.Drawing.Printing.PrintDocument
${selPrinter}
$font = New-Object System.Drawing.Font('Consolas', 10, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::Black
$idx = 0
$doc.add_PrintPage({
  param($s, $e)
  $y = 6
  $h = $font.GetHeight($e.Graphics) + 2
  while ($script:idx -lt $linhas.Length) {
    $e.Graphics.DrawString($linhas[$script:idx], $font, $brush, 4, $y)
    $y += $h
    $script:idx++
    if ($y + $h -gt $e.MarginBounds.Bottom) { $e.HasMorePages = $true; return }
  }
  $e.HasMorePages = $false
})
$doc.Print()
`.trim();

  execFile('powershell.exe', ['-NoProfile', '-Command', ps], cb);
}

function imprimirComandaAutomatica(pedido) {
  if (process.env.AUTO_PRINT !== 'true' || !pedido) return;
  const pasta = path.join(__dirname, '..', '..', 'data', 'comandas');
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

  const arq1 = path.join(pasta, `${pedido.id}_1_cozinha.txt`);
  const arq2 = path.join(pasta, `${pedido.id}_2_motoboy.txt`);
  fs.writeFileSync(arq1, formatarViaCozinha(pedido), 'utf8');
  fs.writeFileSync(arq2, formatarViaMotoboy(pedido), 'utf8');

  if (process.platform !== 'win32') return;
  enviarArquivoNegritoBematech(arq1, err1 => {
    if (err1) return console.error('Erro ao imprimir Via 1 (Cozinha):', err1.message);
    console.log(`🖨️ Via 1 (Cozinha) NEGRITO impressa e cortada: ${pedido.id}`);
    enviarArquivoNegritoBematech(arq2, err2 => {
      if (err2) console.error('Erro ao imprimir Via 2 (Motoboy):', err2.message);
      else console.log(`🖨️ Via 2 (Motoboy) NEGRITO impressa e cortada: ${pedido.id}`);
    });
  });
}

module.exports = { formatarViaCozinha, formatarViaMotoboy, imprimirComandaAutomatica };
