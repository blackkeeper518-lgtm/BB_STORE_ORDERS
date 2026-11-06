// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// 🎯 MASTER PURE PASS-THROUGH CHAT ENGINE V4.3 (DATE CUTOFF FILTER)
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

// ⚙️ [CONFIG] ตั้งค่าจำนวนวันย้อนหลังที่ต้องการดึง (0 = เฉพาะวันนี้เท่านั้น, 1 = ย้อนหลัง 1 วัน)

// ⚙️ [CONFIG] ตั้งค่าจำนวนวันย้อนหลังที่ต้องการดึง (0 = เฉพาะวันนี้เท่านั้น, 1 = ย้อนหลัง 1 วัน)
const DAYS_LOOKBACK = 1; 

const MASTERCONFIG = [
  { "page_index": "BB_01", "page_id": "103411062505149", "page_name": "🎀BBεїзเบอร์หนึ่งสโตร์", "assigned_agent": "#ไนท์รา", "assigned_hashtag": "🔮#BB_ORDER_01" },
  { "page_index": "BB_02", "page_id": "113923148350742", "page_name": "🎶BB ↠ STORE", "assigned_agent": "#Venika", "assigned_hashtag": "🔮#BB_ORDER_02" },
  { "page_index": "BB_03", "page_id": "111414924711459", "page_name": "🍇BBสโตร์.", "assigned_agent": "#Mali", "assigned_hashtag": "🔮#BB_ORDER_03" },
  { "page_index": "BB_04", "page_id": "1047257891810878", "page_name": "💗Bb store๐", "assigned_agent": "#🍉TANGMO", "assigned_hashtag": "🔮#BB_ORDER_04" },
  { "page_index": "BB_05", "page_id": "1064404466767377", "page_name": "เจ๊บี 🅱🅱", "assigned_agent": "#👑เจ๊บี", "assigned_hashtag": "🔮#BB_ORDER_05" },
  { "page_index": "BB_06", "page_id": "1235719106287717", "page_name": "🛒ร้าน:เจ๊บี", "assigned_agent": "#🍀ใบบัว", "assigned_hashtag": "🔮#BB_ORDER_06" },
  { "page_index": "BB_07", "page_id": "1032290633303246", "page_name": "💬ร้าน:เจ๊ B", "assigned_agent": "💬#", "assigned_hashtag": "🔮#BB_ORDER_07" }
];

const PAGE_MAP = new Map(MASTERCONFIG.map(p => [String(p.page_id), p]));
// ------------------------------------------------------------

function clean(value) {
  return String(value ?? '').replace(/[\u200B-\u200D\uFEFF]/gu, '').trim();
}

function formatThaiDateTime(ms) {
  if (!Number.isFinite(ms)) return { full: "DATA_MISSING", display: "00:00", message_time_display: "00:00" };
  const date = new Date(ms);
  const now = new Date();
  
  const options = { timeZone: 'Asia/Bangkok', hour12: false };
  const day = date.toLocaleDateString('en-US', { ...options, day: '2-digit' });
  const month = date.toLocaleDateString('en-US', { ...options, month: '2-digit' });
  const year = String(Number(date.toLocaleDateString('en-US', { ...options, year: 'numeric' })) + 543).slice(-2);
  const clock = date.toLocaleTimeString('en-GB', options);
  const clockShort = clock.slice(0, 5);

  const isToday = date.toLocaleDateString('en-US', options) === now.toLocaleDateString('en-US', options);
  const displaySmart = isToday ? clockShort : `${day}/${month} ${clockShort}`;
  
  const full = date.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  return { full, display: displaySmart, message_time_display: displaySmart };
}

function value(row, key) {
  const raw = row?.[key];
  return raw === null || raw === undefined ? '' : String(raw).trim();
}

function firstExisting(row, keys) {
  for (const key of keys) {
    const found = value(row, key);
    if (found) return found;
  }
  return '';
}

function parseCustomerMessageTime(raw) {
  if (raw instanceof Date) {
    const ms = raw.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    return Number.isFinite(ms) ? ms : null;
  }

  const text = clean(raw);
  if (!text) return null;

  // ISO and year-first timestamps are unambiguous; use them directly.
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const ms = Date.parse(text);
    return Number.isFinite(ms) ? ms : null;
  }

  // Thai/local date: DD/MM/YYYY HH:mm[:ss], including Buddhist years.
  // Interpret local time as Asia/Bangkok (UTC+7).
  const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:[, T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  if (year >= 2400) year -= 543;
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const second = Number(match[6] || 0);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(localAsUtc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return localAsUtc - 7 * 60 * 60 * 1000;
}

function getParcelStatusEmoji(row, nowMs = Date.now()) {
  // สายแชทคำนวณจากอายุข้อความล่าสุดของลูกค้าเท่านั้น
  if (!value(row, 'customer_latest_message')) return null;
  const messageTimeMs = parseCustomerMessageTime(value(row, 'customer_message_time_th'));
  if (messageTimeMs === null || messageTimeMs > nowMs) return null;

  const ageHours = (nowMs - messageTimeMs) / 3600000;
  if (ageHours >= 48) return '🔴';
  if (ageHours >= 24) return '🟡';
  return '🟢';
}

function getAttachments(m) {
  const atts = m.attachments?.data || m.attachments || [];
  const shares = m.shares?.data || m.shares || [];
  const sticker = m.sticker || null;

  const urls = [];
  const raws = [];
  let has = false;
  let type = null;

  if (Array.isArray(atts) && atts.length > 0) {
    has = true;
    for (const a of atts) {
      const imgUrl = a.image_data?.url || a.image_data?.preview_url || a.file_url || a.payload?.url || a.url || a.media?.image?.url || "";
      const t = a.mime_type || a.type || 'image';
      type = t;
      if (imgUrl) urls.push(imgUrl);
      raws.push({ type: t, url: imgUrl, name: a.name || '', id: a.id || '' });
    }
  }

  if (Array.isArray(shares) && shares.length > 0) {
    has = true;
    for (const s of shares) {
      const link = s.link || s.url || s.media?.image?.url || "";
      if (link) {
        urls.push(link);
        raws.push({ type: 'share', url: link, name: s.title || '', id: s.id || '' });
        type = type || 'image';
      }
    }
  }

  if (sticker) {
    has = true;
    const sUrl = sticker?.image_data?.url || sticker?.url || m.sticker_url || "";
    if (sUrl) {
      urls.push(sUrl);
      raws.push({ type: 'sticker', url: sUrl, id: sticker.id || '' });
      type = 'sticker';
    }
  }

  return { has: urls.length > 0 || has, type: type || (urls.length > 0 ? 'image' : null), urls, raw: raws };
}

const output = [];
const seen = new Set();
const HOUR_MS = 60 * 60 * 1000;

// ✂️ คำนวณจุด Cutoff เวลา (เริ่มต้นของวันย้อนหลังตาม DAYS_LOOKBACK)
const cutoffDate = new Date();
cutoffDate.setHours(0, 0, 0, 0); // ตั้งเวลารับเป็น 00:00:00 ของวันนี้
cutoffDate.setDate(cutoffDate.getDate() - DAYS_LOOKBACK);
const cutoffMs = cutoffDate.getTime();

for (const item of $input.all()) {
  const payload = item.json || {};
  const conversations = Array.isArray(payload.data)
    ? payload.data
    : (payload.id && payload.messages ? [payload] : (Array.isArray(payload) ? payload : []));

  for (const conv of conversations) {
    if (!conv?.id) continue;
    const participants = conv.participants?.data || conv.participants || [];
    
    let pageConfig = null;
    for (const p of participants) {
      if (PAGE_MAP.has(String(p.id))) {
        pageConfig = PAGE_MAP.get(String(p.id));
        break;
      }
    }
    if (!pageConfig) continue;

    const customerParticipant = participants.find(person => person?.id && String(person.id) !== String(pageConfig.page_id)) || {};
    const messages = Array.isArray(conv.messages?.data) ? conv.messages.data : (Array.isArray(conv.messages) ? conv.messages : []);

    // Find the latest actual customer message (exclude page replies and echoes).
    const customerMessages = messages
      .filter(message => {
        const senderId = String(message?.from?.id ?? '');
        return senderId !== String(pageConfig.page_id) && message?.is_echo !== true;
      })
      .map(message => ({ message, ms: Date.parse(message?.created_time || message?.time || '') }))
      .filter(entry => Number.isFinite(entry.ms))
      .sort((a, b) => b.ms - a.ms);
    const latestCustomerEntry = customerMessages[0] || null;
    const latestCustomerText = firstExisting(conv, ['customer_latest_message'])
      || firstExisting(payload, ['customer_latest_message'])
      || clean(latestCustomerEntry?.message?.message || latestCustomerEntry?.message?.text || '');
    const latestCustomerTime = firstExisting(conv, ['customer_message_time_th'])
      || firstExisting(payload, ['customer_message_time_th'])
      || (latestCustomerEntry ? formatThaiDateTime(latestCustomerEntry.ms).full : '');

    // TIME CONTRACT: ทุกข้อความในห้องใช้เวลาลูกค้าล่าสุดชุดเดียวกัน
    // ห้ามใช้เวลาแถวปัจจุบัน เพราะแถวปัจจุบันอาจเป็นข้อความของเพจ
    const customerMessageTimeMs = parseCustomerMessageTime(latestCustomerTime);
    const customerAgeHours = customerMessageTimeMs !== null
      && customerMessageTimeMs <= Date.now()
      ? Number(((Date.now() - customerMessageTimeMs) / HOUR_MS).toFixed(1))
      : null;
    const customerWithin24h = customerAgeHours !== null && customerAgeHours < 24;

    const latestPageEntry = messages
      .filter(message => {
        const senderId = String(message?.from?.id ?? '');
        return senderId === String(pageConfig.page_id) || message?.is_echo === true;
      })
      .map(message => ({ message, ms: Date.parse(message?.created_time || message?.time || '') }))
      .filter(entry => Number.isFinite(entry.ms))
      .sort((a, b) => b.ms - a.ms)[0] || null;
    const latestPageText = firstExisting(conv, ['page_latest_message'])
      || firstExisting(payload, ['page_latest_message'])
      || clean(latestPageEntry?.message?.message || latestPageEntry?.message?.text || '');

    const parcelStatusSource = { ...payload, ...conv };
    const parcelStatusEmoji = getParcelStatusEmoji({
      ...parcelStatusSource,
      customer_latest_message: latestCustomerText,
      customer_message_time_th: latestCustomerTime,
    });

    messages.forEach((message, index) => {
      if (message?.id && seen.has(message.id)) return;

      const msgIsoTime = message.created_time || message.time || new Date().toISOString();
      const msgMs = Date.parse(msgIsoTime);

      // ✂️ [CUTOFF CHECK] ถ้าข้อความเก่ากว่าเวลา Cutoff (ไม่ใช่ของวันนี้/ช่วงที่กำหนด) ให้ข้ามทันที!
      if (Number.isFinite(msgMs) && msgMs < cutoffMs) return;

      if (message?.id) seen.add(message.id);

      const senderId = String(message?.from?.id ?? '');
      const isPage = senderId === String(pageConfig.page_id) || message?.is_echo === true;
      const attach = getAttachments(message);
      const textRaw = clean(message?.message || message?.text);
      
      let finalText = textRaw;
      if (!finalText) {
        finalText = attach.type === 'sticker' ? '[สติกเกอร์]' : (attach.has ? '[รูปภาพ]' : '');
      }

      const recipientId = String(customerParticipant.id || message?.from?.id || 'NO_CUST');
      const recipientName = clean(customerParticipant.name) || clean(message?.from?.name) || 'ไม่ระบุชื่อ';

      const rawMsgId = message.message_id || message.id || `msg_test_${Date.now()}_${index}`;
      const dedupeKey = `${pageConfig.page_id}|${recipientId}|${rawMsgId}`;
      const conversationKey = `${pageConfig.page_id}|${recipientId}`;
      const chatLinkKey = `${pageConfig.page_id}:${conv.id}`;

      const timeThai = formatThaiDateTime(msgMs);

      // ใช้ค่าเดียวกับ customer_message_time_th ที่คำนวณจากห้องด้านบน
      // ไม่ใช้ msgMs ซึ่งอาจเป็นเวลาข้อความเพจของแถวปัจจุบัน
      const chatAgeHours = customerAgeHours;
      const is24hValid = customerWithin24h;
      
      const sendFacebookRoute = payload.send_facebook_route || (payload.is_already_sent ? "ALREADY_SENT_SAVE_ONLY" : "ALLOW_FB_SEND");

      output.push({
        json: {
          page_id: pageConfig.page_id,
          page_name: pageConfig.page_name,
          portal_key: pageConfig.page_index,
          assigned_agent: pageConfig.assigned_agent,
          assigned_hashtag: pageConfig.assigned_hashtag,
      
          threadId: String(conv.id),
          thread_id: String(conv.id),
          customer_id: recipientId,
          customer_name: recipientName,
          recipient_id: recipientId,
          recipient_name: recipientName,
          customer_latest_message: latestCustomerText,
          customer_message_time_th: latestCustomerTime,
          page_latest_message: latestPageText,
          page_message_time_th: latestPageEntry ? formatThaiDateTime(latestPageEntry.ms).full : '',
          
          message_id: rawMsgId,
          dedupe_key: dedupeKey,
          chat_link_key: chatLinkKey,
     
    
          speaker: isPage ? "page" : "customer",
          is_sent: isPage,
          
          time: new Date(msgMs).toISOString(),
          occurred_at: new Date(msgMs).toISOString(),
          time_th: timeThai.full,
          message_time_display: timeThai.display,

          has_attachment: attach.has,
          attachment_type: attach.type,
          attachment_url: attach.urls[0] || null,
          attachment_urls: attach.urls,
          attachments_raw: attach.raw,
          sticker_url: message.sticker?.image_data?.url || message.sticker_url || null,
          shares_link: message.shares?.data?.[0]?.link || null,

          send_facebook_route: sendFacebookRoute,
          is_24h_window_valid: is24hValid,
          is_within_24h: is24hValid,
          can_send_standard: is24hValid,
          customer_chat_age_hours: chatAgeHours,
          chat_age_hours: chatAgeHours,
          messaging_tag_required: is24hValid ? "NONE" : "POST_PURCHASE_UPDATE",
          
          message_text : finalText,
          parcel_status_emoji: parcelStatusEmoji,
          sync_status: "READY_TO_SAVE"
        }
      });
    });
  }
}

return output;
