// ============================================================
// 🟥 TRACKING_REQUEST_ROUTE_NODE3_V2
// หน้าที่ของโหนดนี้:
// 1) แยกคำขอเลขของลูกค้าออกจากคำขอเก่าข้ามออเดอร์
// 2) แยกเส้นทาง 🟥 ภายใน 48 ชั่วโมง / 🔴 เกิน 48 ชั่วโมง
// 3) ตรวจข้อความที่เคยแจ้งเลขแล้วจากทั้ง page และ tracking message fields
// 4) ไม่ตัดวันเก่าของรอบส่ง และไม่ทำหน้าที่แยกใบคู่/ใบเดียว
//    (ให้โหนด 2 ทำหน้าที่นั้นเหมือนเดิม)
// ============================================================

function clean(value) {
  return String(value ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/gu, '')
    .replace(/\\n/gu, '\n')
    .trim();
}

function parseThaiDate(value) {
  const raw = clean(value);
  const match = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+|T)(\d{1,2})[:.](\d{2})(?::(\d{2}))?/u);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2500;
  if (year >= 2400) year -= 543;
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  const ms = Date.UTC(year, month - 1, day, hour - 7, minute, second);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

function parseAnyDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const raw = clean(value);
  const iso = new Date(raw);
  if (Number.isFinite(iso.getTime()) && /\d{4}-\d{2}-\d{2}/u.test(raw)) return iso;
  return parseThaiDate(raw);
}

function asTimeline(row) {
  const values = [row.chat_timeline, row.chatTimeline, row.timeline]
    .filter(value => value !== undefined && value !== null);
  if (!values.length) return [];
  const value = values[0];
  return Array.isArray(value) ? value.map(clean).filter(Boolean) : clean(value).split(/\n(?=\[)/u).map(clean).filter(Boolean);
}

function latestFields(row) {
  return [
    { side: 'customer', text: clean(row.customer_latest_message || row.latest_customer_message || row.customer_message), time: clean(row.customer_message_time_th || row.latest_customer_message_time_th || row.customer_message_time) },
    { side: 'page', text: clean(row.page_latest_message || row.latest_page_message || row.page_message), time: clean(row.page_message_time_th || row.latest_page_message_time_th || row.page_message_time) },
  ].filter(entry => entry.text);
}

function isTrackingRequest(text) {
  return /(?:ขอ\s*(?:เลข|เลขพัสดุ|เลขติดตาม|เลขแทร็ก|เลข\s*tracking|เลข\s*AWB)|ขอ\s*(?:เช็ค|เช็ก)\s*เลข|รบกวนแจ้งเลขพัสดุ|ส่งเลขพัสดุให้หน่อย|มีเลขพัสดุไหม|เลขพัสดุออกหรือยัง|เช็คพัสดุ|เช็กพัสดุ|ติดตามพัสดุ|tracking\s*(?:number|no)?|AWB|ของส่งยัง|ส่งยัง|ได้เลขยัง|ดูไม่ได้)/iu.test(clean(text));
}

function isPageLine(line, row) {
  const text = clean(line);
  const pageId = clean(row.page_id);
  const senderName = clean(row.page_name || row.facebook_page_name);
  const match = text.match(/^\[([^\]]+)\]/u);
  if (match && senderName && match[1].includes(senderName)) return true;
  if (/📌\s*แจ้ง\s*เลข\s*พัสดุ\s*จัดส่ง/iu.test(text)) return true;
  return false;
}

function findCustomerRequests(row) {
  const orderTime = parseAnyDate(row.order_time_display || row.order_time || row.order_time_thai_label || row['⏰ เวลาสั่งซื้อ']);
  const customerName = clean(row.facebook_name || row.customer_name || row.latest_sender_name);
  const candidates = [];

  // ใช้ timeline เมื่อมี เพราะมีผู้ส่งและเวลาในบรรทัดเดียวกัน
  for (const line of asTimeline(row)) {
    const match = line.match(/(?:^|\[)([^\]:]+)(?:\]|:)\s*(?:[^:]*?\s*:\s*)?(.*)$/u);
    const body = clean(match ? match[2] : line);
    const dateMatch = line.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)/u);
    const time = dateMatch ? parseThaiDate(dateMatch[1]) : null;
    const sender = clean(match?.[1]);
    const likelyCustomer = !isPageLine(line, row) && (!sender || !customerName || sender.includes(customerName) || clean(row.customer_id));
    if (likelyCustomer && isTrackingRequest(body) && time) {
      candidates.push({ text: body, time, source: 'chat_timeline' });
    }
  }

  // ถ้าไม่มี timeline ให้ใช้ฟิวล่าสุดที่โหนดก่อนหน้าเตรียมไว้
  if (!candidates.length) {
    for (const entry of latestFields(row)) {
      if (entry.side !== 'customer' || !isTrackingRequest(entry.text)) continue;
      const time = parseAnyDate(entry.time);
      if (time) candidates.push({ text: entry.text, time, source: 'customer_latest_message' });
    }
  }

  return { orderTime, candidates: candidates.filter(entry => !orderTime || entry.time.getTime() >= orderTime.getTime()).sort((a, b) => a.time - b.time) };
}

function collectTrackingEvidence(row) {
  const fields = [
    'facebook_tracking_message',
    'drakside_tracking_message',
    'telegram_tracking_message',
    'tracking_message',
    'tracking_message_text',
    'facebook_tracking_message_web',
    'drakside_tracking_message_web',
    'page_latest_message',
  ];
  const evidence = [];
  for (const field of fields) {
    const text = clean(row[field]);
    if (!text) continue;
    const marker = /📌\s*แจ้ง\s*เลข\s*พัสดุ\s*จัดส่ง/iu.test(text);
    const numbers = [...new Set((text.match(/\b[A-Z]{1,5}\d{6,}[A-Z0-9-]*\b/giu) || []).map(value => value.toUpperCase()))];
    if (marker || numbers.length) evidence.push({ field, marker, numbers, text });
  }
  return evidence;
}

function firstExisting(row, keys) {
  for (const key of keys) {
    const value = clean(row[key]);
    if (value) return value;
  }
  return '';
}

return items.map(item => {
  const row = item.json || {};
  const originalRoute = row.bb_express_send_route;
  const originalBackup = row.status_color_backup || row.routing_tag_backup || '⚪White';
  const request = findCustomerRequests(row);
  const evidence = collectTrackingEvidence(row);
  const latestCustomer = firstExisting(row, ['customer_latest_message', 'latest_customer_message', 'customer_message']);
  const latestPage = firstExisting(row, ['page_latest_message', 'latest_page_message', 'page_message']);
  const hasAutoTrackingSignal = evidence.some(entry => entry.marker);
  const sentNumbers = [...new Set(evidence.flatMap(entry => entry.numbers))];
  const lastAsk = request.candidates.at(-1) || null;
  const orderTime = request.orderTime;

  // เกณฑ์อายุคำขอเลขใช้เวลาข้อความลูกค้าล่าสุดเพียงจุดเดียว
  // ไม่ใช้เวลาบิลหรืออายุที่โหนดก่อนหน้าคำนวณค้างไว้
  const customerMessageTime = parseAnyDate(
    firstExisting(row, [
      'customer_message_time_th',
      'latest_customer_message_time_th',
      'customer_message_time',
    ])
  );
  const customerAgeHours = customerMessageTime
    ? (Date.now() - customerMessageTime.getTime()) / 3600000
    : null;
  const customerWithin48h = Number.isFinite(customerAgeHours)
    && customerAgeHours >= 0
    && customerAgeHours < 48;

  row.customer_latest_message = latestCustomer || row.customer_latest_message || '';
  row.customer_message_time_th = firstExisting(row, ['customer_message_time_th', 'latest_customer_message_time_th', 'customer_message_time']);
  row.page_latest_message = latestPage || row.page_latest_message || '';
  row.page_message_time_th = firstExisting(row, ['page_message_time_th', 'latest_page_message_time_th', 'page_message_time']);
  row.tracking_check = {
    detected: Boolean(lastAsk),
    route: lastAsk ? 'TRACKING_REQUEST' : 'PASS_THROUGH',
    direction: lastAsk ? 'ASK_AFTER_ORDER' : null,
    // คงชื่อ diffHours ไว้ให้โหนดถัดไปไม่พัง แต่ค่าคืออายุจากข้อความลูกค้าจริง
    diffHours: Number.isFinite(customerAgeHours)
      ? Number(customerAgeHours.toFixed(1))
      : null,
    customer_age_hours: Number.isFinite(customerAgeHours)
      ? Number(customerAgeHours.toFixed(1))
      : null,
    customer_message_time_source: 'customer_message_time_th',
    customer_within_48h: customerWithin48h,
    firstAskTime: request.candidates[0]?.time.toISOString() || null,
    lastAskTime: lastAsk?.time.toISOString() || null,
    matchedText: lastAsk?.text || null,
    orderTime: orderTime?.toISOString() || null,
    source: lastAsk?.source || null,
  };
  row.tracking_numbers_found_before = sentNumbers;
  row.tracking_evidence_fields = evidence.map(entry => entry.field);
  row.tracking_marker_found = hasAutoTrackingSignal;
  row.tracking_request_detected = Boolean(lastAsk);
  row.status_color_backup = originalBackup;
  row.routing_tag_backup = originalBackup;
  row.is_safety_white = originalBackup === '⚪White';

  if (hasAutoTrackingSignal) {
    row.bb_express_send_route = '🔴';
    row.node3_route_signal = 'TRACKING_ALREADY_SENT';
    row.node3_tracking_request_detected = true;
    row.node3_tracking_request_48h = false;
    row.node3_tracking_request_event = 'พบข้อความแจ้งเลข/เลขพัสดุที่เคยส่งแล้ว';
    row.node3_tracking_request_route_hint = '🔴';
    row.tracking_duplicate_blocked = true;
  } else if (lastAsk && customerWithin48h) {
    row.bb_express_send_route = '🟥';
    row.node3_route_signal = 'TRACKING_REQUEST';
    row.node3_tracking_request_detected = true;
    row.node3_tracking_request_48h = true;
    row.node3_tracking_request_event = lastAsk.text;
    row.node3_tracking_request_route_hint = '🟥';
    row.tracking_duplicate_blocked = false;
  } else if (lastAsk) {
    // พบคำขอเลข แต่ customer_message_time_th ไม่มีหรือเกิน 48 ชั่วโมง
    row.bb_express_send_route = '🔴';
    row.node3_route_signal = 'TRACKING_REQUEST_OLD_OR_OVER_48H';
    row.node3_tracking_request_detected = true;
    row.node3_tracking_request_48h = false;
    row.node3_tracking_request_event = lastAsk.text;
    row.node3_tracking_request_route_hint = '🔴';
    row.tracking_duplicate_blocked = false;
  } else {
    row.bb_express_send_route = originalRoute;
    row.node3_route_signal = 'PASS_THROUGH';
    row.node3_tracking_request_detected = false;
    row.node3_tracking_request_48h = false;
    row.tracking_duplicate_blocked = false;
  }

  if (row.bb_express_send_route === '🟥' || row.bb_express_send_route === '🔴') {
    row.target_room = 'RED_ROOM';
    row.routing_tag = row.bb_express_send_route === '🟥' ? '🟥 Red48' : '🔴 Red';
    row.status_color = row.bb_express_send_route === '🟥' ? '🟥 Red' : '🔴 Red';
  } else {
    row.target_room = 'WHITE_ROOM';
  }

  return item;
});
