export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const ADMIN_CHAT_ID = '5497560890';

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

  async function sendMsg(chatId, text, keyboard) {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  async function answerCallback(callbackId, text) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, text: text || '' })
    });
  }

  const MAIN_KEYBOARD = [
    [{ text: '💳 اشترك الآن', callback_data: 'subscribe' }],
    [
      { text: '🔍 تحقق من اشتراكي', callback_data: 'check_sub' },
      { text: '❓ مساعدة', callback_data: 'help' }
    ],
    [{ text: '📩 تواصل معنا', callback_data: 'contact' }]
  ];

  const FAQ = [
    { q: 'كيف أشترك؟', a: 'اضغط على زر "اشترك الآن" وسيصلك كودك فوراً بعد الدفع.' },
    { q: 'ما هي المواد المتاحة؟', a: 'رياضيات، فيزياء، كيمياء، أحياء، تاريخ، إنجليزي، وأكثر!' },
    { q: 'هل يعمل على أي جهاز؟', a: 'نعم! يعمل على الجوال والكمبيوتر. لكن الكود يعمل على جهاز واحد فقط.' },
    { q: 'ماذا يمكنني أن أفعل؟', a: 'اشرح الدروس، حل المسائل، لخص PDF، وحلل الصور.' }
  ];

  const update = req.body;

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text.startsWith('/start')) {
      await kvSet('tg_' + chatId, chatId);
      await sendMsg(chatId,
        `🎓 <b>أهلاً بك في مساعد الطلاب الذكي!</b>\n\n📚 مساعدك الذكي لـ:\n• شرح الدروس بالعربي\n• حل المسائل والواجبات\n• تلخيص ملفات PDF\n• تحليل صور المسائل\n\n💰 <b>الاشتراك الشهري: $2.99 فقط</b>\n\nاختر من القائمة أدناه 👇`,
        MAIN_KEYBOARD
      );
    } else if (text.startsWith('/help')) {
      await sendMsg(chatId,
        `❓ <b>الأسئلة الشائعة</b>\n\n${FAQ.map((f, i) => `${i+1}. <b>${f.q}</b>\n${f.a}`).join('\n\n')}`,
        [[{ text: '🔙 القائمة الرئيسية', callback_data: 'main_menu' }]]
      );
    } else if (text.startsWith('/check')) {
      const parts = text.split(' ');
      const code = parts[1]?.toUpperCase();
      if (code) {
        const VIP_CODES = new Set(['AH80','AH23','SKY77','GEM55','ADEL23']);
        if (VIP_CODES.has(code)) {
          await sendMsg(chatId, `⭐ <b>الكود: ${code}</b>\n\n✅ اشتراك دائم — لا ينتهي أبداً!`);
        } else {
          const expiry = await kvGet('exp_' + code);
          if (expiry) {
            const days = Math.floor((parseInt(expiry) - Date.now()) / (1000 * 60 * 60 * 24));
            if (days > 0) {
              await sendMsg(chatId, `✅ <b>الكود: ${code}</b>\n\n⏰ متبقي: <b>${days} يوم</b>`);
            } else {
              await sendMsg(chatId, `⚠️ <b>الكود: ${code}</b>\n\nانتهى اشتراكك. جدد الآن!`,
                [[{ text: '💳 جدد اشتراكك', callback_data: 'subscribe' }]]
              );
            }
          } else {
            await sendMsg(chatId, `❌ الكود غير موجود أو غير صحيح.`);
          }
        }
      } else {
        await sendMsg(chatId, `📝 أرسل كودك هكذا:\n<code>/check كودك</code>`);
      }
    } else if (chatId.toString() !== ADMIN_CHAT_ID && !text.startsWith('/')) {
      await sendMsg(ADMIN_CHAT_ID,
        `📩 <b>استفسار جديد</b>\n\nمن: <code>${chatId}</code>\nالرسالة: ${text}\n\nللرد أرسل مباشرة على chatId: ${chatId}`
      );
      await sendMsg(chatId,
        `✅ <b>تم استلام رسالتك!</b>\n\nسنرد عليك في أقرب وقت ممكن 😊`,
        [[{ text: '🔙 القائمة الرئيسية', callback_data: 'main_menu' }]]
      );
    }
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.from.id;
    const data = cb.data || '';

    await answerCallback(cb.id);

    if (data === 'subscribe') {
      await sendMsg(chatId,
        `💳 <b>الاشتراك الشهري — $2.99</b>\n\n✅ للاشتراك:\n1️⃣ أرسل لنا رسالة هنا\n2️⃣ سنرسل لك رابط الدفع\n3️⃣ بعد الدفع يصلك الكود فوراً ✅\n\n📩 اكتب "أريد الاشتراك" وسنتواصل معك!`,
        [[{ text: '🔙 رجوع', callback_data: 'main_menu' }]]
      );
    } else if (data === 'check_sub') {
      await sendMsg(chatId,
        `🔍 <b>تحقق من اشتراكك</b>\n\nأرسل كودك هكذا:\n<code>/check كودك</code>\n\nمثال: <code>/check M03QRE</code>`,
        [[{ text: '🔙 رجوع', callback_data: 'main_menu' }]]
      );
    } else if (data === 'help') {
      await sendMsg(chatId,
        `❓ <b>الأسئلة الشائعة</b>\n\n${FAQ.map((f, i) => `${i+1}. <b>${f.q}</b>\n${f.a}`).join('\n\n')}\n\n🌐 التطبيق: https://student-assistant-seven.vercel.app`,
        [[{ text: '🔙 رجوع', callback_data: 'main_menu' }]]
      );
    } else if (data === 'contact') {
      await sendMsg(chatId,
        `📩 <b>تواصل معنا</b>\n\nاكتب استفسارك أو مشكلتك مباشرة وسنرد عليك في أقرب وقت 😊`,
        [[{ text: '🔙 رجوع', callback_data: 'main_menu' }]]
      );
    } else if (data === 'main_menu') {
      await sendMsg(chatId,
        `🎓 <b>مساعد الطلاب الذكي</b>\n\nاختر من القائمة 👇`,
        MAIN_KEYBOARD
      );
    }
  }

  res.status(200).end();
}
