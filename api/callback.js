export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  const MONTHLY_LINK = 'https://www.paypal.com/ncp/payment/HQMBFGQJAMUZJ';
  const YEARLY_LINK = 'https://www.paypal.com/ncp/payment/HQMBFGQJAMUZJ';

  async function kvSet(key, value) {
    try {
      await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
    } catch(e) {}
  }

  async function answerCallback(callbackId) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId })
    });
  }

  async function sendMsg(chatId, text, keyboard) {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  const update = req.body;
  const cb = update.callback_query;
  if (!cb) return res.status(200).end();

  await answerCallback(cb.id);

  const data = cb.data || '';
  const chatId = cb.from.id;

  if (data.startsWith('monthly_')) {
    await kvSet('pending_' + chatId, 'monthly');
    await sendMsg(chatId,
      `📅 <b>اشتراك شهري</b>\n\n1️⃣ اضغط على زر الدفع أدناه\n2️⃣ أكمل الدفع على PayPal\n3️⃣ ارجع هنا وسيصلك الكود تلقائياً ✅`,
      [[{ text: '💳 ادفع الآن', url: MONTHLY_LINK + '?custom=' + chatId }]]
    );
  } else if (data.startsWith('yearly_')) {
    await kvSet('pending_' + chatId, 'yearly');
    await sendMsg(chatId,
      `⭐ <b>اشتراك سنوي - الأوفر!</b>\n\n1️⃣ اضغط على زر الدفع أدناه\n2️⃣ أكمل الدفع على PayPal\n3️⃣ ارجع هنا وسيصلك الكود تلقائياً ✅`,
      [[{ text: '💳 ادفع الآن', url: YEARLY_LINK + '?custom=' + chatId }]]
    );
  }

  res.status(200).end();
}
