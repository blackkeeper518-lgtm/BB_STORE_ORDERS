// ============================================================
// CUSTOMER CHANGE AUDIT FOOTER
// n8n Code node — Run Once for All Items
// วางหลัง Truth Gate / Master Cascade และก่อนโหนดส่ง Telegram
// ============================================================
// หน้าที่:
// - จับกลุ่มเฉพาะ threadId เดียวกัน
// - เปรียบเทียบใบก่อนหน้า กับใบปัจจุบัน
// - ตรวจสินค้า / จำนวน / COD / เบอร์ / ชื่อ / ที่อยู่ / ขนส่ง
// - ลำดับที่อยู่: telegram_primary_address → rescue_address → ค่าเดิม
// - บอกเปลี่ยนเมื่อไร จากอะไร เป็นอะไร
// - เก็บ raw source line และ source field สำหรับ audit
// - สร้างข้อความท้ายบิลสำหรับแอดมิน
// - ตรวจ marker บิลจริง + bot recap จาก chat_timeline เป็นหลักฐานเลือกบิล
// - ใช้ marker จริง/แชทไทม์ไลน์เพื่อเลือก candidate; ไม่เพิ่ม debug fields ลง JSON root
// - ไม่ลบข้อมูลเก่า และคืนทุกแถวกลับครบ
// ============================================================

const inputItems = $input.all();
const rows = inputItems.map((item, index) => ({ index, json: item?.json || {} }));

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------
function text(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') {
    try { return JSON.stringify(v); } catch (_) { return String(v); }
  }
  return String(v).normalize('NFC').replace(/\\r\n/g, '\n').replace(/\n/g, '\n').trim();
}
function compact(v) { return text(v).replace(/\s+/gu, ' ').trim(); }
function first(row, keys) {
  for (const key of keys) {
    const value = text(row?.[key]);
    if (compact(value)) return value;
  }
  return '';
}
function bool(v) { return v === true || /^(?:true|1|yes)$/iu.test(compact(v)); }
function digits(v) { return compact(v).replace(/\D/g, ''); }
function numberValue(v) {
  const m = compact(v).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}
function formatValue(v, kind) {
  const value = compact(v);
  if (!value) return 'ไม่พบข้อมูล';
  if (kind === 'phone') return value;
  if (kind === 'cod') return value;
  return value;
}
function normalize(v, kind) {
  let s = compact(v).toLowerCase().normalize('NFC');
  if (kind === 'phone') return s.replace(/\D/g, '');
  if (kind === 'cod') return s;
  if (kind === 'address') {
    s = s.replace(/ตำบล|ตําบล/gu, 'ต').replace(/อำเภอ|อําเภอ/gu, 'อ').replace(/จังหวัด/gu, 'จ');
  }
  return s.replace(/[^\p{L}\p{N}]/gu, '');
}
function parseTime(v) {
  const s = compact(v);
  if (!s) return 0;
  const iso = Date.parse(s);
  if (Number.isFinite(iso) && !/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/u.test(s)) return iso;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/u);
  if (!m) return 0;
  let year = Number(m[3]);
  if (year < 100) year += 1957;
  else if (year >= 2400) year -= 543;
  const stamp = Date.UTC(year, Number(m[2]) - 1, Number(m[1]), Number(m[4]) - 7, Number(m[5]), Number(m[6] || 0));
  return Number.isFinite(stamp) ? stamp : 0;
}
function displayTime(row) {
  return text(row?.order_time_display);
}
const ORDER_CYCLE_MAX_GAP_MS = 30 * 60 * 1000;
const ORDER_CYCLE_CHAT_WINDOW_MS = 30 * 60 * 1000;
function orderDisplayDayKey(row) {
  const raw = text(row?.order_time_display);
  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+/u);
  if (!m) return '';
  let year = Number(m[3]);
  if (year < 100) year += 1957;
  else if (year >= 2400) year -= 543;
  return `${year}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`;
}
function rowIdentityKey(row, index) {
  const thread = first(row, ['threadId', 'thread_id']);
  const fb = first(row, ['facebook_name']);
  const page = first(row, ['page_id', 'pageId', 'page_name']) || 'NO_PAGE';
  if (thread && fb) return `THREAD_FACEBOOK_PAGE|${thread}|${fb}|${page}`;
  // thread/name ไม่ครบ => upsert_key เป็น singleton; ห้ามรวมจากชื่อ Facebook อย่างเดียว
  return `ROW|${first(row, ['upsert_key', 'order_number']) || index}`;
}
function timelineMessages(row) {
  const raw = row.chat_timeline;
  if (Array.isArray(raw)) return raw.map(text).filter(Boolean);
  const s = text(raw);
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map(text).filter(Boolean);
  } catch (_) {}
  return s.split(/\n+/u).map(text).filter(Boolean);
}
// ------------------------------------------------------------
// Real-order marker + bot recap detection (diagnostic/selection evidence)
// ------------------------------------------------------------
const TRACKING_REQUEST_RE = /(?:ขอ\s*(?:เลข|เลขพัสดุ|เลขติดตาม|เลขแทร็ก|เลข\s*tracking|เลข\s*AWB)|ขอ\s*(?:เช็ค|เช็ก)\s*เลข|รบกวนแจ้งเลขพัสดุ|ส่งเลขพัสดุให้หน่อย|มีเลขพัสดุไหม|เลขพัสดุออกหรือยัง|เช็คพัสดุ|เช็กพัสดุ|ติดตามพัสดุ|สถานะพัสดุ|tracking|AWB)/iu;
const FORMAL_ORDER_MARKER_RE = /(?:🚨\s*\[\s*สถานะ\s*:\s*ปิดยอดสำเร็จ\s*\]\s*🚨|#\s*BB_ORDER\s*✅)/iu;
const POSITIVE_BILL_TYPES = new Set(['HUMAN_ADMIN_BILL', 'HUMAN_DARK_AHK', 'OFFICIAL_BOT_BILL']);

function rowOrderType(row) {
  const values = [row.sniper_bill_type, row.new_bill_sniper_type, row.old_bill_sniper_type,
    row.order_source_type, row.bill_type, row.order_type, row.four1_bill_type]
    .map(v => compact(v).toUpperCase());
  return values.flatMap(v => [...POSITIVE_BILL_TYPES].filter(type => v.includes(type)))[0] || '';
}
function rowOrderTime(row) {
  return parseTime(first(row, ['order_time_display']));
}
function rawBillText(row) {
  return [row.raw_original, row.original, row.original_api_message, row.message,
    row.telegram_message, row.order_text, row.raw_text].map(text).filter(Boolean).join('\n');
}
function parseTimelineEvent(line) {
  const s = text(line);
  const m = s.match(/^\[([^\]]+?):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?:\s+\d{1,2}[:.]\d{2}(?::\d{2})?)?)\]\s*([\s\S]*)$/u);
  if (!m) return null;
  return { sender: compact(m[1]), timestamp: parseTime(m[2]), body: text(m[3]), raw: s };
}
function hasTimelineEventNearOrderTime(row, orderStamp) {
  const events = timelineMessages(row).map(parseTimelineEvent).filter(e => e?.timestamp > 0);
  if (!events.length) return true; // ไม่มี timestamp ใน timeline: ใช้ order_time_display เท่านั้น
  return events.some(e => Math.abs(e.timestamp - orderStamp) <= ORDER_CYCLE_CHAT_WINDOW_MS);
}
function buildOrderCycleGroups(entries) {
  const groups = new Map();
  const hasPreSaveContract = entries.some(x => compact(x.json.pre_save_change_group_key));
  if (hasPreSaveContract) {
    for (const entry of entries) {
      const key = first(entry.json, ['pre_save_change_group_key']) || `PRE_SAVE_SINGLE|${entry.index}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    }
    return groups;
  }
  // Backward-compatible fallback for inputs that did not pass through PRE-SAVE CHANGE AUDIT2.
  const baseGroups = new Map();
  for (const entry of entries) {
    const base = rowIdentityKey(entry.json, entry.index);
    if (!baseGroups.has(base)) baseGroups.set(base, []);
    baseGroups.get(base).push(entry);
  }
  for (const [base, members] of baseGroups.entries()) {
    const prepared = members.map(entry => ({ entry, stamp: rowOrderTime(entry.json), day: orderDisplayDayKey(entry.json) }))
      .sort((a, b) => (a.stamp || 0) - (b.stamp || 0) || a.entry.index - b.entry.index);
    let cluster = [];
    const flush = () => {
      if (!cluster.length) return;
      const firstItem = cluster[0];
      const cycle = firstItem.stamp && firstItem.day ? `${firstItem.day}|${firstItem.stamp}` : `SINGLE_ROW|${firstItem.entry.index}`;
      groups.set(`${base}|ORDER_CYCLE|${cycle}`, cluster.map(x => x.entry));
      cluster = [];
    };
    for (const item of prepared) {
      const validTime = item.stamp > 0 && Boolean(item.day);
      const chatAnchor = validTime && hasTimelineEventNearOrderTime(item.entry.json, item.stamp);
      if (!validTime || !chatAnchor) { flush(); cluster = [item]; flush(); continue; }
      if (cluster.length) {
        const firstItem = cluster[0];
        const sameCycle = firstItem.day === item.day && item.stamp >= firstItem.stamp && item.stamp - firstItem.stamp <= ORDER_CYCLE_MAX_GAP_MS;
        if (!sameCycle) flush();
      }
      cluster.push(item);
    }
    flush();
  }
  return groups;
}
function isStoreOrBot(name) {
  return /BB\s*store|BBสโตร์|BBεїз|เบอร์หนึ่งสโตร์|เจ๊บี|ร้าน|สโตร์|store|เพจ|bot|ระบบ|แอดมิน/iu.test(text(name));
}
function formalOrderMarker(row) {
  const raw = rawBillText(row);
  if (FORMAL_ORDER_MARKER_RE.test(raw)) {
    return { detected: true, source: 'ROW_TEXT', marker: raw.match(FORMAL_ORDER_MARKER_RE)?.[0] || '' };
  }
  const type = rowOrderType(row);
  if (type) return { detected: true, source: 'BILL_TYPE', marker: type };

  // Timeline markers count only when they belong to this bill's order time;
  // a marker anywhere in a shared thread must not bless every row.
  const t = rowOrderTime(row);
  if (t) {
    for (const line of timelineMessages(row)) {
      const event = parseTimelineEvent(line);
      if (!event || !event.timestamp || Math.abs(event.timestamp - t) > 5 * 60 * 1000) continue;
      const match = event.body.match(FORMAL_ORDER_MARKER_RE);
      if (match) return { detected: true, source: 'MATCHED_CHAT_TIMELINE', marker: match[0] };
    }
  }
  return { detected: false, source: '', marker: '' };
}
function botRecapAfterTracking(row) {
  const billTime = rowOrderTime(row);
  const events = timelineMessages(row).map(parseTimelineEvent).filter(Boolean);
  const requests = events.filter(e => TRACKING_REQUEST_RE.test(e.body) && !isStoreOrBot(e.sender));
  if (!requests.length) return { detected: false, request_at: 0, recap_at: 0, reason: 'NO_CUSTOMER_TRACKING_REQUEST' };

  const recap = events.find(e => {
    if (!isStoreOrBot(e.sender) || !e.timestamp) return false;
    const isSummary = /(?:สรุปรายการสั่งซื้อ|สรุปออเดอร์|รายการสั่งซื้อ|ยอดรวม\s*COD|COD\s*[:：]|รายการสินค้า|)/iu.test(e.body);
    if (!isSummary || FORMAL_ORDER_MARKER_RE.test(e.body)) return false;
    const priorRequest = requests.some(r => r.timestamp && r.timestamp <= e.timestamp);
    if (!priorRequest) return false;
    // Link this timeline recap to this row by order timestamp; avoid thread-wide false positives.
    return !billTime || Math.abs(e.timestamp - billTime) <= 10 * 60 * 1000;
  });
  if (!recap) return { detected: false, request_at: Math.max(...requests.map(x => x.timestamp || 0)), recap_at: 0, reason: 'NO_MATCHING_UNMARKED_BOT_RECAP' };
  const request = requests.filter(r => r.timestamp && r.timestamp <= recap.timestamp)
    .sort((a,b) => b.timestamp - a.timestamp)[0];
  return {
    detected: true,
    request_at: request?.timestamp || 0,
    recap_at: recap.timestamp,
    reason: 'CUSTOMER_TRACKING_REQUEST_THEN_UNMARKED_BOT_SUMMARY',
  };
}
function candidateHasRealOrderEvidence(row) {
  return formalOrderMarker(row).detected;
}

function sourceLines(row) {
  const lines = [];
  const original = text(row.original || row.original_api_message);
  original.split(/\n+/u).map(compact).filter(Boolean).forEach((line, i) => {
    lines.push({ field: 'original', line_no: i + 1, text: line, time: displayTime(row) });
  });
  timelineMessages(row).forEach((line, i) => {
    lines.push({ field: 'chat_timeline', line_no: i + 1, text: compact(line), time: displayTime(row) });
  });
  return lines;
}
function findEvidence(row, terms) {
  const lines = sourceLines(row);
  return lines.find(x => terms.some(re => re.test(x.text))) || null;
}

// ------------------------------------------------------------
// Field extraction
// ------------------------------------------------------------

function productColorToken(raw) {
  const s = compact(raw).normalize('NFKC');
  const m = s.match(/\b(?:green|red|blue|black|white|yellow|pink|purple|orange|brown|gray|grey|mint|navy|silver|gold)\b|เขียว|แดง|น้ำเงิน|ฟ้า|ดำ|ขาว|เหลือง|ชมพู|ม่วง|ส้ม|น้ำตาล|เทา|มิ้นท์|มิ้นต์/iu);
  return m ? compact(m[0]).toLowerCase() : '';
}
function productQuantityFromText(raw) {
  const s = compact(raw);
  const unitRe = '(คอต\\.?|ซอง|แพ็ค|แพ็ก|กล่อง|ชิ้น|หีบ|ขวด|กระปุก|ชุด)';
  let m = s.match(new RegExp('(?:[x×]\\s*|จำนวน\\s*)(\\d+(?:\\.\\d+)?)\\s*' + unitRe, 'iu'));
  if (!m) m = s.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s*' + unitRe, 'iu'));
  return m ? { qty: Number(m[1]), unit: String(m[2]).replace(/\\.$/u, '') } : null;
}
function cleanProductIdentity(raw) {
  return compact(raw).normalize('NFKC').toLowerCase()
    .replace(/\b(?:green|red|blue|black|white|yellow|pink|purple|orange|brown|gray|grey|mint|navy|silver|gold)\b|เขียว|แดง|น้ำเงิน|ฟ้า|ดำ|ขาว|เหลือง|ชมพู|ม่วง|ส้ม|น้ำตาล|เทา|มิ้นท์|มิ้นต์/giu, '')
    .replace(/(?:จำนวน\s*)?\d+(?:\.\d+)?\s*(?:คอต\.?|ซอง|แพ็ค|แพ็ก|กล่อง|ชิ้น|หีบ|ขวด|กระปุก|ชุด)?/giu, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}
function productArraySource(row) {
  for (const key of ['product_items_v5', 'product_items_matched', 'product_map_items', 'orderItems', 'order_items']) {
    if (Array.isArray(row?.[key]) && row[key].length) return row[key];
  }
  return null;
}
function normalizedProductItems(row) {
  const source = productArraySource(row);
  let rawItems = source || [];
  if (!source) {
    const raw = first(row, ['order_fibo_product', 'trusted_product', 'final_display_for_packer', 'display_for_packer', 'telegram_product_display', 'for_packer_st_display', 'manus_for_packer', 'google_for_packer', 'packer_tag_display', 'final_product', 'sku']);
    rawItems = raw.split(/\n+/u).map(line => line.trim()).filter(Boolean);
  }
  const items = [];
  for (const rawItem of rawItems) {
    const obj = rawItem && typeof rawItem === 'object' ? rawItem : {};
    const display = first(obj, ['final_product', 'mapped_display', 'master_display_for_packer', 'display_for_packer', 'trusted_product', 'product_name', 'th_name', 'name', 'sku', 'master_sku', 'raw_line']) || (typeof rawItem === 'string' ? rawItem : '');
    const rawLine = first(obj, ['raw_line', 'raw_source_line', 'source_line']);
    const detail = [display, rawLine, first(obj, ['sku', 'master_sku', 'product_name', 'th_name'])].filter(Boolean).join(' ');
    if (!compact(detail)) continue;
    let qty = Number(obj.quantity ?? obj.qty ?? obj.extractedQtyNum ?? obj.quantity_value);
    let unit = first(obj, ['quantity_unit', 'unit_label', 'unit']) || '';
    if (!Number.isFinite(qty) || qty <= 0) {
      const parsed = productQuantityFromText(detail);
      qty = parsed?.qty || 1;
      unit = unit || parsed?.unit || 'คอต';
    } else {
      unit = unit.replace(/\.$/u, '') || productQuantityFromText(detail)?.unit || 'คอต';
    }
    const explicitVariant = first(obj, ['variant_name', 'variant', 'color', 'colour', 'color_name', 'option']);
    const color = productColorToken(explicitVariant || detail);
    const identitySource = first(obj, ['master_sku', 'product_id', 'sku', 'product_name', 'th_name', 'name']) || display || rawLine;
    const identity = cleanProductIdentity(identitySource) || cleanProductIdentity(detail);
    let itemDisplay = compact(display || rawLine);
    if (!productQuantityFromText(itemDisplay)) itemDisplay = `${itemDisplay} x ${qty} ${unit}`;
    items.push({ identity, color, qty, unit, display: itemDisplay });
  }
  if (!source && items.length === 1 && !productQuantityFromText(items[0].display)) {
    const rowQty = Number(row?.final_order_qty ?? row?.total_quantity ?? row?.qty);
    if (Number.isFinite(rowQty) && rowQty > 0) items[0].qty = rowQty;
  }
  return items;
}
function productIdentitySignature(row) {
  return normalizedProductItems(row).map(x => x.identity).filter(Boolean).sort().join('|');
}
function productDisplayValue(row) {
  const items = normalizedProductItems(row);
  if (items.length) return items.map(x => x.display).join('\n');
  return first(row, ['order_fibo_product', 'trusted_product', 'final_display_for_packer', 'display_for_packer', 'telegram_product_display', 'for_packer_st_display', 'manus_for_packer', 'google_for_packer', 'packer_tag_display', 'final_product', 'sku']);
}
function productColorValue(row) {
  const items = normalizedProductItems(row);
  return items.filter(x => x.color).map(x => `${x.identity || 'สินค้า'}: ${x.color}`).join(' | ');
}
function productColorChanged(previous, current) {
  const oldItems = normalizedProductItems(previous);
  const newItems = normalizedProductItems(current);
  const oldMap = new Map(); const newMap = new Map();
  for (const x of oldItems) { if (!oldMap.has(x.identity)) oldMap.set(x.identity, []); oldMap.get(x.identity).push(x.color); }
  for (const x of newItems) { if (!newMap.has(x.identity)) newMap.set(x.identity, []); newMap.get(x.identity).push(x.color); }
  for (const id of oldMap.keys()) {
    if (!newMap.has(id)) continue;
    const a = oldMap.get(id).filter(Boolean).sort().join('|');
    const b = newMap.get(id).filter(Boolean).sort().join('|');
    if (a !== b && (a || b)) return true;
  }
  return false;
}
function productQuantitySignature(row) {
  return normalizedProductItems(row).map(x => `${x.identity}:${x.qty}:${x.unit}`).sort().join('|');
}
function productQuantityValue(row) {
  const totals = new Map();
  for (const item of normalizedProductItems(row)) totals.set(item.unit || 'หน่วย', (totals.get(item.unit || 'หน่วย') || 0) + Number(item.qty || 0));
  return [...totals.entries()].map(([unit, qty]) => `${qty} ${unit}`).join(' + ');
}

function fieldValue(row, field) {
  if (field === 'product') return productDisplayValue(row);
  if (field === 'color') return productColorValue(row);
  if (field === 'quantity') return productQuantityValue(row);
  const map = {
    product: [],
    color: [],
    quantity: [],
    cod: ['cod_amount', 'expected_cod', 'cod_value'],
    phone: ['phone', 'extracted_phone', 'clean_phone', 'rescue_phone', 'phone_number'],
    name: ['customer_name', 'recipient_name', 'name', 'customer', 'customer_name_current'],
    address: [
      'address_fibo_selected_clean',
      'telegram_primary_address',
      'address_display_packer',
      'rescue_address_normalized',
      'full_address'
    ],
    carrier: ['shipping_carrier', 'rescue_shipping_carrier']
  };
  const missingRe = /^(?:\[\]|\{\}|null|undefined|data_missing|n\/a|ไม่มีข้อมูล|ไม่พบข้อมูล|ไม่พบสินค้า|ไม่ระบุสินค้า|ไม่พบจำนวน|ไม่มีจำนวน)$/iu;
  for (const key of map[field] || []) {
    const raw = row?.[key] ?? row?.packer_obj?.[key];
    if (raw === undefined || raw === null) continue;
    let value = '';
    if (field === 'product' && Array.isArray(raw)) {
      value = raw.map(part => {
        if (part && typeof part === 'object') {
          return first(part, ['final_product', 'raw_line', 'trusted_product', 'sku', 'product_name', 'name']);
        }
        return text(part);
      }).filter(Boolean).join(', ');
    } else {
      value = text(raw);
    }
    let clean = compact(value);
    if (!clean || missingRe.test(clean)) continue;
    if (field === 'product' && /^(?:\[\s*\]|\{\s*\}|\[object Object\])$/iu.test(clean)) continue;
    if (field === 'product') {
      const proseNoise = /เชื่อมต่อ|ทีมจะ|ทีมงาน|ยอด\s*COD|ยอดรวม|ที่อยู่|เบอร์โทร|เลขพัสดุ|การขนส่ง|ขนส่ง|ส่งฟรี|ปลายทาง|ชำระเงิน|รับสาย|บันทึกออเดอร์|สรุปยอด|พี่จะให้หนู|LINE\.?(?:ee)?/iu;
      const hasQuantity = /(?:[x×]\s*\d+|จำนวน\s*\d+|\d+\s*(?:คอต|ชิ้น|หีบ|กล่อง|ซอง|แพ็ค|แพ็ก)|\p{L}+\s+\d+\s*$)/iu;
      const validLines = String(value).split(/\n+/u).map(compact)
        .filter(line => line && !proseNoise.test(line) && /\p{L}/u.test(line) && hasQuantity.test(line));
      if (!validLines.length) continue;
      clean = validLines.join('\n');
    }
    return field === 'product' ? clean : value;
  }
  return '';
}
function fieldKind(field) {
  if (field === 'phone') return 'phone';
  if (field === 'cod') return 'cod';
  if (field === 'address') return 'address';
  return 'text';
}
function fieldLabel(field) {
  return {
    product: 'รายการสินค้า',
    color: 'สี/รุ่นสินค้า',
    quantity: 'จำนวนสินค้า',
    cod: 'ยอด COD',
    phone: 'เบอร์โทร',
    name: 'ชื่อผู้รับ',
    address: 'ที่อยู่',
    carrier: 'ขนส่ง'
  }[field] || field;
}
function fieldEmoji(field) {
  return { product: '📦', color: '🎨', quantity: '🔢', cod: '💰', phone: '📞', name: '👤', address: '🏠', carrier: '🚚' }[field] || '•';
}

// ------------------------------------------------------------
// Winner / previous selection
// ------------------------------------------------------------
function isCandidate(row) {
  const product = fieldValue(row, 'product');
  const address = fieldValue(row, 'address');
  const phone = fieldValue(row, 'phone');
  const cod = fieldValue(row, 'cod');
  return Boolean(product || address || phone || cod);
}
function isCurrent(row) {
  return bool(row.is_current_candidate)
    || bool(row.four1_winner)
    || row.duplicate_role === 'SELECTED_CANDIDATE'
    || row.main_gate_decision === 'WINNER'
    || row.switch3_route === 'READY';
}
function sortNewest(a, b) {
  return parseTime(displayTime(b.json)) - parseTime(displayTime(a.json)) || b.index - a.index;
}
function previousFor(selected, candidates) {
  const selectedTime = parseTime(displayTime(selected.json));
  const older = candidates
    .filter(x => x.index !== selected.index)
    .filter(x => {
      const t = parseTime(displayTime(x.json));
      return !selectedTime || !t || t < selectedTime;
    })
    .sort(sortNewest);
  return older[0] || candidates.filter(x => x.index !== selected.index).sort(sortNewest)[0] || null;
}

// ------------------------------------------------------------
// Audit comparison
// ------------------------------------------------------------
function compare(previous, current) {
  const fields = ['product', 'color', 'quantity', 'cod', 'phone', 'name', 'address', 'carrier'];
  const changes = [];
  for (const field of fields) {
    const kind = fieldKind(field);
    const before = fieldValue(previous, field);
    const after = fieldValue(current, field);
    const beforeNorm = field === 'product' ? productIdentitySignature(previous)
      : field === 'color' ? productColorValue(previous).toLowerCase()
      : field === 'quantity' ? productQuantitySignature(previous)
      : normalize(before, kind);
    const afterNorm = field === 'product' ? productIdentitySignature(current)
      : field === 'color' ? productColorValue(current).toLowerCase()
      : field === 'quantity' ? productQuantitySignature(current)
      : normalize(after, kind);
    const fieldChanged = field === 'color'
      ? productColorChanged(previous, current)
      : beforeNorm !== afterNorm && Boolean(beforeNorm || afterNorm);
    if (fieldChanged) {
      const evidence = findEvidence(current, field === 'product'
        ? [/สินค้า|คอต|กล่อง|ชิ้น|MOND|VESS|CAVALLO|ซีวอส|เวส/iu]
        : field === 'address'
          ? [/ที่อยู่|หมู่|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|รหัสไปรษณีย์/iu]
          : field === 'phone'
            ? [/โทร|เบอร์|มือถือ|0\d{8,}/iu]
        : field === 'cod'
              ? [/COD|ยอด/iu]
              : [/.+/u]);
      changes.push({
        field,
        label: fieldLabel(field),
        emoji: fieldEmoji(field),
        before,
        after,
        before_display: formatValue(before, kind),
        after_display: formatValue(after, kind),
        changed_at: displayTime(current),
        previous_time: displayTime(previous),
        source_field: evidence?.field || 'row_fields',
        source_line_no: evidence?.line_no || null,
        source_line: evidence?.text || '',
        reason: field === 'product'
          ? 'ลูกค้าเพิ่ม/ลบ/เปลี่ยนรายการสินค้า'
          : field === 'color'
            ? 'ลูกค้าเปลี่ยนสีหรือรุ่นสินค้า'
            : field === 'quantity'
              ? 'ลูกค้าเปลี่ยนจำนวนหรือสัดส่วนสินค้า'
          : field === 'cod'
              ? 'ยอด COD เปลี่ยนตามข้อมูลออเดอร์ชุดใหม่'
              : field === 'address'
                ? 'ลูกค้าแก้ไขหรือส่งที่อยู่ชุดใหม่'
                : field === 'phone'
                  ? 'ลูกค้าแก้ไขเบอร์โทรศัพท์'
                  : field === 'name'
                    ? 'ชื่อผู้รับเปลี่ยน'
                    : 'ลูกค้าเปลี่ยนขนส่ง'
      });
    }
  }
  return changes;
}
function htmlEscape(v) {
  return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&;');
}
function auditDisplayOrderId(row) {
  const raw = first(row, ['order_number_display', 'order_number', 'order_id', 'order_no']) ||
    first(row?.packer_obj, ['order_number_display', 'order_number', 'order_id']) ||
    first(row, ['upsert_key', 'id']);
  const match = String(raw || '').match(/ORD-[A-Z0-9-]+/iu);
  return match ? match[0] : (String(raw || '').trim() || 'ไม่พบ ORD');
}
function auditTelegramSentAt(previous, current) {
  const direct = first(previous, ['telegram_sent_at', 'telegram_sent_time', 'last_telegram_sent_at']) ||
    first(current, ['customer_change_previous_telegram_sent_time', 'previous_telegram_sent_time']);
  if (direct) return direct;
  const source = [
    first(current, ['customer_change_summary', 'customer_change_admin_footer_text', 'customer_change_admin_footer']),
    first(previous, ['customer_change_summary', 'customer_change_admin_footer_text', 'customer_change_admin_footer', 'telegram_message'])
  ].filter(Boolean).join('\n');
  const match = source.match(/(?:ใบเดิมถูกส่ง Telegram แล้ว|ส่ง Telegram แล้ว)\s*(?:→|->)\s*⌚?\s*([^\n]+)/iu);
  return match ? match[1].trim() : 'ไม่พบเวลา Telegram';
}
function buildFooter(changes, previous, current) {
  if (!changes.length) return '';
  const previousOrd = auditDisplayOrderId(previous);
  const currentOrd = auditDisplayOrderId(current);
  const previousSentAt = auditTelegramSentAt(previous, current);
  const lines = [
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '🧾 <b>CHANGE AUDIT — เฉพาะข้อมูลที่เปลี่ยน</b>',
    '📍 <b>ป้ายห้อง:</b> CUSTOMER_CHANGE_ALERT',
    `🆔 <b>ORD ใบเดิม:</b> <code>${htmlEscape(previousOrd)}</code>`,
    `⏰ <b>เวลาสั่งซื้อใบเดิม:</b> ${htmlEscape(displayTime(previous))}`,
    `📨 <b>ใบเดิมส่ง Telegram:</b> ${htmlEscape(previousSentAt)}`,
    `🆕 <b>ORD ใบใหม่:</b> <code>${htmlEscape(currentOrd)}</code>`,
    `⏰ <b>เวลาสั่งซื้อใบใหม่:</b> ${htmlEscape(displayTime(current))}`,
    `📌 <b>เปลี่ยนทั้งหมด:</b> ${changes.length} รายการ`,
    ''
  ];
  for (const change of changes) {
    lines.push(`${change.emoji} <b>${htmlEscape(change.label)}</b>`);
    lines.push(`เดิม: <code>${htmlEscape(change.before_display)}</code>`);
    lines.push(`ใหม่: <code>${htmlEscape(change.after_display)}</code>`);
    lines.push(`เหตุผล: ${htmlEscape(change.reason)}`);
    lines.push(`เวลาเปลี่ยน: ${htmlEscape(change.changed_at)}`);
    if (change.source_line) lines.push(`อ้างอิง: <i>${htmlEscape(change.source_line)}</i>`);
    lines.push('');
  }
  lines.push('⚠️ <i>ใบเดิมเก็บประวัติ CHRONOS_TARTARUS และไม่ใช้ส่งซ้ำ</i>');
  return lines.join('\n');
}
function buildPlainFooter(changes, previous, current) {
  if (!changes.length) return '';
  const previousOrd = auditDisplayOrderId(previous);
  const currentOrd = auditDisplayOrderId(current);
  const previousSentAt = auditTelegramSentAt(previous, current);
  const lines = [
    '', '━━━━━━━━━━━━━━━━━━━━', '🧾 CHANGE AUDIT — เฉพาะข้อมูลที่เปลี่ยน',
    'ป้ายห้อง: CUSTOMER_CHANGE_ALERT',
    `ORD ใบเดิม: ${previousOrd}`,
    `เวลาสั่งซื้อใบเดิม: ${displayTime(previous)}`,
    `ใบเดิมส่ง Telegram: ${previousSentAt}`,
    `ORD ใบใหม่: ${currentOrd}`,
    `เวลาสั่งซื้อใบใหม่: ${displayTime(current)}`,
    `เปลี่ยนทั้งหมด: ${changes.length} รายการ`, ''
  ];
  for (const c of changes) {
    lines.push(`${c.emoji} ${c.label}`);
    lines.push(`เดิม: ${c.before_display}`);
    lines.push(`ใหม่: ${c.after_display}`);
    lines.push(`เหตุผล: ${c.reason}`);
    lines.push(`เวลาเปลี่ยน: ${c.changed_at}`);
    if (c.source_line) lines.push(`อ้างอิง: ${c.source_line}`);
    lines.push('');
  }
  lines.push('⚠️ ใบเดิมเก็บประวัติ CHRONOS_TARTARUS และไม่ใช้ส่งซ้ำ');
  return lines.join('\n');
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
const groups = buildOrderCycleGroups(rows);

const annotations = new Map();

for (const [key, group] of groups.entries()) {
  const candidates = group.filter(x => isCandidate(x.json));
  // Strong real-order markers outrank newer unmarked bot recaps. If no marker
  // exists, suppress a recap only when another plausible non-recap candidate exists.
  const markedCandidates = candidates.filter(x => candidateHasRealOrderEvidence(x.json));
  const nonRecapCandidates = candidates.filter(x => !botRecapAfterTracking(x.json).detected);
  const selectionPool = markedCandidates.length
    ? markedCandidates
    : nonRecapCandidates.length
      ? nonRecapCandidates
      : candidates;
  const sorted = [...selectionPool].sort(sortNewest);
  const newest = sorted[0] || group[0];
  const newestHasTime = newest && parseTime(displayTime(newest.json)) > 0;
  // Prefer the latest timestamp over stale READY/current flags from upstream.
  const preSaveSelected = candidates.filter(x => bool(x.json.pre_save_change_selected));
  const selected = preSaveSelected.length === 1
    ? preSaveSelected[0]
    : (newestHasTime ? newest : (sorted.find(x => isCurrent(x.json)) || newest || group[0]));
  const preSavePrevious = candidates.filter(x => bool(x.json.pre_save_change_previous));
  const previous = selected && preSavePrevious.length === 1
    ? preSavePrevious[0]
    : (selected && candidates.length > 1 ? previousFor(selected, candidates) : null);
  let changes = previous ? compare(previous.json, selected.json) : [];
  if (previous && selected) {
    const upstreamFields = compact(selected.json.pre_save_change_fields).toUpperCase().split(/[,\s]+/u).filter(Boolean);
    const upstreamAliases = { COLOR: 'color', VARIANT: 'color', QTY: 'quantity', QUANTITY: 'quantity', PRODUCT_ADDED: 'product', PRODUCT: 'product', COD: 'cod', PHONE: 'phone', ADDRESS: 'address', CUSTOMER: 'name', NAME: 'name', CARRIER: 'carrier' };
    const existingFields = new Set(changes.map(x => x.field));
    for (const token of upstreamFields) {
      const field = upstreamAliases[token];
      if (!field || existingFields.has(field)) continue;
      const preSaveValues = {
        product: ['customer_product_previous', 'customer_product_current'],
        color: ['customer_color_previous', 'customer_color_current'],
        quantity: ['customer_quantity_previous', 'customer_quantity_current'],
        cod: ['customer_cod_previous', 'customer_cod_current'],
        phone: ['customer_phone_previous', 'customer_phone_current'],
        address: ['customer_address_previous', 'customer_address_current'],
        name: ['customer_name_previous', 'customer_name_current'],
        carrier: ['customer_carrier_previous', 'customer_carrier_current']
      }[field] || [];
      const before = preSaveValues.length ? first(selected.json, [preSaveValues[0]]) : fieldValue(previous.json, field);
      const after = preSaveValues.length ? first(selected.json, [preSaveValues[1]]) : fieldValue(selected.json, field);
      changes.push({ field, label: fieldLabel(field), emoji: fieldEmoji(field), before, after, before_display: formatValue(before, fieldKind(field)), after_display: formatValue(after, fieldKind(field)), changed_at: displayTime(selected.json), previous_time: displayTime(previous.json), source_field: 'PRE_SAVE_CHANGE_AUDIT2', source_line_no: null, source_line: '', reason: `พบการเปลี่ยน${fieldLabel(field)}จาก PRE-SAVE CHANGE AUDIT2` });
      existingFields.add(field);
    }
  }

  // ============================================================
  // 🏷️ ป้ายบิลใหม่/บิลเก่า — ไม่ทับ routing_tag ระบบ 7 วัน
  // ============================================================
  const hasChange = changes.length > 0;
  const hasProductChange = changes.some(change => change.field === 'product');
  const hasColorChange = changes.some(change => change.field === 'color');
  const hasQuantityChange = changes.some(change => change.field === 'quantity');
  const hasPhoneChange = changes.some(change => change.field === 'phone');
  const hasAddressChange = changes.some(change => change.field === 'address');
  const hasCodChange = changes.some(change => change.field === 'cod');
  const hasNameChange = changes.some(change => change.field === 'name');
  const hasCarrierChange = changes.some(change => change.field === 'carrier');

  const currentProductMissing =
    (hasProductChange || hasColorChange || hasQuantityChange) && !fieldValue(selected.json, 'product');

  const newBillSniperType = (hasProductChange || hasColorChange || hasQuantityChange)
    ? 'ORDER_PRODUCT_CHANGE'
    : hasChange
      ? 'CUSTOMER_DATA_CHANGE'
      : 'NO_CHANGE';

  const newBillSniperBadge = hasProductChange
    ? '🟡 ORDER_PRODUCT_CHANGE'
    : hasColorChange
      ? '🎨 PRODUCT_COLOR_CHANGE'
      : hasQuantityChange
        ? '🔢 PRODUCT_QUANTITY_CHANGE'
    : hasPhoneChange
      ? '🔵 CUSTOMER_PHONE_CHANGE'
      : hasAddressChange
        ? '🟣 CUSTOMER_ADDRESS_CHANGE'
        : hasCodChange
          ? '🟠 CUSTOMER_COD_CHANGE'
          : hasNameChange
            ? '🟢 CUSTOMER_NAME_CHANGE'
            : hasCarrierChange
              ? '🟦 CUSTOMER_CARRIER_CHANGE'
              : 'NO_CHANGE';

  const newBillSniperReason = hasProductChange
    ? 'มีการเพิ่ม/ลบ/เปลี่ยนรายการสินค้า'
    : hasColorChange
      ? 'มีการเปลี่ยนสีหรือรุ่นสินค้า'
      : hasQuantityChange
        ? 'มีการเปลี่ยนจำนวนสินค้า'
    : hasPhoneChange
      ? 'มีการเปลี่ยนเบอร์โทรศัพท์'
      : hasAddressChange
        ? 'มีการเปลี่ยนที่อยู่'
        : hasCodChange
          ? 'มียอด COD เปลี่ยน'
          : hasNameChange
            ? 'มีการเปลี่ยนชื่อผู้รับ'
            : hasCarrierChange
              ? 'มีการเปลี่ยนขนส่ง'
              : 'ไม่พบการเปลี่ยนแปลง';

  const oldBillSniperType = (hasChange || group.length > 1)
    ? 'SUPERSEDED_OLD_BILL'
    : 'NO_CHANGE';

  const oldBillSniperBadge = (hasChange || group.length > 1)
    ? '🟠 SUPERSEDED_OLD_BILL'
    : 'NO_CHANGE';
  const footerHtml = previous ? buildFooter(changes, previous.json, selected.json) : '';
  const footerText = previous ? buildPlainFooter(changes, previous.json, selected.json) : '';
  const currentKey = first(selected.json, ['upsert_key', 'order_number', 'id']);
  const previousKey = previous ? first(previous.json, ['upsert_key', 'order_number', 'id']) : '';
  const currentTime = displayTime(selected.json);
  const previousTime = previous ? displayTime(previous.json) : '';
  function footerRouteDecisionFor(isSelected) {
    return hasChange
      ? (isSelected ? '🟨' : '🟠')
      : 'PASS_THROUGH_NO_CHANGE';
  }

  for (const entry of group) {
    const isSelected = entry.index === selected.index;
    const isOld = !isSelected && group.length > 1;
    const changeFields = changes.map(x => x.field.toUpperCase());
    const base = {
      customer_change_audit_version: 'CHANGE_AUDIT_FOOTER_V1',
      customer_change_audit_group_key: first(selected.json, ['pre_save_change_group_key']) || key,
      customer_change_audit_group_source: first(selected.json, ['pre_save_change_group_key']) ? 'PRE_SAVE_CHANGE_AUDIT2' : 'FOOTER_FALLBACK_GROUPING',
      customer_change_audit_group_size: String(group.length),
      customer_change_audit_candidate_count: String(candidates.length),
      customer_change_audit_is_current: isSelected,
      customer_change_audit_is_previous: isOld,
      customer_change_detected: isSelected && changes.length > 0 ? 'true' : 'false',
      customer_change_count: String(isSelected ? changes.length : 0),
      customer_change_fields: isSelected ? changeFields.join(',') : '',
      customer_change_type: isSelected && changeFields.length ? `${changeFields.join('_AND_')}_CHANGE` : 'NONE',
      customer_change_previous_upsert_key: previousKey,
      customer_change_current_upsert_key: currentKey,
      customer_change_previous_time: previousTime,
      customer_change_current_time: currentTime,
      customer_change_diff_json: isSelected ? changes : [],
      customer_change_admin_footer: isSelected ? footerHtml : '',
      customer_change_admin_footer_text: isSelected ? footerText : '',
      customer_change_source_trace: isSelected ? changes.map(x => ({
        field: x.field,
        source_field: x.source_field,
        source_line_no: x.source_line_no,
        source_line: x.source_line,
        changed_at: x.changed_at
      })) : [],
      history_bucket: group.length > 1
        ? (isSelected ? (changes.length ? 'CURRENT_CHANGED_BILL' : 'CURRENT_ORDER_CYCLE_WINNER') : 'CHANGED_ORDER_HISTORY')
        : (changes.length ? 'CURRENT_CHANGED_BILL' : ''),
      history_route_required: group.length > 1 && !isSelected,
      is_current_candidate: isSelected,
      superseded_by_upsert_key: isOld ? currentKey : (entry.json.superseded_by_upsert_key || ''),
      customer_change_route_hint: group.length > 1
        ? (isSelected ? (currentProductMissing ? 'CURRENT_CHANGED_BILL_REVIEW' : 'CURRENT_BILL_SEND_CANDIDATE') : 'HISTORY_ROUTING')
        : (changes.length
          ? (isSelected ? (currentProductMissing ? 'CURRENT_CHANGED_BILL_REVIEW' : 'CURRENT_BILL_SEND_CANDIDATE') : 'HISTORY_ROUTING')
          : 'NO_CHANGE'),
      customer_change_footer_route_decision: footerRouteDecisionFor(isSelected),
      customer_change_footer_order_time_source: 'order_time_display',

      // Switch contract:
      // - มีการเปลี่ยนจริง: ใบล่าสุด = 🟨, ใบเก่า = 🟠
      // - ไม่มีการเปลี่ยน: ไม่เขียนทับ route เดิมจากโหนดข้างหน้า
      // ห้ามปั้ม ⚪ จาก Footer
      ...(hasChange
        ? { bb_express_send_route: isSelected ? '🟨' : '🟠' }
        : {}),

      // ป้ายบิลใหม่/บิลเก่า สำหรับหน้าเว็บ
      sniper_bill_type: isSelected ? newBillSniperType : oldBillSniperType,
      sniper_badge: isSelected ? newBillSniperBadge : oldBillSniperBadge,
      sniper_change_color: isSelected
        ? newBillSniperBadge.split(' ')[0]
        : (isOld ? '🟠' : ''),
      sniper_change_reason: isSelected
        ? newBillSniperReason
        : (hasChange ? 'ใบเก่าถูกแทนที่ด้วยบิลใหม่' : 'ไม่พบการเปลี่ยนแปลง'),
      sniper_is_new_bill: isSelected ? 'true' : 'false',
      sniper_is_old_bill: isSelected ? 'false' : 'true',
      sniper_change_detected: hasChange ? 'true' : 'false',
      sniper_change_field_count: String(changes.length),
      sniper_change_fields: isSelected
        ? changes.map(change => change.field.toUpperCase()).join(',')
        : '',

      // เก็บสีระบบ 7 วันเดิมแยกไว้ ไม่ทับค่าเดิม
      routing_tag_before_change: first(selected.json, ['routing_tag']),
      status_color_before_change: first(selected.json, ['status_color']),
      routing_tag_backup_before_change: first(selected.json, ['routing_tag_backup']) || '⚪ White',
      status_color_backup_before_change: first(selected.json, ['status_color_backup']) || '⚪ White'
    };

    if (isSelected && currentProductMissing) {
      base.target_room = 'ATHENA_HOLD_REVIEW';
      base.switch3_route_status = 'REVIEW';
      base.send_eligible = 'false';
      base.telegram_bill_send_eligible = 'false';
      base.telegram_send_blocked = 'true';
      base.telegram_block_reason = 'บิลล่าสุดระบุว่ามีการเปลี่ยนสินค้า แต่ไม่พบชื่อสินค้าจริงที่เชื่อถือได้';
      base.is_ready_to_pack = 'false';
    }

    if (group.length > 1 && !isSelected) {
      base.sniper_bill_type = 'SUPERSEDED_OLD_BILL';
      base.sniper_badge = '🟠 SUPERSEDED_OLD_BILL';
      base.sniper_change_color = '🟠';
      base.sniper_change_reason = 'ใบเก่าถูกแทนที่ด้วยบิลใหม่';
      base.routing_tag_old_bill = first(entry.json, ['routing_tag']);
      base.status_color_old_bill = first(entry.json, ['status_color']);
      base.routing_tag_backup_old_bill = first(entry.json, ['routing_tag_backup']) || '⚪ White';
      base.status_color_backup_old_bill = first(entry.json, ['status_color_backup']) || '⚪ White';

      // Old bill: preserve the row, but only archive it; never resend it as current.
      base.target_room = 'CHRONOS_TARTARUS';
      base.switch3_route_status = 'HISTORY_ROUTING';
      base.send_eligible = 'false';
      base.telegram_bill_send_eligible = 'false';
      base.telegram_send_blocked = 'true';
      base.telegram_block_reason = 'บิลเก่าถูกแทนด้วยบิลล่าสุด; เก็บ CHRONOS history เท่านั้น';
      base.is_ready_to_pack = 'false';
    }

    // ฟิลด์สำหรับบิลใหม่ที่ส่งห้องแพ็ก และบิลเก่าที่ส่งห้องเช็ก/ประวัติ
    if (isSelected && changes.length) {
      base.sniper_bill_type = newBillSniperType;
      base.sniper_badge = newBillSniperBadge;
      base.sniper_change_color = newBillSniperBadge.split(' ')[0];
      base.sniper_change_reason = newBillSniperReason;
      base.routing_tag_new_bill = first(entry.json, ['routing_tag']);
      base.status_color_new_bill = first(entry.json, ['status_color']);
      base.routing_tag_backup_new_bill = first(entry.json, ['routing_tag_backup']) || '⚪ White';
      base.status_color_backup_new_bill = first(entry.json, ['status_color_backup']) || '⚪ White';
    }

    // เติมท้ายข้อความเฉพาะแถวปัจจุบัน และไม่เขียนทับข้อความต้นฉบับ
    if (isSelected && changes.length) {
      const baseMessage = first(entry.json, ['telegram_message_for_send', 'telegram_body', 'telegram_copy_text', 'telegram_message']);
      base.telegram_message_for_send_original = baseMessage;
      base.telegram_message_for_send_final = baseMessage
        ? `${baseMessage}\n${footerHtml}`
        : footerHtml;
      base.telegram_message_with_change_audit = base.telegram_message_for_send_final;
      base.telegram_copy_text_with_change_audit = `${first(entry.json, ['telegram_copy_text', 'telegram_message_for_send', 'telegram_body'])}${footerText}`;
    }

    annotations.set(entry.index, base);
  }
}

return rows.map(({ index, json }) => ({
  json: { ...json, ...(annotations.get(index) || {}) }
}));
