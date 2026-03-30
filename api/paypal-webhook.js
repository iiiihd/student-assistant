export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  const MONTHLY_CODES = ['X7K2M9','Q4R8P1','W3N6T5','B9H4L2','F6J1N8','Y2P5R7','D8M3K6','G1T9W4','C5N2Q8','H7R4X1','J3L6B9','K8W1F5','M2Y7D3','N4T8G6','P9C3H2','R1X6J4','S5B2M7','T7Q9L1','V3F4N8','Z6H1W5'];
  const YEARLY_CODES = ['Y'+Math.random().toString(36).substr(2,5).toUpperCase()];

  async function kvGet(key) {
    try {
      const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const d = await r.json();
      return d.result;
    } catch(e) { return null; }
  }

  async function kvSet(key, value) {
    try {
      await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
    } catch(e) {}
  }

  async function kvGetNextCode(type) {
    const counterKey = 'counter_' + type;
    const counter = parseInt(await kvGet(counterKey) || '0');
    const codes = type === 'monthly' ? MONTHLY_CODES : YEARLY_CODES;
    const code = codes[counter % codes.length];
    await kvSet(counterKey, String(counter + 1));
    return code;
  }

  async function sendMsg(chatId, text) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  }

  try {
    const event = req.body;
    const eventType = event.event_type || '';

    if (eventType === 'PAYMENT.SALE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      const customId = event.resource?.custom_id || 
                       event.resource?.purchase_units?.[0]?.custom_id || '';
      
      if (!customId) return res.status(200).end();

      const chatId = customId;
      const subType = await kvGet('pending_' + chatId) || 'monthly';
      const code = await kvGetNextCode(subType);

      await sendMsg(chatId,
        `✅ <b>تم الدفع بنجاح!</b>\n\nكود الدخول الخاص بك:\n\n<code>${code}</code>\n\n📱 افتح التطبيق وادخل الكود:\nhttps://student-assistant-seven.vercel.app\n\n⚠️ الكود مرتبط بجهاز واحد فقط`
      );

      await kvSet('used_' + code, chatId);
    }
  } catch(e) {
    console.log('Webhook error:', e.message);
  }

  res.status(200).end();
}
