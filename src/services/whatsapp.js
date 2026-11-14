async function enviarMensagemWhatsApp(numeroDestino, texto) {
  const baseUrl = process.env.EVOLUTION_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE || 'loja_principal';

  if (!baseUrl || !apiKey || !numeroDestino) {
    return { enviado: false, motivo: 'Evolution API ou número não configurado' };
  }

  const numeroLimpo = String(numeroDestino).replace(/\D/g, '');
  const resp = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey
    },
    body: JSON.stringify({
      number: numeroLimpo,
      text: texto
    })
  });

  if (!resp.ok) {
    const erro = await resp.text();
    return { enviado: false, motivo: `HTTP ${resp.status}: ${erro}` };
  }
  return { enviado: true };
}

module.exports = { enviarMensagemWhatsApp };
