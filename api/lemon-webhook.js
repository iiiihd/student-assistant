export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  const MONTHLY_CODES = ['M03QRE','M04I4J','M076TS','M0ABL3','M0BD1D','M0DQTD','M0ERZ0','M0F7JN','M0JS3Y','M0JU6E','M0LSFV','M0LXC8','M0N95R','M0P5ZY','M0PIKD','M0RTS5','M0S036','M0SKHQ','M16E77','M1CXZK','M1FM6E','M1PX2C','M1R09M','M1TN2Q','M1TOYD','M1U8JO','M1URQK','M1W2P3','M1ZWVH','M22IF8','M24YGP','M27COM','M2F4MC','M2GNEY','M2JFQU','M2LVWA','M2NGJX','M2PU2H','M2QJMQ','M2QMAH','M2ULTH','M2VWQU','M2Y67Y','M2ZF4Y','M2ZPUP','M328CA','M32DD8','M33HAC','M33OYC','M35WBC','M36PSC','M3BP2H','M3GEXF','M3IJA3','M3QDMU','M3VONI','M3YK01','M45N6B','M4671D','M46CUP','M475R7','M49CQE','M4C7ME','M4E3RJ','M4EQNK','M4EVIN','M4GRSN','M4JEHN','M4JPSI','M4OFZ1','M4R2BZ','M4TA8T','M4YP8Y','M51PBE','M51SZS','M54OQP','M56JV4','M59LXU','M5CIQ9','M5CZLR','M5DV4A','M5G143','M5I6EP','M5IAVN','M5J68X','M5SUK5','M5TYPE','M5V4UB','M64PN2','M66RJV','M66VM8','M67DXD','M6HE6X','M6IBQ3','M6IYUN','M6JT45','M6K49B','M6L08J','M6LV51','M6OUQ5','M6QQ16','M6R3BZ','M6SXAM','M6WQNG','M6XSTN','M71EHG','M7BCV4','M7DZJA','M7E895','M7HLEQ','M7IZIV','M7L8U5','M7LHZM','M7PZPK','M7QVJ7','M7RCGR','M7RZJD','M7UUB4','M801AI','M80P1C','M80XG0','M8281Q','M8CL26','M8IYEX','M8JC8E','M8LRBS','M8MM1O','M8PRFN','M8SVEV','M8X63T','M8XC5W','M8ZMCC','M906I0','M94X43','M96TJ2','M97F7Q','M97TCO','M98XFT','M9BUMH','M9CCOR','M9LAGE','M9LBFM','M9MICJ','M9TYIJ','M9VWKT','M9X9WE','M9YIZ1','MA36IA','MA4ZCE','MA6U24','MA7EDF','MAEYKY','MAJ2S8','MAJNF3','MAK76B','MAL9SU','MAML3H','MAO0Y4','MAPO16','MAWJDX','MAXLI2','MAXRNL','MAXTW6','MAXZJ9','MAYVQ9','MB0O6I','MB4834','MB5GJG','MB8CC5','MB9VJV','MBCGD1','MBE6IN','MBEU5Y','MBFAUY','MBG7Z2','MBJPIE','MBN0ZN','MBR37R','MBS92Y','MBXA26','MC0NZH','MC2Y7W','MC6GQO','MCB1ZN','MCEYNH','MCGS71','MCIF9J','MCJ6TJ','MCKXTJ','MCLUSA','MCPE9Y','MCPMWA','MCS9RQ','MCTQV8','MCYHKR','MD1HEX','MD2TDA','MD3DNP','MD3T4O','MD7LB2','MD9PX0','MDAEQM','MDF50X','MDFNLP','MDI02W','MDKW7S','MDMHS6','MDS0PL','MDTMI8','MDVZ0V','MDXS8J','MDYA2Y','ME0LTA','ME11SE','MEDLSI','MEHYP2','MEIWTZ','MEKUN3','MEN63W','MENI9R','MENPHQ','MEO7UO','MEQX9J','MEZ3PN','MF0PR9','MF26RN','MF3H8D','MF5RC6','MFD2SS','MFFCIV','MFGKTP','MFGS95','MFJV0P','MFMX9B','MFTW6M','MFVBVZ','MFVTB6','MFY7F8','MFZGSL','MFZOC4','MG4890','MG8FCE','MGG56J','MGR4B2','MGTV5L','MGUGTZ','MGVSUX','MGW9VF','MGWS8K','MH0FZR','MH5EQA','MH5SUE','MH7KFQ','MH7XEL','MHDLK2','MHDVFZ','MHHZUF','MHI3BR','MHJCUN','MHKR7Z','MHQ6MU','MHTY1O','MHUBPB','MI1MO3','MI4DXF','MI5HLM','MI7GR8','MIB30P','MIFRPS','MIH9WJ','MIK9E2','MIKXRG','MIL8LG','MINB7M','MIQ6MA','MIUAB2','MIXXH5','MIZSGB','MJ3XIT','MJDP0W','MJEELN','MJHHTE','MJKS35','MJLRX9','MJM6KC','MJODUL','MJPUPX','MJXR1V','MJYHHZ','MJYI8T','MJYQRW','MK4PHM','MK98HG','MKABRH','MKCPPD','MKDVA6','MKFSC8','MKGI40','MKHJ6O','MKJT9Z','MKMOJP','MKMPW1','MKO8J4','MKOUKN','MKOX7G','MKQXKU','MKXDFL','ML276B','ML4HBW','ML4NKN','ML5UZK','MLEQH5','MLG6Y9','MLGQ5H','MLHYPF','MLJJ6F','MLN5BO','MLT81K','MLWSB7','MM1804','MM72FW','MMDRTM','MMJCWM','MMJX6H','MMV6OR','MMXG7V','MMYFAX','MN2BLO','MN4ZJL','MN57QM','MN7832','MN78I8','MNGCAV','MNJMTS','MNP3T4','MNVR48','MNWEU3','MNYIBF','MO4R5T','MO5338','MO7UXW','MO8YJL','MOCJKB','MODBY2','MOGPX7','MOMXVM','MOPG7Y','MORVYS','MP0CG4','MP0P5K','MP11HL','MP1UF7','MPACC9','MPAFOP','MPEPBF','MPGNHG','MPHHQZ','MPJNS4','MPTJMJ','MPYYLT','MPZN6D','MQ1D0C','MQ1DCH','MQ75X8','MQ9SRK','MQAWQB','MQBTVD','MQCHVY','MQSHGM','MR2WIS','MR2WZI','MR62IK','MR7M21','MRB4XI','MRBS99','MRDVY2','MRFPTV','MRIEGU','MRKQG8','MROXP1','MRQ9BU','MRWDBP','MRY3TP','MRYQVU','MS0CPP','MS2FM4','MS5FSB','MSG0IN','MSJG42','MSJYZ2','MSO28L','MSTKON','MSUUD5','MSXR3H','MSZ8T0','MT0D10','MT3AU7','MT41MS','MT8B6W','MT8DT4','MTAWF8','MTDL7P','MTFHXV','MTKDK3','MTMF7B','MTOXJB','MTQQ0Q','MTTF4Z','MTTXFY','MTU1E1','MTVFBC','MTX4JZ','MTY4V7','MTYASJ','MU5P3L','MU63A1','MU7IUU','MUBGTD','MUC71I','MUKFM6','MULT0T','MUNPB1','MUNV6B','MUPZDE','MUQNO0','MUS5PK','MUS91D','MUSE1J','MUSNJQ','MUTBCB','MUUKYD','MUV7E1','MV08LK','MV38KH','MV6BGN','MV747D','MVB3UE','MVCYTM','MVD3ZJ','MVH4RF','MVKD1Q','MVO9TH','MVUI2O','MVZK6B','MW0ZBY','MW15SH','MW35MJ','MW4HKV','MW7GRY','MW7SQ9','MWD1MH','MWHF4C','MWINOU','MWJT3M','MWK75O','MWK7FK','MWS9J7','MWY0BA','MX162A','MX1NVO','MX69ID','MX6SCV','MXBCXJ','MXDEJF','MXJFPN','MXJSZR','MXQL4A','MXQUXD','MXSTP7','MXTQX3','MXTUS0','MXX8XP','MXZU7V','MY2WX5','MY5VI7','MY77EU','MY9OFS','MYA5TP','MYD1FQ','MYDA3N','MYEPP4','MYG1X4','MYL1JP','MYNDDG','MYR0C5','MYWXZ3','MYWYTA','MYXNUH','MYZ7DS','MYZS1L','MZ2MS3','MZ3OOW','MZ4CCQ','MZ5MTN','MZ5OXY','MZ8ZPZ','MZB7G6','MZHIVH','MZL780','MZX1IB'];

  async function kvGet(key) {
    try {
      const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
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
      await fetch(url, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
    } catch(e) {}
  }

  async function getNextCode() {
    const counterKey = 'counter_monthly';
    const counter = parseInt(await kvGet(counterKey) || '0');
    const code = MONTHLY_CODES[counter % MONTHLY_CODES.length];
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
    const body = req.body;
    const eventName = body?.meta?.event_name || '';
    console.log('Lemon event:', eventName);

    if (eventName === 'order_created' || eventName === 'subscription_created') {
      const customData = body?.meta?.custom_data || {};
      const chatId = customData?.telegram_chat_id || customData?.chat_id || '';

      if (chatId) {
        const oldCode = await kvGet('chatcode_' + chatId);
        let code;

        if (oldCode) {
          code = oldCode;
          const currentExpiry = parseInt(await kvGet('exp_' + code) || '0');
          const newExpiry = Math.max(currentExpiry, Date.now()) + 30 * 24 * 60 * 60 * 1000;
          await kvSet('exp_' + code, String(newExpiry));
        } else {
          code = await getNextCode();
          const expiryTimestamp = Date.now() + 30 * 24 * 60 * 60 * 1000;
          await kvSet('valid_' + code, 'monthly');
          await kvSet('exp_' + code, String(expiryTimestamp));
          await kvSet('chatcode_' + chatId, code);
        }

        const subscriptionId = body?.data?.id || '';
        if (subscriptionId) {
          await kvSet('sub_' + subscriptionId, code);
          if (chatId) await kvSet('subchat_' + subscriptionId, String(chatId));
        }

        await sendMsg(chatId,
          `✅ <b>تم الدفع بنجاح! مبروك! 🎉</b>\n\nكود الدخول الخاص بك:\n\n<code>${code}</code>\n\n📱 افتح التطبيق وأدخل الكود:\nhttps://student-assistant-seven.vercel.app\n\n⚠️ الكود يعمل على جهاز واحد فقط\n⏰ مدة الاشتراك: 30 يوم`
        );

        console.log('Code sent:', code, 'to:', chatId);
      } else {
        console.log('No chatId found in custom_data');
      }
    }

    if (eventName === 'subscription_payment_success') {
      const subscriptionId = body?.data?.id || '';
      if (subscriptionId) {
        const code = await kvGet('sub_' + subscriptionId);
        if (code) {
          const currentExpiry = parseInt(await kvGet('exp_' + code) || '0');
          const newExpiry = Math.max(currentExpiry, Date.now()) + 30 * 24 * 60 * 60 * 1000;
          await kvSet('exp_' + code, String(newExpiry));

          const chatId = await kvGet('subchat_' + subscriptionId);
          if (chatId) {
            await sendMsg(chatId,
              `🔄 <b>تم تجديد اشتراكك بنجاح!</b>\n\nكودك: <code>${code}</code>\n⏰ مدة الاشتراك: 30 يوم إضافية ✅`
            );
          }
          console.log('Subscription renewed:', code);
        }
      }
    }
  } catch(e) {
    console.log('Error:', e.message);
  }

  res.status(200).end();
}
