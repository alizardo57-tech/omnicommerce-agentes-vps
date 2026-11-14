async function tentarGeminiModelo(model, apiKey, systemPrompt, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const usaSystem = !model.startsWith('gemma-');
  const body = usaSystem
    ? {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
      }
    : {
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nCliente: ${userMessage}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
      };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini (${model}) HTTP ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function chamarGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  const principal = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const modelos = [...new Set([principal, 'gemini-flash-lite-latest', 'gemma-4-26b-a4b-it'])];

  let ultimoErro = null;
  for (const m of modelos) {
    try {
      const txt = await tentarGeminiModelo(m, apiKey, systemPrompt, userMessage);
      if (txt) return txt;
    } catch (err) {
      ultimoErro = err;
    }
  }
  throw ultimoErro || new Error('Nenhum modelo Gemini respondeu.');
}

async function chamarOpenAI(systemPrompt, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI HTTP ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || 'Sem resposta do modelo.';
}

async function gerarRespostaIA(systemPrompt, userMessage, fallbackTexto) {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      return await chamarOpenAI(systemPrompt, userMessage);
    }
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('COLE_SUA_CHAVE')) {
      return await chamarGemini(systemPrompt, userMessage);
    }
  } catch (err) {
    console.warn('Fallback IA acionado:', err.message);
    return fallbackTexto;
  }
  return `[Modo Offline sem API Key] ${fallbackTexto}`;
}

module.exports = { gerarRespostaIA };
