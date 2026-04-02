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
        `🎓 <b>أهلاً بك في مساعد الطلاب الذكي!</b>\n\n📚 مساعدك الشخصي لشرح الدروس وحل المسائل وتلخيص PDF\n\n💰 <b>الاشتراك الشهري: $2.99</b>\n\n📩 للاشتراك تواصل معنا مباشرة وسيصلك كودك فوراً:\n@StudentHelperAH_bot\n\n✅ بعد الاشتراك ادخل التطبيق:\nhttps://student-assistant-seven.vercel.app`
      );
    }
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    await answerCallback(cb.id);
  }

  res.status(200).end();
}
