export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = req.headers['x-user-api-key'] || req.headers['x-api-key'] || req.body?.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key ausente.' });
  }

  const prompt = req.body?.messages?.[0]?.content || '';
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt vazio.' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.8
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({
        error: data?.error?.message || 'Erro Groq: ' + groqRes.status
      });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    if (!text) {
      return res.status(500).json({ error: 'Resposta vazia do Groq.' });
    }

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
