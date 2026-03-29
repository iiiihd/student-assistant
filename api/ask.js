export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, instruction, image, pdf, code, deviceId, action } = req.body;

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  async function kvGet(key) {
    try {
      const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const d = await r.json();
      return d.result || null;
    } catch(e) { return null; }
  }

  async function kvSet(key, value) {
    try {
      await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
    } catch(e) {}
  }

  const VIP_CODES = new Set(['AH80','AH23','SKY77','GEM55']);

  function getCodeType(code) {
    if (VIP_CODES.has(code)) return 'vip';
    if (code.startsWith('M')) return 'monthly';
    if (code.startsWith('Y')) return 'yearly';
    return null;
  }

  if (action === 'verify') {
    const type = getCodeType(code);
    if (!type) {
      return res.status(200).json({ valid: false, reason: 'invalid' });
    }

    const savedData = await kvGet('code_' + code);

    if (!savedData) {
      const now = Date.now();
      let expiry = 0;
      if (type === 'monthly') expiry = now + (30 * 24 * 60 * 60 * 1000);
      if (type === 'yearly') expiry = now + (365 * 24 * 60 * 60 * 1000);
      const dataToSave = deviceId + '|' + expiry + '|' + type;
      await kvSet('code_' + code, dataToSave);
      return res.status(200).json({ valid: true, type, expiry });
    }

    const parts = savedData.split('|');
    if (parts.length < 3) {
      return res.status(200).json({ valid: false, reason: 'error' });
    }

    const savedDevice = parts[0];
    const savedExpiry = parseInt(parts[1]);
    const savedType = parts[2];

    if (savedDevice !== deviceId) {
      return res.status(200).json({ valid: false, reason: 'device' });
    }

    if (savedExpiry !== 0 && Date.now() > savedExpiry) {
      return res.status(200).json({ valid: false, reason: 'expired' });
    }

    return res.status(200).json({ valid: true, type: savedType, expiry: savedExpiry });
  }

  if (!question && !image && !pdf) return res.status(400).json({ error: 'No input provided' });

  const API_KEY = process.env.OPENAI_API_KEY;
  const systemPrompt = 'أنت مساعد تعليمي ذكي للطلاب. ' + (instruction || 'اشرح بوضوح وسهولة باللغة العربية.');

  let messages;
  let model = 'gpt-4o-mini';

  if (image) {
    model = 'gpt-4o';
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + image } },
        { type: 'text', text: question || 'اشرح ما تراه في هذه الصورة بالتفصيل' }
      ]}
    ];
  } else if (pdf) {
    model = 'gpt-4o';
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: [
        { type: 'text', text: question || 'لخص هذا الملف واشرح أهم نقاطه بالعربي' },
        { type: 'image_url', image_url: { url: 'data:application/pdf;base64,' + pdf } }
      ]}
    ];
  } else {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({ model, messages, max_tokens: 2000 })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || 'API error' });
    }
    const text = data.choices?.[0]?.message?.content || 'لم أتمكن من الإجابة';
    return res.status(200).json({ answer: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
