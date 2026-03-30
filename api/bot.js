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

  async function sendMsg(chatId, text, keyboard) {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  async function answerCallback(callbackId) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId })
    });
  }

  const update = req.body;

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text.startsWith('/start')) {
      await kvSet('tg_' + chatId, chatId);
      await sendMsg(chatId,
        `🎓 <b>أهلاً بك في مساعد الطلاب الذكي!</b>\n\nاختر نوع اشتراكك:`,
        [
          [
            { text: '📅 شهري', callback_data: 'monthly_' + chatId },
            { text: '⭐ سنوي (الأوفر)', callback_data: 'yearly_' + chatId }
          ]
        ]
      );
    }
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.from.id;
    const data = cb.data || '';

    await answerCallback(cb.id);

    if (data.startsWith('monthly_')) {
      await kvSet('pending_' + chatId, 'monthly');
      await sendMsg(chatId,
        `📅 <b>اشتراك شهري</b>\n\n✅ يقبل: فيزا، ماستركارد، PayPal\n\n1️⃣ اضغط زر الدفع\n2️⃣ أكمل الدفع\n3️⃣ سيصلك الكود هنا تلقائياً ✅`,
        [[{ text: '💳 ادفع بفيزا / ماستركارد / PayPal', url: MONTHLY_LINK + '?custom=' + chatId }]]
      );
    } else if (data.startsWith('yearly_')) {
      await kvSet('pending_' + chatId, 'yearly');
      await sendMsg(chatId,
        `⭐ <b>اشتراك سنوي - الأوفر!</b>\n\n✅ يقبل: فيزا، ماستركارد، PayPal\n\n1️⃣ اضغط زر الدفع\n2️⃣ أكمل الدفع\n3️⃣ سيصلك الكود هنا تلقائياً ✅`,
        [[{ text: '💳 ادفع بفيزا / ماستركارد / PayPal', url: YEARLY_LINK + '?custom=' + chatId }]]
      );
    }
  }

  res.status(200).end();
}
