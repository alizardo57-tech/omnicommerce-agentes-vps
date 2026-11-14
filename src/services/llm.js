async function chamarGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini HTTP ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta do modelo.';
}

async function chamarOpenAI(systemPrompt, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
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

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return chamarOpenAI(systemPrompt, userMessage);
  }
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('COLE_SUA_CHAVE')) {
    return chamarGemini(systemPrompt, userMessage);
  }
  return `[Modo Offline sem API Key] ${fallbackTexto}`;
}

module.exports = { gerarRespostaIA };
