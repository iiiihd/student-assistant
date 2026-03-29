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
      const r = await fetch(`${KV_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const d = await r.json();
      console.log('kvGet raw result:', JSON.stringify(d));
      return d.result;
    } catch(e) { 
      console.log('kvGet error:', e.message);
      return null; 
    }
  }

  async function kvSet(key, deviceId, expiry, type) {
    try {
      const r = await fetch(`${KV_URL}/hset/${key}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId, expiry: String(expiry), type })
      });
      const d = await r.json();
      console.log('kvSet result:', JSON.stringify(d));
      return d;
    } catch(e) { 
      console.log('kvSet error:', e.message);
      return null; 
    }
  }

  async function kvHGet(key, field) {
    try {
      const r = await fetch(`${KV_URL}/hget/${key}/${field}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const d = await r.json();
      console.log('kvHGet', field, ':', JSON.stringify(d));
      return d.result;
    } catch(e) { return null; }
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

    const savedDevice = await kvHGet('code_' + code, 'deviceId');
    console.log('savedDevice from hget:', JSON.stringify(savedDevice));

    if (!savedDevice) {
      const now = Date.now();
      let expiry = 0;
      if (type === 'monthly') expiry = now + (30 * 24 * 60 * 60 * 1000);
      if (type === 'yearly') expiry = now + (365 * 24 * 60 * 60 * 1000);
      await kvSet('code_' + code, deviceId, expiry, type);
      return res.status(200).json({ valid: true, type, expiry });
    }

    console.log('Comparing - saved:', JSON.stringify(savedDevice), 'current:', JSON.stringify(deviceId), 'match:', savedDevice === deviceId);

    if (savedDevice !== deviceId) {
      return res.status(200).json({ valid: false, reason: 'device' });
    }

    const savedExpiry = await kvHGet('code_' + code, 'expiry');
    const expiry = parseInt(savedExpiry) || 0;

    if (expiry !== 0 && Date.now() > expiry) {
      return res.status(200).json({ valid: false, reason: 'expired' });
    }

    const savedType = await kvHGet('code_' + code, 'type') || type;
    return res.status(200).json({ valid: true, type: savedType, expiry });
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
