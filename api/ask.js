export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, instruction, image, pdf, code, deviceId, action, history } = req.body;

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  async function kvGet(key) {
    try {
      const r = await fetch(`${KV_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const d = await r.json();
      return d.result;
    } catch(e) { return null; }
  }

  async function kvSet(key, value, expirySeconds) {
    try {
      let url = `${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
      if (expirySeconds) url += `/ex/${expirySeconds}`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const d = await r.json();
      console.log('kvSet:', JSON.stringify(d));
      return d;
    } catch(e) { return null; }
  }

  async function kvDel(key) {
    try {
      await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
    } catch(e) {}
  }

  const VIP_CODES = new Set(['AH80','AH23','SKY77','GEM55','ADEL23']);

  async function getCodeType(code) {
    if (VIP_CODES.has(code)) return 'vip';
    const stored = await kvGet('valid_' + code);
    if (!stored) return null;
    return stored;
  }

  if (action === 'verify') {
    const type = await getCodeType(code);
    if (!type) {
      return res.status(200).json({ valid: false, reason: 'invalid' });
    }

    const deviceKey = 'dev_' + code;
    const expiryKey = 'exp_' + code;

    const savedDevice = await kvGet(deviceKey);
    console.log('savedDevice:', savedDevice, 'currentDevice:', deviceId);

    if (!savedDevice) {
      let expirySeconds = 0;
      if (type === 'monthly') expirySeconds = 30 * 24 * 60 * 60;
      if (type === 'yearly') expirySeconds = 365 * 24 * 60 * 60;
      
      await kvSet(deviceKey, deviceId, expirySeconds);
      const expiryTimestamp = expirySeconds > 0 ? Date.now() + expirySeconds * 1000 : 0;
      if (expirySeconds > 0) await kvSet(expiryKey, String(expiryTimestamp));
      
      return res.status(200).json({ valid: true, type, expiry: expiryTimestamp });
    }

    if (savedDevice !== deviceId) {
      console.log('Device mismatch!');
      return res.status(200).json({ valid: false, reason: 'device' });
    }

    const savedExpiry = await kvGet(expiryKey);
    const expiryTimestamp = parseInt(savedExpiry) || 0;

    if (expiryTimestamp !== 0 && Date.now() > expiryTimestamp) {
      return res.status(200).json({ valid: false, reason: 'expired' });
    }

    return res.status(200).json({ valid: true, type, expiry: expiryTimestamp });
  }

  if (!question && !image && !pdf) return res.status(400).json({ error: 'No input provided' });

  if (deviceId) {
    const today = new Date().toISOString().split('T')[0];
    const countKey = 'count_' + deviceId + '_' + today;
    const count = parseInt(await kvGet(countKey) || '0');
    if (count > 50) {
      await new Promise(r => setTimeout(r, 10000));
    }
    await kvSet(countKey, String(count + 1), 86400);
  }

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
    const historyMessages = (history && Array.isArray(history)) ? history.map(h => ({ role: h.role, content: h.content })) : [];
    messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
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
