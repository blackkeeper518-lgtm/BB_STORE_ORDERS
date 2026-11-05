// ======================================================= //
// 🛡️ THE GOD GATEKEEPER V7.8.3 (MASTERPIECE ART EDITION 🏎️)
// ======================================================= //
const items = $input.all();
const result = [];

const now = new Date();
const bkkTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
const nowBKK = new Date(bkkTimeStr);



const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const colorMap = {
  "Sunday": { color: "🔴 Red", emoji: "🌹" },
  "Monday": { color: "🟡 Yellow", emoji: "🌻" },
  "Tuesday": { color: "🌸 Pink", emoji: "🎀" },
  "Wednesday": { color: "🟢 Green", emoji: "🌿" },
  "Thursday": { color: "🟠 Orange", emoji: "🍊" },
  "Friday": { color: "🔵 Blue", emoji: "💎" },
  "Saturday": { color: "🟣 Purple", emoji: "🍇" }
};

const WHITE_ROUTE = "⚪White";
const GHOST_ROUTE = "👻Ghost_Black";

function formatDateStr(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseOrderDate(raw) {
  if (!raw) return null;
  raw = String(raw).trim();
  try {
    if (raw.includes('/')) {
      const datePart = raw.split(' ')[0];
      let [d, m, y] = datePart.split('/');
      let yearNum = Number(y);
      if (yearNum < 100) yearNum += 2500;
      const baseY = yearNum > 2500 ? yearNum - 543 : yearNum;
      return new Date(baseY, Number(m) - 1, Number(d));
    }
    if (raw.includes('-')) {
      const datePart = raw.split(' ')[0];
      let [y, m, d] = datePart.split('-');
      let yearNum = Number(y);
      if (yearNum < 100) yearNum += 2500;
      const baseY = yearNum > 2500 ? yearNum - 543 : yearNum;
      return new Date(baseY, Number(m) - 1, Number(d));
    }
    return new Date(raw);
  } catch { return null; }
}

function cleanOrderNumber(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/^[^a-zA-Z0-9]+_?/, '')
    .replace(/[^a-zA-Z0-9]+$/, '');
}

// ============================================================
// 💔💞 PAIR ROUTE — ฟิวด์กลางสำหรับ Switch แยกใบเดียว/มีคู่
// 1/2, 2/2, 1/3, 2/3, 3/3 ... = 💞 PAIRED
// ใบเดียวจริงเท่านั้น = 💔 SINGLE
// ============================================================
function applyPairRoute(row, position, total) {
  const pos = Number(position) || 1;
  const count = Number(total) || 1;
  const paired = count >= 2;

  row.pair_route = paired ? '💞PAIRED' : '💔SINGLE';
  row.pair_position = `${pos}/${count}`;
  row.pair_group_size = count;
  row.pair_is_paired = paired;
  return row;
}

// ============================================================
// 📦 PACKER PRODUCT CONTRACT — แสดงชื่อสินค้าและจำนวนจริงครั้งเดียว
// เช่น "MOND_GREEN | จำนวน 3 คอต x 1 คอต"
//      -> "MOND_GREEN x 3 คอต"
// ============================================================
function formatPackerProduct(rawProduct, fallbackQty) {
  let raw = text(rawProduct);
  if (!raw) return '';

  // ลบจำนวนท้ายที่ถูกเติมซ้ำจากโหนดก่อนหน้าออกก่อน
  raw = raw.replace(/\s*x\s*\d+\s*(?:คอต\.?|ซอง|แพ็ค|กล่อง|ชิ้น)\s*$/iu, '').trim();

  let qty = Number(fallbackQty) || 0;
  let unit = 'คอต';

  // รองรับทั้ง "| จำนวน 3 คอต" และ "จำนวน 3 คอต"
  const qtyMatch = raw.match(/(?:\|\s*)?(?:จำนวน\s*)?(\d+(?:\.\d+)?)\s*(คอต\.?|ซอง|แพ็ค|กล่อง|ชิ้น)\s*$/iu);
  if (qtyMatch) {
    qty = Number(qtyMatch[1]) || qty;
    unit = String(qtyMatch[2]).replace(/\.$/u, '');
    raw = raw.slice(0, qtyMatch.index).trim();
  }

  // ล้างตัวคั่นที่ค้างอยู่ท้ายชื่อสินค้า
  raw = raw.replace(/[|:：\-–—]\s*$/u, '').trim();
  if (!raw) return '';

  return qty > 0 ? `${raw} x ${qty} ${unit}` : raw;
}

// -------------------------------------------------------
// 🎯 คำนวณจุดตัดรอบธุรกิจบ่าย 2 (14:00 BKK Cutoff)
// -------------------------------------------------------
// 🎯 เสกคำนวณจุดตัดรอบ: ล็อคเป้าสี่ทุ่มตรงของเมื่อวาน (22:00 น. Yesterday)
const yesterdayCutoff = new Date(nowBKK);
yesterdayCutoff.setDate(yesterdayCutoff.getDate() - 2); // ถอยหลังกลับไปเมื่อวาน
yesterdayCutoff.setHours(13, 45, 0, 0);                 // ตั้งเวลาล็อกตายที่ 22:00 น. ตรงเป๊ะ

const calendarTodaySetting = colorMap[dayNames[nowBKK.getDay()]] || { color: WHITE_ROUTE, emoji: "⚪" };

// ============================================================
// ST — TRACKING REQUEST BINDING
// ผูกคำขอเลขจาก chat_timeline กับ order_time_display
// ไม่ใช้เวลาปัจจุบันของเครื่อง และไม่ค้นหาเบอร์
// ============================================================

function text(value) {
  return value == null ? '' : String(value).normalize('NFC').trim();
}

function bool(value) {
  return value === true || value === 1 || /^(true|1|yes)$/iu.test(text(value));
}

// ------------------------------------------------------------
// เวลา: รองรับ
// 19/10/69 11:08:06
// 19/10/2026 11:08:06
// 2026-10-19T04:08:06.000Z
// ------------------------------------------------------------
function parseOrderTimeDisplay(value) {
  const raw = text(value);
  if (!raw) return NaN;

  const thaiDisplay = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+|T)(\d{1,2})[:.](\d{2})(?::(\d{2}))?/u
  );

  if (thaiDisplay) {
    let year = Number(thaiDisplay[3]);
    if (year < 100) year += 1957; // พ.ศ. 69 -> ค.ศ. 2026
    if (year >= 2400) year -= 543; // พ.ศ. 2569 -> ค.ศ. 2026

    // เก็บเป็น UTC โดยแปลงเวลาไทย (+07:00) กลับเป็น UTC
    return Date.UTC(
      year,
      Number(thaiDisplay[2]) - 1,
      Number(thaiDisplay[1]),
      Number(thaiDisplay[4]) - 7,
      Number(thaiDisplay[5]),
      Number(thaiDisplay[6] || 0)
    );
  }

  const iso = Date.parse(raw);
  return Number.isFinite(iso) ? iso : NaN;
}

// ------------------------------------------------------------
// อ่าน chat_timeline ให้รองรับ Array และ JSON string
// ------------------------------------------------------------
function timelineArray(value) {
  if (Array.isArray(value)) {
    return value.map(text).filter(Boolean);
  }

  const raw = text(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(text).filter(Boolean);
    }
  } catch (_) {
    // ถ้าไม่ใช่ JSON ให้แยกตามบรรทัดแทน
  }

  return raw
    .split(/\r?\n+/u)
    .map(text)
    .filter(Boolean);
}

// รองรับรูปแบบ:
// [สําราญ ยิ้มแย้ม : 09/10/69 18:05:16] : ขอเลขพัสดุหน่อยครับ
// [ลูกค้า: 09/10/69 18:05:16] ขอเลขพัสดุหน่อยครับ
function parseTimelineLine(line) {
  const raw = text(line);
  if (!raw) return null;

  const match = raw.match(
    /^\[\s*(.*?)\s*:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s+\d{1,2}[:.]\d{2}(?::\d{2})?)\s*\]\s*:?[ \t]*(.*)$/u
  );

  if (!match) return null;

  const sender = text(match[1]);
  const timeDisplay = text(match[2]);
  const body = text(match[3]);
  const timestamp = parseOrderTimeDisplay(timeDisplay);

  return {
    sender,
    time_display: timeDisplay,
    timestamp,
    body,
    raw,
  };
}

// คำขอเลขจริงของลูกค้า ไม่รวมข้อความที่เป็นแค่เลข/การตอบจากร้าน
const TRACKING_REQUEST_RE = /(?:ขอ\s*(?:เลข|เลขพัสดุ|เลขติดตาม|เลขแทร็ก|เลข\s*tracking|เลข\s*AWB)|ขอ\s*(?:เช็ค|เช็ก)\s*เลข|รบกวนแจ้งเลขพัสดุ|ส่งเลขพัสดุให้หน่อย|มีเลขพัสดุไหม|เลขพัสดุออกหรือยัง|เช็คพัสดุ|เช็กพัสดุ|ติดตามพัสดุ|สถานะพัสดุ|tracking\s*(?:number|parcel)?|AWB)/iu;

const BOT_OR_STORE_SENDER_RE = /(?:ร้าน|สโตร์|store|เพจ|bot|ระบบ|แอดมิน|bb\s*store|bbεїз|เบอร์หนึ่งสโตร์|เจ๊บี|ลุงสิงโต)/iu;

function isCustomerTrackingRequest(event) {
  if (!event || !event.body) return false;
  // ถ้าชื่อผู้ส่งชัดว่าเป็นร้าน/บอท ไม่ถือเป็นคำขอจากลูกค้า
  if (BOT_OR_STORE_SENDER_RE.test(event.sender)) return false;
  return TRACKING_REQUEST_RE.test(event.body);
}

// ------------------------------------------------------------
// ฟังก์ชันหลักที่ผู้ใช้ขอ
// requestTimeDisplay ต้องอยู่หลังเวลาออเดอร์และไม่เกิน maxDays
// และต้องอยู่ภายใน maxDays วันก่อนออเดอร์
// ------------------------------------------------------------
function trackingRequestIsRelevant(
  orderTimeDisplay,
  requestTimeDisplay,
  maxDays = 2
) {
  const orderMs = parseOrderTimeDisplay(orderTimeDisplay);
  const requestMs = parseOrderTimeDisplay(requestTimeDisplay);

  if (!Number.isFinite(orderMs) || !Number.isFinite(requestMs)) {
    return false;
  }

  const diffMs = requestMs - orderMs;
  const maxMs = Number(maxDays) * 24 * 60 * 60 * 1000;

  if (!Number.isFinite(maxMs) || maxMs < 0) return false;

  // คำขอเลขหลังเวลาออเดอร์ภายใน maxDays จึงผูกกับออเดอร์นี้
  return diffMs >= 0 && diffMs <= maxMs;
}

// ------------------------------------------------------------
// ผูก chat_timeline กับ order_time_display
// ------------------------------------------------------------
function bindTrackingRequestToOrder(row, options = {}) {
  const maxDays = Number.isFinite(Number(options.maxDays))
    ? Number(options.maxDays)
    : 2;

  const orderTimeDisplay = text(row?.order_time_display);
  const timeline = timelineArray(row?.chat_timeline);
  const events = timeline.map(parseTimelineLine).filter(Boolean);

  const relevantRequests = events
    .filter(isCustomerTrackingRequest)
    .filter(event => trackingRequestIsRelevant(
      orderTimeDisplay,
      event.time_display,
      maxDays
    ))
    .sort((a, b) => a.timestamp - b.timestamp);

  const latestRequest = relevantRequests.length
    ? relevantRequests[relevantRequests.length - 1]
    : null;

  // มีคำขอเลขจริงและอยู่ในช่วงก่อนออเดอร์ไม่เกิน maxDays
  const relevant = Boolean(latestRequest);

  return {
    detected: events.some(isCustomerTrackingRequest),
    relevant,
    countRelevant: relevantRequests.length,
    latestRequest: latestRequest
      ? {
          timeDisplay: latestRequest.time_display || '',
          sender: latestRequest.sender || '',
          text: latestRequest.body || '',
        }
      : null,
  };
}

// ------------------------------------------------------------
// วิธีใช้ใน n8n Code node
// ------------------------------------------------------------
// const items = $input.all();
// return items.map(item => {
//   const d = item.json || {};
//   const tracking = bindTrackingRequestToOrder(d, { maxDays: 2 });
//   return { json: { ...d, ...tracking } };
// });

// ถ้าต้องการขยายเป็น 3 วัน เปลี่ยนเฉพาะตรงนี้:
// bindTrackingRequestToOrder(d, { maxDays: 3 });

// ตัวอย่างผล:
// order_time_display = 18/10/69 08:27:39
// คำขอเลข = 09/10/69 18:05:16
// tracking_request_detected = true
// tracking_request_relevant = false
//
// order_time_display = 18/10/69 08:27:39
// คำขอเลข = 17/10/69 18:05:16
// tracking_request_detected = true
// tracking_request_relevant = true

for (const item of items) {
  const d = item.json || item;

  // 1. EXTRACT TEXT & PRICE
  let SNIPER_X_TEXT = d.message || (d.data && d.data.text) || d.SNIPER_X_TEXT || "";
  SNIPER_X_TEXT = String(SNIPER_X_TEXT).replace(/\\n/g, '\n').replace(/\\\s*n/gi, '\n');

  const nodePrice = parseFloat(d.cod_amount || d.total_price || d.amount || d.price || d.cod_value) || 0;
  let extractedPrice = 0;
  const priceMatch = SNIPER_X_TEXT.match(/(?:ยอดรวม|สรุปยอด|รวม|เก็บเงิน|COD|ยอด)\s*[:=]?\s*([0-9,.]+)/i) || SNIPER_X_TEXT.match(/([0-9,.]+)\s*(?:บาท|฿)/i);
  if (priceMatch) extractedPrice = parseFloat(priceMatch[1].replace(/,/g, '')) || 0;
  d.extracted_text_price = extractedPrice;

  // 2. EXTRACT QTY
  const nodeQty = parseInt(d.total_quantity || d.qty, 10) || 0;
  let extractedQty = 0;
  const qtyMatch = SNIPER_X_TEXT.match(/([0-9]+)\s*(?:คอต|ซอง|แพ็ค|กล่อง|ชิ้น)/i);
  if (qtyMatch) extractedQty = parseInt(qtyMatch[1], 10) || 0;
  d.extracted_text_qty = extractedQty;
  d.final_order_qty = nodeQty > 0 ? nodeQty : (extractedQty > 0 ? extractedQty : 1);

  // 3. FIBONACCI SCORING ENGINE
  let fiboScore = 0;
  const effectivePrice = nodePrice > 0 ? nodePrice : extractedPrice;
  if (effectivePrice >= 2000) fiboScore += 55;
  else if (effectivePrice >= 1000) fiboScore += 34;
  else if (effectivePrice >= 800) fiboScore += 21;
  else if (effectivePrice >= 400) fiboScore += 13;
  else if (effectivePrice > 200) fiboScore += 8;

  if (d.final_order_qty >= 10) fiboScore += 34;
  else if (d.final_order_qty >= 5) fiboScore += 21;
  else if (d.final_order_qty >= 2) fiboScore += 8;
  else fiboScore += 2;

  if (d.order_number || d.id) fiboScore += 3;
  if (d.customer_name || d.name || d.phone) fiboScore += 3;
  if (SNIPER_X_TEXT.includes("")) fiboScore += 5;
  if (SNIPER_X_TEXT.toLowerCase().includes("cod") || d.is_cod) fiboScore += 3;
  if (SNIPER_X_TEXT.includes("สรุปยอด") || SNIPER_X_TEXT.includes("ปิดยอดสำเร็จ")) fiboScore += 5;

  let isSaltyGold = false;
  if (effectivePrice >= 1500 && SNIPER_X_TEXT.trim().length < 15) { fiboScore += 21; d.is_silent_whale = true; }
  if (d.final_order_qty === 1 && effectivePrice >= 1000) { fiboScore += 13; isSaltyGold = true; }
  d.is_salty_gold = isSaltyGold;

  let fiboTier = "💲 21_GOLDEN_FLOOR"; 
  let mathematicallyPrice = 200;
  if (fiboScore >= 89) { fiboTier = "👑 144_ULTIMATE_VIP"; mathematicallyPrice = 2000; }
  else if (fiboScore >= 55) { fiboTier = "🌟 89_GOLDEN_TOP"; mathematicallyPrice = 1000; }
  else if (fiboScore >= 34) { fiboTier = "🏆 55_GOLDEN_RATIO"; mathematicallyPrice = 700; }
  else if (fiboScore >= 21) { fiboTier = "💵 34_GOLDEN_MEDIUM"; mathematicallyPrice = 400; }
  
  d.fibo_score = fiboScore; 
  d.fibo_tier = fiboTier; 
  d.fibo_badge = `🔥 FIBO-${fiboScore} [${fiboTier}]`;
  d.mathematically_price = mathematicallyPrice;
  d.final_order_price = nodePrice > 0 ? nodePrice : (extractedPrice > 0 ? extractedPrice : mathematicallyPrice);

  // 4. VIP TAGGING
  let vipTag = "🔰 BRONZE_FOOT_SOLDIER"; 
  let isVIP = false;
  if (fiboScore >= 89) { vipTag = "👑 ULTIMATE_VIP_EXPRESS"; isVIP = true; }
  else if (fiboScore >= 55) { vipTag = "🌟 GOLDEN_TOP_EXPRESS"; isVIP = true; }
  else if (fiboScore >= 34) { vipTag = "🏆 GOLDEN_RATIO_COMMANDER"; isVIP = true; }
  else if (fiboScore >= 21) { vipTag = "💵 MEDIUM_SOLDIER"; }
  if (isSaltyGold) vipTag = `🧈_GOLDEN_TURBO [${vipTag}]`;
  d.is_vip = isVIP; 
  d.vip_tag = vipTag;

  // 5. ORDER TIME PARSING
  // TIME CONTRACT: ใช้เวลาเดียวจาก order_time_display เท่านั้น
  const rawTime = text(d.order_time_display);
  // ไม่มี fallback ไปเวลาปัจจุบัน: เวลาไม่พบต้องถูกมองว่าไม่มีเวลา
  const orderDate = parseOrderDate(rawTime);
  const targetDateObj = orderDate || new Date(0);

  // ============================================================
  // 🕒 ORDER TIME CONTRACT — เวลาออเดอร์กลางของทั้งทีม
  // ยึด order_time_display ก่อนเสมอ ไม่ใช้เวลาที่โหนดกำลังรัน
  // ============================================================
  const orderTimeSource = rawTime
    ? 'order_time_display'
    : 'MISSING_ORDER_TIME_DISPLAY';
  const orderTimeMs = parseOrderTimeDisplay(rawTime);
  const orderTimeBkk = Number.isFinite(orderTimeMs)
    ? new Date(orderTimeMs + 7 * 60 * 60 * 1000)
    : null;
  const orderTimeThaiDate = orderTimeBkk
    ? `${String(orderTimeBkk.getUTCDate()).padStart(2, '0')}/${String(orderTimeBkk.getUTCMonth() + 1).padStart(2, '0')}/${orderTimeBkk.getUTCFullYear() + 543}`
    : '';
  const orderTimeThaiClock = orderTimeBkk
    ? `${String(orderTimeBkk.getUTCHours()).padStart(2, '0')}:${String(orderTimeBkk.getUTCMinutes()).padStart(2, '0')}:${String(orderTimeBkk.getUTCSeconds()).padStart(2, '0')}`
    : '';

  d.order_time_source = orderTimeSource;
  d.order_time_ms_reference = Number.isFinite(orderTimeMs) ? orderTimeMs : null;
  d.order_time_bkk_iso = orderTimeBkk ? orderTimeBkk.toISOString() : '';
  d.order_time_thai_date = orderTimeThaiDate;
  d.order_time_thai_clock = orderTimeThaiClock;
  d.order_time_thai_label = orderTimeThaiDate && orderTimeThaiClock
    ? `⏰ ${orderTimeThaiDate} ${orderTimeThaiClock} น.`
    : '⏰ ไม่พบเวลาออเดอร์';
  d.order_time_contract_locked = true;


  let cleanHour = nowBKK.getHours(); 
  let cleanMin = targetDateObj.getMinutes();
  const rawDisplay = String(d.order_time_display || d.time_th || "").trim();
  const matchTime = rawDisplay.match(/(?:^|\s)(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (matchTime) { cleanHour = parseInt(matchTime[1], 10); cleanMin = parseInt(matchTime[2], 10); }
  d.order_hour = cleanHour;

  const orderExactDate = new Date(targetDateObj); 
  orderExactDate.setHours(cleanHour, cleanMin, 0, 0);

  // 6. ROUTING LOGIC (ตัดรอบบ่าย 2 แน่นอน คลีน ไร้หนอนเหลือง)
  const routingOrderTimeMs = orderExactDate.getTime();
  const hoursPastCutoff = (yesterdayCutoff.getTime() - routingOrderTimeMs) / (1000 * 3600);
  const isCurrentBusinessOrder = routingOrderTimeMs >= yesterdayCutoff.getTime();

  const orderCalendarDate = new Date(targetDateObj);
  const orderDayName = dayNames[orderCalendarDate.getDay()];
  const settingByOrderDay = colorMap[orderDayName] || calendarTodaySetting;

  if (isCurrentBusinessOrder) {
    // ⚪ ออเดอร์สดใหม่ (สั่งหลัง 14:00 น. เมื่อวานเป็นต้นมา)
    d.routing_tag = settingByOrderDay.color;     
    d.status_color = settingByOrderDay.color; 

    d.status_color_backup = WHITE_ROUTE;         
    d.routing_tag_backup = WHITE_ROUTE;          

    d.target_room = 'WHITE_ROOM';
    d.is_safety_white = true;
    d.order_emoji = settingByOrderDay.emoji;

    d.life_status = '🏁 NITRO_READY';
    d.ghost_column = null;

  } else {
    // 👻 ออเดอร์ตกค้าง/หลุดรอบส่งบ่าย 2 เมื่อวาน
    d.routing_tag = settingByOrderDay.color;
    d.status_color = settingByOrderDay.color;

    d.status_color_backup = GHOST_ROUTE;         
    d.routing_tag_backup = GHOST_ROUTE;          

    d.target_room = 'COLOR_ROOM';
    d.is_safety_white = false;

    if (hoursPastCutoff <= 12) {
      d.order_emoji = settingByOrderDay.emoji;
      d.life_status = '🕯️ MISSED_CUTOFF';
      d.ghost_column = '🕯️ หลุดรอบบ่าย 2 เมื่อวาน';
    } else if (hoursPastCutoff <= 24) {
      d.order_emoji = '🧂';
      d.life_status = '🧂 SALT_PITSTOP';
      d.ghost_column = '🧂 กั้นพิทสต็อปขี้เกลือ เกินรอบบ่ายสองมาแล้ว';
    } else {
      d.order_emoji = '💀';
      d.life_status = '💀 WASTELAND_GHOST';
      d.ghost_column = '💀 เกิน 48 ชั่วโมงแล้ว รถคว่ำกลายเป็นผีเฝ้าถนนนะจาร์ย';
    }
  }
// ====================================================================
  // Node 2 does not assign bill completeness colors or SEND/DO_NOT_SEND.
// Keep source completeness flags untouched for the downstream bill/audit nodes.

  // 7. ORDER NUMBER CLEAN & DISPLAY
  if (d.order_number) {
    const cleanNo = cleanOrderNumber(d.order_number);
    d.order_number = cleanNo; // คีย์หลักคลีนๆ เอาไว้ลง DB/Search

    const dayEmoji = settingByOrderDay.emoji;
    const prefixEmoji = isVIP ? `👑_${dayEmoji}` : dayEmoji;

    let suffixEmoji = '';
    if (!isCurrentBusinessOrder) {
      if (hoursPastCutoff > 24) suffixEmoji = '💀';
      else suffixEmoji = '🧂';
    }

    d.order_number_display = `${prefixEmoji}_${cleanNo}${suffixEmoji}`;
  } else {
    d.order_number_display = "";
  }

  // 8. TIME SLOT & DISPATCH TARGET
  const padH = String(cleanHour).padStart(2, '0');
  const padM = String(cleanMin).padStart(2, '0');
  const timeFormatted = `${padH}:${padM}`;
  const timeKeyFormatted = `${padH}${padM}`;

  const dispatchDate = new Date(orderExactDate);
  if (cleanHour >= 14) dispatchDate.setDate(dispatchDate.getDate() + 1);

  const todayFormatted = formatDateStr(targetDateObj);
  const dispatchFormatted = formatDateStr(dispatchDate);

  if (cleanHour >= 22 || cleanHour < 6) {
    d.time_slot = "EVENING_SLOT";
    d.dispatch_target_date = dispatchFormatted;
    d.time_slot_label = `🌃 ออเดอร์หลัง 4 ทุ่ม [สั่ง:${todayFormatted} ${timeFormatted} น. ➡ ของวันที่หมดแล้ว รวบส่ง:${dispatchFormatted}]`;
    d.slot_two_layer_key = `EVENING_${todayFormatted}@${timeKeyFormatted}_SHIP_${dispatchFormatted}`;
  } else if (cleanHour >= 6 && cleanHour < 11) {
    d.time_slot = "MORNING_SLOT";
    d.dispatch_target_date = todayFormatted;
    d.time_slot_label = `🌅 ออเดอร์รอบเช้า [สั่ง:${todayFormatted} ${timeFormatted} น. ➡ รอบส่งวันนี้:${todayFormatted}]`;
    d.slot_two_layer_key = `MORNING_${todayFormatted}@${timeKeyFormatted}_SHIP_${todayFormatted}`;
  } else if (cleanHour >= 11 && cleanHour < 14) {
    d.time_slot = "NOON_SLOT";
    d.dispatch_target_date = todayFormatted;
    d.time_slot_label = `☀ ออเดอร์รอบเที่ยง [สั่ง:${todayFormatted} ${timeFormatted} น. ➡ ตัดรอบส่งวันนี้:${todayFormatted}]`;
    d.slot_two_layer_key = `NOON_${todayFormatted}@${timeKeyFormatted}_SHIP_${todayFormatted}`;
  } else if (cleanHour >= 14 && cleanHour < 19) {
    d.time_slot = "AFTERNOON_SLOT";
    d.dispatch_target_date = dispatchFormatted;
    d.time_slot_label = `🌤 ออเดอร์รอบบ่าย [สั่ง:${todayFormatted} ${timeFormatted} น. ➡ ตัดรอบส่ง:${dispatchFormatted}]`;
    d.slot_two_layer_key = `AFTERNOON_${todayFormatted}@${timeKeyFormatted}_SHIP_${dispatchFormatted}`;
  } else {
    d.time_slot = "EVENING_SLOT";
    d.dispatch_target_date = dispatchFormatted;
    d.time_slot_label = `🌆 ออเดอร์รอบเย็น [สั่ง:${todayFormatted} ${timeFormatted} น. ➡ รวบส่ง:${dispatchFormatted}]`;
    d.slot_two_layer_key = `EVENING_${todayFormatted}@${timeKeyFormatted}_SHIP_${dispatchFormatted}`;
  }


if (d.hasOwnProperty('routing_flag')) delete d.routing_flag;
result.push({ json: d });
}
// ============================================================
// THE GOD GATEKEEPER - CUTOFF, GROUP COUNT & GHOST/TRACKING SIGNALS
// คงการคำนวณรอบ/เวลาและจำนวนคู่; สีบิลสุดท้ายให้โหนดถัดไปตัดสิน
// ============================================================
const ORDER_CYCLE_MAX_GAP_MS = 5 * 60 * 1000;

function gateText(v) {
  return String(v ?? "").normalize("NFC").trim();
}

function gateTimeMs(row) {
  // ห้ามใช้เวลารันโหนดหรือ order_time สำรองในการจัดกลุ่ม
  const t = parseOrderTimeDisplay(row.order_time_display);
  return Number.isFinite(t) ? t : 0;
}

function gateDateKey(row) {
  const t = gateTimeMs(row);
  if (!t) return gateText(row.order_date);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t));
}

function gateCustomerKey(row) {
  return gateText(row.customer_id) || `PHONE:${gateText(row.phone || row.extracted_phone)}`;
}

function gateGroupKey(row) {
  // t_id/threadId คือกลุ่มจริง ให้เป็นคีย์หลักและห้ามแยกด้วยเวลา 5 นาที
  const thread = gateText(row.t_id || row.threadId || row.thread_id || row.conversation_id);
  if (thread) return `THREAD:${thread}`;

  return [gateCustomerKey(row), gateDateKey(row)].join("|");
}

function comparePackerObj(previous, current) {
  if (!previous) {
    return {
      status: "NEW_ORDER",
      changed_fields: [],
      change_note_th: "🆕 ออเดอร์ใหม่",
    };
  }

  const changed = [];
  const oldProduct = gateText(previous.manus_for_packer || previous.for_packer_st_display || previous.packer_tag_display);
  const newProduct = gateText(current.manus_for_packer || current.for_packer_st_display || current.packer_tag_display);
  const oldQty = Number(previous.final_order_qty ?? previous.extracted_text_qty ?? 0);
  const newQty = Number(current.final_order_qty ?? current.extracted_text_qty ?? 0);
  const oldCod = Number(previous.cod_value ?? previous.cod_amount ?? 0);
  const newCod = Number(current.cod_value ?? current.cod_amount ?? 0);
  const oldPhone = gateText(previous.phone_number || previous.phone || previous.extracted_phone);
  const newPhone = gateText(current.phone_number || current.phone || current.extracted_phone);
  const oldAddress = gateText(previous.address || previous.address_display_packer || previous.addressclean);
  const newAddress = gateText(current.address || current.address_display_packer || current.addressclean);
  const oldCustomer = gateText(previous.customer || previous.customer_name);
  const newCustomer = gateText(current.customer || current.customer_name);

  if (oldProduct !== newProduct) changed.push("PRODUCT");
  if (oldQty !== newQty) changed.push("QTY");
  if (oldCod !== newCod) changed.push("COD");
  if (oldPhone !== newPhone) changed.push("PHONE");
  if (oldAddress !== newAddress) changed.push("ADDRESS");
  if (oldCustomer !== newCustomer) changed.push("CUSTOMER");

  return {
    status: changed.length ? "ORDER_UPDATED" : "NO_CHANGE",
    changed_fields: changed,
    change_note_th: changed.length ? `🟨 เปลี่ยน: ${changed.join(", ")}` : "⚪ ไม่มีการเปลี่ยนแปลง",
  };
}

const gateRows = result.map((item, index) => ({
  item,
  row: item.json || {},
  index,
  timeMs: gateTimeMs(item.json || {}),
}));

const gateGroups = new Map();
for (const entry of gateRows) {
  const key = gateGroupKey(entry.row);
  if (!gateGroups.has(key)) gateGroups.set(key, []);
  gateGroups.get(key).push(entry);
}

const clusters = [];
for (const entries of gateGroups.values()) {
  entries.sort((a, b) => a.timeMs - b.timeMs || a.index - b.index);

  // ถ้ามี t_id/threadId ให้ทั้งกลุ่มเป็นกลุ่มเดียวเสมอ
  if (gateText(entries[0]?.row?.t_id || entries[0]?.row?.threadId || entries[0]?.row?.thread_id || entries[0]?.row?.conversation_id)) {
    clusters.push(entries);
    continue;
  }

  let cluster = [];
  let previousTime = null;

  for (const entry of entries) {
    const gap = previousTime == null ? 0 : entry.timeMs - previousTime;
    if (cluster.length && gap > ORDER_CYCLE_MAX_GAP_MS) {
      clusters.push(cluster);
      cluster = [];
    }
    cluster.push(entry);
    previousTime = entry.timeMs;
  }
  if (cluster.length) clusters.push(cluster);
}
for (const cluster of clusters) {
  cluster.sort((a, b) => a.timeMs - b.timeMs || a.index - b.index);
  const total = cluster.length;
  const latest = cluster[cluster.length - 1];

  const clusterHasChange = cluster.some((entry, idx) => {
    if (idx === 0) return false;
    const previous = cluster[idx - 1].row || {};
    const current = entry.row || {};
    return comparePackerObj(previous.packer_obj, current.packer_obj || {}).status === "ORDER_UPDATED";
  });

  for (let pos = 0; pos < cluster.length; pos++) {
    const entry = cluster[pos];
    const row = entry.row;
    const isLatest = entry === latest;
    const previousRow = pos > 0 ? cluster[pos - 1].row : null;
    const audit = total >= 2
      ? comparePackerObj(previousRow?.packer_obj, row.packer_obj || {})
      : comparePackerObj(null, row.packer_obj || {});

    // ====================================================================
    // 🛑 1. ด่านตรวจเช็กบิลไม่ครบ (Absolute Guard: ถ้าพัง ตัดจบลงดำทันทีห้ามเลี้ยวซ้ายขวา)
    // ====================================================================
    const isDataIncomplete = row.darksideBillDataComplete === false || row.bill_data_complete === false || row.source_gate_color === '⚫' || row.source_gate_status === 'BLACK_REVIEW';

    if (isDataIncomplete) {
      row.currentThreadTotalBills = total;
      row.cluster_bill_count = total;
      row.cluster_position = pos + 1;
      row.is_latest_canonical = isLatest;
      row.canonical_status = isLatest ? 'LATEST_CANONICAL' : 'HISTORY_DUPLICATE_RECAP';
      row.change_status = audit.status;
      row.changed_fields = audit.changed_fields;
      row.change_note_th = audit.change_note_th;
      row.cluster_has_change = clusterHasChange;
      const incompleteOrderTime = gateText(row.order_time_display || row.time_th || row.order_time || row.order_date);
      row.duplicate_count_th = isLatest
        ? `🆕 ใบล่าสุด · ${pos + 1}/${total} · ${incompleteOrderTime || 'เวลาไม่พบ'}`
        : `🗂️ ใบก่อนหน้า · ${pos + 1}/${total} · ${incompleteOrderTime || 'เวลาไม่พบ'}`;
      applyPairRoute(row, pos + 1, total);
      row.node2_bill_color_decision = 'DEFER_TO_DOWNSTREAM';
      continue;
    }

    // ====================================================================
    // 🔀 2. ลอจิกปกติสำหรับบิลข้อมูลครบ (ถัดจากนี้ค่อยรันเรื่องเวลา/ห้องขาว/ห้องผีเสื้อ)
    // ====================================================================
    row.currentThreadTotalBills = total;
    row.cluster_bill_count = total;
    row.cluster_position = pos + 1;
    row.is_latest_canonical = isLatest;
    row.canonical_status = isLatest ? "LATEST_CANONICAL" : "HISTORY_DUPLICATE_RECAP";
    row.change_status = audit.status;
    row.changed_fields = audit.changed_fields;
    row.change_note_th = audit.change_note_th;
    row.cluster_has_change = clusterHasChange;
    const duplicateOrderTime = gateText(
      row.order_time_display || row.time_th || row.order_time || row.order_date
    );
    row.duplicate_count_th = isLatest
      ? `🆕 ใบล่าสุด · ${pos + 1}/${total} · ${duplicateOrderTime || 'เวลาไม่พบ'}`
      : `🗂️ ใบก่อนหน้า · ${pos + 1}/${total} · ${duplicateOrderTime || 'เวลาไม่พบ'}`;
    applyPairRoute(row, pos + 1, total);

    // Keep pair count, latest marker and difference evidence. Final colors belong downstream.
    row.node2_group_is_latest = isLatest;
    row.node2_group_has_change = clusterHasChange;
    row.node2_bill_color_decision = 'DEFER_TO_DOWNSTREAM';

    const rowTrackingRequested =
      row.tracking_request_48h === true || row.tracking_request_48h === 'true' ||
      row.tracking_request_same_thai_date === true || row.tracking_request_same_thai_date === 'true';
    const routeBeforeTracking = String(row.bb_express_send_route || '').trim();
    const protectDownstreamColor = ['⚫', '🟨', '🟠'].includes(routeBeforeTracking);
    if (rowTrackingRequested && !isDataIncomplete && !protectDownstreamColor) {
      row.bb_express_send_route = '🔴';
      row.route_reason_emoji = '🔴';
      row.node2_route_signal = 'TRACKING_REQUEST';
    }

  }
}

for (const item of result) {
  const row = item.json || {};
  const isDataIncomplete = row.darksideBillDataComplete === false
    || row.bill_data_complete === false
    || row.source_gate_color === '⚫'
    || row.source_gate_status === 'BLACK_REVIEW';
  const ghostFromGatekeeper =
    row.routing_tag_backup === '👻Ghost_Black' ||
    row.status_color_backup === '👻Ghost_Black';
  const routeBeforeGhost = String(row.bb_express_send_route || '').trim();
  const preserveExistingNonNode2Color = ['⚫', '🟨', '🟠'].includes(routeBeforeGhost);

  if (ghostFromGatekeeper && !isDataIncomplete && !preserveExistingNonNode2Color) {
    row.bb_express_send_route = '👻';
    row.route_reason_emoji = '👻Ghost_Black';
    row.route_reason_color = 'GHOST_BLACK';
    row.route_reason_label = row.ghost_column || '👻 Ghost_Black — ออเดอร์เก่า/หลุดรอบ';
    row.dispatchDestination = 'HERMES_ARCHIVE';
    row.target_room = 'HERMES_ARCHIVE';
    row.node2_route_signal = 'GHOST_OLD_ORDER';
    row.node2_ghost_old_order = true;
    row.ghost_reflected_to_bb = true;
    row.ghost_reflection_source = row.routing_tag_backup === '👻Ghost_Black'
      ? 'routing_tag_backup'
      : 'status_color_backup';
  } else {
    row.ghost_reflected_to_bb = false;
    row.ghost_reflection_source = '';
    row.node2_ghost_old_order = Boolean(ghostFromGatekeeper);
    if (routeBeforeGhost === '🔴' || row.tracking_request_48h === true || row.tracking_request_same_thai_date === true) {
      row.node2_route_signal = 'TRACKING_REQUEST';
    } else if (!isDataIncomplete) {
      row.node2_route_signal = 'PASS_THROUGH';
    }
  }
  row.node2_route_signal_only_for_ghost_red = true;
}

return result;
