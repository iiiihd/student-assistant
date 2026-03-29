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
    const r = await fetch(`${KV_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const d = await r.json();
    return d.result;
  }

  async function kvSet(key, value) {
    await fetch(`${KV_URL}/set/${key}/${value}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
  }

  if (action === 'verify') {
    const VALID_CODES = ['TALEB01','TALEB02','TALEB03','TALEB04','TALEB05','TALEB06','TALEB07','TALEB08','TALEB09','TALEB10','TALEB11','TALEB12','TALEB13','TALEB14','TALEB15','TALEB16','TALEB17','TALEB18','TALEB19','TALEB20'];

    if (!VALID_CODES.includes(code)) {
      return res.status(200).json({ valid: false, reason: 'invalid' });
    }

    const savedDevice = await kvGet('code_' + code);

    if (!savedDevice) {
      await kvSet('code_' + code, deviceId);
      return res.status(200).json({ valid: true });
    }

    if (savedDevice === deviceId) {
      return res.status(200).json({ valid: true });
    }

    return res.status(200).json({ valid: false, reason: 'device' });
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
