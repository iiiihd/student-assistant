export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(200).end();

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const SITE_URL = process.env.SITE_URL || 'https://student-assistant-seven.vercel.app';

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

  const update = req.body;
  const msg = update.message;
  if (!msg) return res.status(200).end();

  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (text === '/start' || text.startsWith('/start')) {
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

  res.status(200).end();
}
