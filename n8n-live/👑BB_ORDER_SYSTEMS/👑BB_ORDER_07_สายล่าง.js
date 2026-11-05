// ============================================================
// PRE-SAVE CHANGE AUDIT1 — CLEAN FULL REPLACEMENT
// n8n Code node — Run Once for All Items
// วางก่อนโหนดบันทึกข้อมูล
//
// หน้าที่:
// - ตรวจกลุ่มตาม threadId และรักษาทุกแถวเป็นหลักฐาน
// - ตรวจคู่จริงจากที่อยู่ + สินค้า
// - ใช้ winner จากโหนดโฟร์หลัก ถ้ามี
// - เปรียบเทียบสินค้า/ที่อยู่/เบอร์/ชื่อ/COD ระหว่างใบก่อนหน้าและใบปัจจุบัน
// - สร้างฟิลด์ audit สำหรับหน้าเว็บ
// - ไม่ลบแถว และไม่ทับ switch3_route, target_room หรือ four1_decision
// - ไม่อ่าน chat_timeline เพื่อประกอบที่อยู่หรือเบอร์
// ============================================================

const inputItems = $input.all();
const rows = inputItems.map((item, index) => ({
  index,
  json: item?.json || {},
}));

function text(v) {
  return String(v ?? '').normalize('NFKC').replace(/\\n/g, '\n').trim();
}
function compact(v) {
  return text(v).replace(/\s+/g, ' ').trim();
}
function first(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && compact(v) !== '') return text(v);
  }
  return '';
}
function boolText(v) {
  return v === true || String(v).toLowerCase() === 'true';
}
function groupSize(row) {
  const n = Number(row.four1_group_size ?? row.group_count ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function groupKey(row, index) {
  const threadId = first(row, ['threadId', 'thread_id']);
  if (threadId) return `THREAD|${threadId}`;
  return `NO_THREAD|${first(row, ['upsert_key', 'order_number']) || `ROW|${index}`}`;
}
function parseTime(v) {
  const s = compact(v);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/u);
  if (!m) return 0;
  let year = Number(m[3]);
  if (year < 100) year += 1957; // 69 => 2026 (พ.ศ. 2569)
  else if (year >= 2400) year -= 543; // พ.ศ. => ค.ศ.
  const stamp = Date.UTC(year, Number(m[2]) - 1, Number(m[1]), Number(m[4]) - 7, Number(m[5]), Number(m[6] || 0));
  return Number.isFinite(stamp) ? stamp : 0;
}
function normalized(v, kind) {
  let s = compact(v).toLowerCase();
  if (kind === 'phone') return s.replace(/\D/g, '');
  s = s.normalize('NFKC');
  if (kind === 'address') {
    s = s.replace(/ตำบล|ตําบล/g, 'ต').replace(/อำเภอ|อําเภอ/g, 'อ').replace(/จังหวัด/g, 'จ');
  }
  return s.replace(/[^\p{L}\p{N}]/gu, '');
}

// วลีที่บอกว่า rescue_product_raw ไม่ใช่ชื่อสินค้า แต่เป็นข้อความขอให้ลูกค้าตอบ/ข้อความหลังส่ง
function isBotPromptOrPostSale(row) {
  const p = compact(row.rescue_product_raw);
  const a = compact(row.rescue_address);
  const productFields = [
    row.order_fibo_product, row.trusted_product, row.rescue_product_normalized,
    row.final_product, row.final_display_for_packer, row.display_for_packer,
    row.for_packer_st_display, row.packer_tag_display, row.telegram_product_display,
    row.sku, row.telegram_selected_product
  ].map(compact).filter(Boolean);
  const addressFields = [
    row.address_fibo_selected_clean, row.rescue_address_normalized, row.rescue_address,
    row.rescue_address_raw, row.telegram_primary_address, row.final_address_for_bill,
    row.address_display_packer, row.addressclean, row.full_address
  ].map(compact).filter(Boolean);
  const pIsPrompt = /(?:พี่ขา|พี่คะ)?.{0,40}(?:ช่วยพิมพ์|พิมพ์).{0,50}ยืนยัน(?:ออเดอร์|ยอด)?.{0,100}(?:ล็อกคิว|คิวแพ็ค|แพ็คส่ง|ส่งด่วน)/iu.test(p)
    || /ยืนยันยอดนี้.{0,80}(?:พิมพ์|ล็อกคิว|จัดส่ง)/iu.test(p)
    || /(?:ทีมจะติดต่อและจัดส่ง|ทีมจะจัดส่งตามที่อยู่|อัปเดตเพิ่มเติมทีมจะแจ้ง|ช(?:ำ|ํา)ระเงินแบบเก็บปลายทาง|ไม่ต้องโอนก่อน|แกะเช(?:็|้)คของก่อนจ่าย|ทีมจะรีบจัดส่ง|รอรับสายขนส่ง|ถ่ายวิดีโอ.{0,30}แกะกล่อง|มีอะไรให้หนูช่วยเพิ่ม|ส่งรายละเอียดออเดอร์.{0,40}ทีมจัดส่ง|ส่งต่อออเดอร์ให้ทีม)/iu.test(p);
  const botProductField = productFields.some(s => /(?:ช(?:ำ|ํา)ระเงินแบบเก็บปลายทาง|ไม่ต้องโอนก่อน|แกะเช(?:็|้)คของก่อนจ่าย|ทีมจะรีบจัดส่ง|ทีมจะติดต่อและจัดส่ง|ทีมจะดูแลการจัดส่ง|รอรับสายขนส่ง|ถ่ายวิดีโอ.{0,30}แกะกล่อง|มีอะไรให้หนูช่วยเพิ่ม|ส่งรายละเอียดออเดอร์.{0,40}ทีมจัดส่ง|ส่งต่อออเดอร์ให้ทีม|ขอเลขพัสดุ|เช็คเลขพัสดุ)/iu.test(s)
    && !/(?:x|×|จำนวน)\s*\d+|\d+(?:\.\d+)?\s*(?:คอต|หีบ|กล่อง|ชิ้น|ซอง|แพ็ค|แพ็ก)/iu.test(s));
  const addressBotTextRe = /(?:เชื่อมต่อ.{0,40}ทีม.{0,20}(?:แล้ว|เรียบร้อย)|ได้เชื่อมต่อพี่กับทีม|ส่งรายละเอียดออเดอร์.{0,40}ทีมจัดส่งเรียบร้อย|ทีมจะรีบจัดส่ง|ทีมจะติดต่อและจัดส่ง|ทีมจะจัดส่ง(?:ตามที่อยู่|ผ่าน)|ทีมจะดูแลจัดส่ง|รอรับสายขนส่ง|ถ่ายวิดีโอ.{0,30}แกะกล่อง|มีอะไรให้หนูช่วยเพิ่ม|ช(?:ำ|ํา)ระเงินแบบเก็บปลายทาง|ไม่ต้องโอนก่อน|แกะเช(?:็|้)ค(?:ของ)?ก่อนจ่าย|(?:ยืนยันออเดอร์|ยอดรวม\s*COD).{0,140}(?:ที่อยู่|จัดส่งที่|เบอร์|FLASH EXPRESS))/iu;
  const addressIsNarrative = addressBotTextRe.test(a) || addressFields.some(s => addressBotTextRe.test(s));
  return pIsPrompt || botProductField || addressIsNarrative;
}

function addressValue(row) {
  const fields = ['address_fibo_selected_clean', 'rescue_address_normalized', 'rescue_address', 'rescue_address_raw', 'telegram_primary_address', 'clean_address', 'full_address', 'final_address_for_bill', 'address_display_packer', 'addressclean'];
  for (const field of fields) {
    const candidate = first(row, [field]);
    if (isRealAddress(candidate)) return candidate;
  }
  return '';
}
function productValue(row) {
  return productDisplayValue(row) || first(row, ['rescue_product_normalized', 'clean_product', 'rescue_product_raw']);
}

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

function isRealAddress(v) {
  const s = compact(v);
  return s.length >= 10
    && !/(?:DATA_MISSING|ไม่พบข้อมูล|ยังไม่มีที่อยู่)/iu.test(s)
    && !/(?:เชื่อมต่อ.{0,40}ทีม.{0,20}(?:แล้ว|เรียบร้อย)|ได้เชื่อมต่อพี่กับทีม|ส่งรายละเอียดออเดอร์.{0,40}ทีมจัดส่งเรียบร้อย|ทีมจะรีบจัดส่ง|ทีมจะติดต่อและจัดส่ง|ทีมจะจัดส่ง(?:ตามที่อยู่|ผ่าน)|ทีมจะดูแลจัดส่ง|รอรับสายขนส่ง|ถ่ายวิดีโอ.{0,30}แกะกล่อง|มีอะไรให้หนูช่วยเพิ่ม|ช(?:ำ|ํา)ระเงินแบบเก็บปลายทาง|ไม่ต้องโอนก่อน|แกะเช(?:็|้)ค(?:ของ)?ก่อนจ่าย|(?:ยืนยันออเดอร์|ยอดรวม\s*COD).{0,140}(?:ที่อยู่|จัดส่งที่|เบอร์|FLASH EXPRESS))/iu.test(s);
}
function isRealProduct(row, value) {
  const s = compact(value);
  if (!s || isBotPromptOrPostSale(row)) return false;
  if (/(?:พิมพ์.{0,20}ยืนยัน|ยืนยันยอดนี้|ล็อกคิว|ทีมจะติดต่อ|ทีมจะจัดส่ง|ขอเลขพัสดุ|เช็คเลขพัสดุ|ช(?:ำ|ํา)ระเงินแบบเก็บปลายทาง|ไม่ต้องโอนก่อน|แกะเช(?:็|้)คของก่อนจ่าย|ทีมจะรีบจัดส่ง|รอรับสายขนส่ง|ถ่ายวิดีโอ.{0,30}แกะกล่อง|มีอะไรให้หนูช่วยเพิ่ม|ส่งต่อออเดอร์ให้ทีม)/iu.test(s)
    && !/(?:x|×|จำนวน)\s*\d+|\d+(?:\.\d+)?\s*(?:คอต|หีบ|กล่อง|ชิ้น|ซอง|แพ็ค|แพ็ก)/iu.test(s)) return false;
  // ต้องมีชื่อสินค้าและปริมาณ/หน่วย หรือเป็นค่าที่ผ่านการจัดรูปจาก trusted/final product แล้ว
  const hasQty = /\d+(?:\.\d+)?\s*(?:คอต|หีบ|กล่อง|ชิ้น|ซอง|แพ็ค|แพ็ก)?/iu.test(s)
    || /(?:x|×|จำนวน)\s*\d+/iu.test(s);
  return hasQty && /\p{L}/u.test(s);
}
function phoneValue(row) {
  // ยึดค่าที่โหนดแรกเลือกแล้วก่อน ไม่ให้ clean/rescue เก่ามาแย่งค่า
  return first(row, ['phone', 'extracted_phone', 'clean_phone', 'rescue_phone', 'phone_number']);
}
function nameValue(row) {
  // 🎯 ปรับปรุง: ค้นหาและคัดกรองชื่อ ให้ความสำคัญกับชื่อภาษาไทยก่อนเสมอ ป้องกันชื่อเฟสภาษาอังกฤษมาทับชื่อจริง
  const candidates = [
    row?.customer_name,
    row?.recipient_name,
    row?.name,
    row?.customer_name_current
  ].map(text).filter(Boolean);

  // เลือกชื่อที่มีตัวอักษรภาษาไทยก่อน (ถ้ามี)
  const thaiName = candidates.find(n => /[ก-ฮ]/u.test(n));
  if (thaiName) return thaiName;

  return candidates[0] || '';
}
function codValue(row) {
  return first(row, ['cod_amount', 'cod_amount', 'expected_cod', 'cod_value', 'customer_cod_current']);
}
function telegramSentAt(row) {
  const direct = first(row, ['telegram_sent_at', 'telegram_sent_time', 'last_telegram_sent_at']);
  if (direct) return direct;
  for (const key of ['telegram_customer_change_block', 'telegram_message_with_customer_change', 'telegram_message']) {
    const source = text(row?.[key]);
    const match = source.match(/(?:ใบเดิมถูกส่ง Telegram แล้ว|ส่ง Telegram แล้ว)\s*(?:→|->)\s*⌚?\s*([0-2]?\d:[0-5]\d(?::[0-5]\d)?)/iu);
    if (match) return match[1];
  }
  return '';
}
function numericAmount(value) {
  const match = compact(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0]);
  return Number.isFinite(amount) ? amount : null;
}
function formatAmount(value) {
  const amount = numericAmount(value);
  return amount === null
    ? compact(value)
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount);
}
function isRealCandidate(row) {
  const address = addressValue(row);
  const product = productValue(row);
  return !isBotPromptOrPostSale(row) && isRealAddress(address) && isRealProduct(row, product);
}
function isMainWinner(row) {
  return boolText(row.four1_winner)
    || row.four1_decision === 'WINNER_READY'
    || row.duplicate_role === 'SELECTED_CANDIDATE';
}

// ============================================================
// PRE-SAVE WINNER + PAIR AUDIT
// Source of truth: threadId + order_time_display; upstream winner is respected
// PRE-SAVE emits selection/audit metadata only; it never writes final bill route.
// ============================================================

function reviewGroup(group, key, declaredSize, candidates, reason, code) {
  for (const entry of group) {
    annotations.set(entry.index, {
      pre_save_change_status: code || 'REVIEW_AMBIGUOUS_GROUP',
      pre_save_change_reason: reason,
      pre_save_change_group_key: key,
      pre_save_change_group_size: String(declaredSize),
      pre_save_change_pair_candidate_count: String(candidates.length),
      pre_save_change_is_pair: declaredSize > 1 || group.length > 1 ? 'true' : 'false',
      pre_save_change_selected: 'false',
      pre_save_change_winner_key: '',
      pre_save_change_score: '0',
      pre_save_change_fields: '',
      pre_save_change_route_hint: 'ATHENA_HOLD_REVIEW',
      pre_save_change_selection_source: 'REVIEW_REQUIRED',
      pre_save_change_review_required: 'true',
      order_time_source: 'order_time_display',
    });
  }
}

const groups = new Map();
for (const entry of rows) {
  const key = groupKey(entry.json, entry.index);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(entry);
}

const annotations = new Map();

for (const [key, group] of groups.entries()) {
  const declaredSize = Math.max(group.length, ...group.map(x => groupSize(x.json)));
  const candidates = group.filter(x => isRealCandidate(x.json));

  // One-row, truly single order: preserve the upstream decision; do not stamp a color.
  if (group.length === 1 && declaredSize === 1) {
    const entry = group[0];
    annotations.set(entry.index, {
      pre_save_change_status: 'SINGLE_PASS_THROUGH',
      pre_save_change_reason: 'กลุ่มมีใบเดียว; คงผลตัดสินจากโหนดหลัก',
      pre_save_change_group_key: key,
      pre_save_change_group_size: '1',
      pre_save_change_pair_candidate_count: String(candidates.length),
      pre_save_change_is_pair: 'false',
      pre_save_change_selected: 'true',
      pre_save_change_winner_key: first(entry.json, ['upsert_key', 'order_number', 'id']),
      pre_save_change_score: '0',
      pre_save_change_fields: '',
      pre_save_change_route_hint: 'SINGLE_PASS_THROUGH',
      pre_save_change_selection_source: 'SINGLE_ORDER',
      pre_save_change_review_required: 'false',
      order_time_source: 'order_time_display',
    });
    continue;
  }

  // A multi-row/declared pair must contain at least two genuine order candidates.
  if (candidates.length < 2) {
    reviewGroup(
      group, key, declaredSize, candidates,
      `กลุ่มมี ${declaredSize} รายการ แต่พบแถวที่มีทั้งสินค้าและที่อยู่ที่เชื่อถือได้เพียง ${candidates.length}; ไม่เลือก winner โดยเดา`,
      'REVIEW_NO_TRUE_PAIR'
    );
    continue;
  }

  const markedInGroup = group.filter(entry => isMainWinner(entry.json));
  const markedCandidates = markedInGroup.filter(entry => candidates.some(c => c.index === entry.index));
  if (markedInGroup.length > 1) {
    reviewGroup(group, key, declaredSize, candidates,
      `พบ upstream winner ${markedInGroup.length} แถวในกลุ่มเดียว; ต้องเหลือ winner ได้หนึ่งแถวเท่านั้น`,
      'REVIEW_MULTIPLE_UPSTREAM_WINNERS');
    continue;
  }
  if (markedInGroup.length === 1 && markedCandidates.length !== 1) {
    reviewGroup(group, key, declaredSize, candidates,
      'แถวที่ upstream ระบุเป็น winner ไม่มีทั้งข้อมูลสินค้าและที่อยู่ที่ผ่านเกณฑ์; ห้ามเลือกแถวอื่นแทนเงียบ ๆ',
      'REVIEW_UPSTREAM_WINNER_NOT_VALID_CANDIDATE');
    continue;
  }

  const candidateTimes = candidates.map(entry => ({ entry, ms: parseTime(entry.json.order_time_display) }));
  const hasUniqueUpstreamWinner = markedCandidates.length === 1;
  if (!hasUniqueUpstreamWinner && candidateTimes.some(x => !Number.isFinite(x.ms) || x.ms <= 0)) {
    reviewGroup(group, key, declaredSize, candidates,
      'มี candidate ที่เวลา order_time_display หายหรืออ่านไม่ได้ และไม่มี upstream winner เพียงหนึ่งเดียว; ส่งตรวจแทนการเดา',
      'REVIEW_MISSING_ORDER_TIME');
    continue;
  }

  candidateTimes.sort((a, b) => {
    const timeDiff = (Number.isFinite(a.ms) ? a.ms : 0) - (Number.isFinite(b.ms) ? b.ms : 0);
    return timeDiff || a.entry.index - b.entry.index;
  });

  let selected;
  let selectionSource;
  if (hasUniqueUpstreamWinner) {
    selected = markedCandidates[0];
    selectionSource = 'UPSTREAM_FOUR1_WINNER';
  } else {
    const latestMs = candidateTimes[candidateTimes.length - 1].ms;
    const latestCandidates = candidateTimes.filter(x => x.ms === latestMs);
    if (latestCandidates.length !== 1) {
      reviewGroup(group, key, declaredSize, candidates,
        `มี candidate ${latestCandidates.length} แถวที่ใช้ order_time_display ล่าสุดเท่ากัน; ไม่มี upstream winner จึงยังชี้ winner ไม่ได้`,
        'REVIEW_TIED_LATEST_ORDER_TIME');
      continue;
    }
    selected = latestCandidates[0].entry;
    selectionSource = 'LATEST_ORDER_TIME_DISPLAY';
  }

  const selectedTime = parseTime(selected.json.order_time_display);
  const priorRows = candidates
    .filter(x => x.index !== selected.index)
    .filter(x => {
      const candidateTime = parseTime(x.json.order_time_display);
      if (!Number.isFinite(selectedTime) || !Number.isFinite(candidateTime)) return false;
      return candidateTime < selectedTime || (candidateTime === selectedTime && x.index < selected.index);
    })
    .sort((a, b) => parseTime(a.json.order_time_display) - parseTime(b.json.order_time_display) || a.index - b.index);
  const previous = priorRows[priorRows.length - 1] || null;

  const curr = selected.json;
  const prev = previous?.json || {};
  const changes = {
    product: Boolean(previous) && productIdentitySignature(prev) !== productIdentitySignature(curr)
      && Boolean(productIdentitySignature(prev) || productIdentitySignature(curr)),
    color: Boolean(previous) && productColorChanged(prev, curr),
    quantity: Boolean(previous) && productQuantitySignature(prev) !== productQuantitySignature(curr)
      && Boolean(productQuantitySignature(prev) || productQuantitySignature(curr)),
    address: Boolean(previous) && normalized(addressValue(prev), 'address') !== normalized(addressValue(curr), 'address'),
    phone: Boolean(previous) && normalized(phoneValue(prev), 'phone') !== normalized(phoneValue(curr), 'phone'),
    name: Boolean(previous) && normalized(nameValue(prev), 'name') !== normalized(nameValue(curr), 'name'),
    cod: Boolean(previous) && normalized(codValue(prev), 'cod') !== normalized(codValue(curr), 'cod'),
    carrier: Boolean(previous) && normalized(first(prev, ['shipping_carrier', 'rescue_shipping_carrier']), 'text') !== normalized(first(curr, ['shipping_carrier', 'rescue_shipping_carrier']), 'text'),
  };
  const changeCount = Object.values(changes).filter(Boolean).length;
  const changeFields = Object.entries(changes).filter(([, changed]) => changed).map(([field]) => field.toUpperCase());
  const previousOrderTime = previous ? first(prev, ['order_time_display']) : '';
  const currentOrderTime = first(curr, ['order_time_display']);
  const previousKey = previous ? first(prev, ['upsert_key', 'order_number', 'id']) : '';
  const previousTelegramSentTime = previous ? telegramSentAt(prev) : '';
  const previousCod = previous ? codValue(prev) : '';
  const currentCod = codValue(curr);
  const previousAmount = numericAmount(previousCod);
  const currentAmount = numericAmount(currentCod);
  const codDelta = previousAmount !== null && currentAmount !== null ? currentAmount - previousAmount : null;
  const roundedCodDelta = codDelta === null ? null : Math.round(codDelta * 100) / 100;
  const codDeltaText = roundedCodDelta === null
    ? ''
    : `${roundedCodDelta > 0 ? '+' : roundedCodDelta < 0 ? '-' : ''}${formatAmount(Math.abs(roundedCodDelta))}`;
  const changeSummaryParts = [];

  if (changeCount > 0) {
    changeSummaryParts.push(changes.product ? '╳╳ [ ลูกค้าเปลี่ยนสินค้า ] ╳╳' : '╳╳ [ ลูกค้าเปลี่ยนข้อมูล ] ╳╳');
    if (previousTelegramSentTime) {
      changeSummaryParts.push(`⚠️ ใบเดิมถูกส่ง Telegram แล้ว → ⌚${previousTelegramSentTime}`);
      changeSummaryParts.push(`⏰ เวลาใบที่เลือก: ${currentOrderTime || 'ไม่พบเวลา'}`);
    } else {
      changeSummaryParts.push(`⏰ เวลาใบก่อน: ${previousOrderTime || 'ไม่พบเวลา'} → ใบที่เลือก: ${currentOrderTime || 'ไม่พบเวลา'}`);
    }
    if (changes.product) changeSummaryParts.push(`📦 สินค้า: ${productValue(prev) || 'ไม่พบสินค้าเดิม'}\n        ↓\n${productValue(curr) || 'ไม่พบสินค้าปัจจุบัน'}`);
    if (changes.color) changeSummaryParts.push(`🎨 สี/รุ่น: ${productColorValue(prev) || 'ไม่ระบุ'} → ${productColorValue(curr) || 'ไม่ระบุ'}`);
    if (changes.quantity) changeSummaryParts.push(`🔢 จำนวน: ${productQuantityValue(prev) || 'ไม่พบจำนวน'} → ${productQuantityValue(curr) || 'ไม่พบจำนวน'}`);
    if (changes.carrier) changeSummaryParts.push(`🚚 ขนส่ง: ${first(prev, ['shipping_carrier', 'rescue_shipping_carrier']) || 'ไม่ระบุ'} → ${first(curr, ['shipping_carrier', 'rescue_shipping_carrier']) || 'ไม่ระบุ'}`);
    if (changes.address) changeSummaryParts.push(`🏠 ที่อยู่: ${addressValue(prev) || 'ไม่พบค่าเดิม'} → ${addressValue(curr) || 'ไม่พบค่าปัจจุบัน'}`);
    if (changes.phone) changeSummaryParts.push(`📞 เบอร์: ${phoneValue(prev) || 'ไม่พบค่าเดิม'} → ${phoneValue(curr) || 'ไม่พบค่าปัจจุบัน'}`);
    if (changes.name) changeSummaryParts.push(`👤 ผู้รับ: ${nameValue(prev) || 'ไม่พบค่าเดิม'} → ${nameValue(curr) || 'ไม่พบค่าปัจจุบัน'}`);
    if (changes.cod) {
      const deltaLabel = codDeltaText === '' ? 'คำนวณส่วนต่างไม่ได้' : `เปลี่ยน ${codDeltaText} บาท`;
      changeSummaryParts.push(`💰 COD ${formatAmount(previousCod) || 'ไม่พบค่าเดิม'} → ${formatAmount(currentCod) || 'ไม่พบค่าปัจจุบัน'} บาท (${deltaLabel})`);
    }
  } else {
    changeSummaryParts.push(previous ? 'ไม่พบการเปลี่ยนแปลงระหว่างใบที่เปรียบเทียบ' : 'เลือก winner จาก upstream; ไม่พบใบก่อนหน้าที่ใช้เปรียบเทียบ');
  }

  const customerChangeSummary = changeSummaryParts.join('\n');
  const winnerKey = first(curr, ['upsert_key', 'order_number', 'id']);

  for (const entry of group) {
    const isSelected = entry.index === selected.index;
    const isPrevious = previous && entry.index === previous.index;
    const base = {
      pre_save_change_status: isSelected ? 'TRUE_PAIR_SELECTED' : 'TRUE_PAIR_HISTORY',
      pre_save_change_reason: isSelected
        ? (changeCount ? `คู่จริง; winner เทียบกับใบก่อนหน้า พบเปลี่ยน: ${changeFields.join(', ')}` : 'คู่จริง; winner ถูกเลือกแล้ว ไม่พบความต่างในฟิลด์ที่เปรียบเทียบ')
        : 'เก็บเป็นประวัติของกลุ่ม; ไม่ใช่ winner ที่เลือก',
      pre_save_change_group_key: key,
      pre_save_change_group_size: String(declaredSize),
      pre_save_change_pair_candidate_count: String(candidates.length),
      pre_save_change_is_pair: 'true',
      pre_save_change_selected: isSelected ? 'true' : 'false',
      pre_save_change_previous: isPrevious ? 'true' : 'false',
      pre_save_change_winner_key: winnerKey,
      pre_save_change_previous_key: previousKey,
      pre_save_change_selected_order_time_display: currentOrderTime,
      pre_save_change_previous_order_time_display: previousOrderTime,
      pre_save_change_selection_source: selectionSource,
      pre_save_change_score: isSelected ? String(changeCount) : '0',
      pre_save_change_fields: isSelected ? changeFields.join(',') : '',
      // PRE-SAVE ไม่ปั๊มสีปลายทาง: BILL BUILDER เป็นผู้ตั้ง route/สิทธิ์ส่ง
      pre_save_change_route_hint: isSelected
        ? (changeCount ? 'LATEST_CHANGED_CANDIDATE' : 'SELECTED_LATEST_CANDIDATE')
        : 'HISTORY_NOT_SELECTED',
      pre_save_change_review_required: 'false',
      order_time_source: 'order_time_display',
    };
    if (isSelected) {
      Object.assign(base, {
        customer_change_detected: changeCount > 0 ? 'true' : 'false',
        customer_change_type: changeFields.length ? changeFields.join('_AND_') + '_CHANGE' : 'NONE',
        customer_change_from_order_time_display: previousOrderTime,
        customer_change_to_order_time_display: currentOrderTime,
        audit_selected_order_time_display: currentOrderTime,
        audit_previous_order_time_display: previousOrderTime,
        audit_order_time_source: 'order_time_display',
        customer_change_summary: customerChangeSummary,
        customer_product_change_detected: changes.product ? 'true' : 'false',
        customer_product_change_label: changes.product ? '📦 สินค้าเปลี่ยน' : '',
        customer_product_previous: previous ? productValue(prev) : '',
        customer_product_current: productValue(curr),
        customer_color_change_detected: changes.color ? 'true' : 'false',
        customer_color_previous: previous ? productColorValue(prev) : '',
        customer_color_current: productColorValue(curr),
        customer_quantity_change_detected: changes.quantity ? 'true' : 'false',
        customer_quantity_previous: previous ? productQuantityValue(prev) : '',
        customer_quantity_current: productQuantityValue(curr),
        customer_carrier_change_detected: changes.carrier ? 'true' : 'false',
        customer_carrier_previous: previous ? first(prev, ['shipping_carrier', 'rescue_shipping_carrier']) : '',
        customer_carrier_current: first(curr, ['shipping_carrier', 'rescue_shipping_carrier']),
        customer_address_change_detected: changes.address ? 'true' : 'false',
        customer_address_change_label: changes.address ? '🏠 ที่อยู่เปลี่ยน' : '',
        customer_address_previous: previous ? addressValue(prev) : '',
        customer_address_current: addressValue(curr),
        customer_phone_change_detected: changes.phone ? 'true' : 'false',
        customer_phone_change_label: changes.phone ? '📞 เบอร์โทรเปลี่ยน' : '',
        customer_phone_previous: previous ? phoneValue(prev) : '',
        customer_phone_current: phoneValue(curr),
        customer_name_change_detected: changes.name ? 'true' : 'false',
        customer_name_change_label: changes.name ? '👤 ชื่อผู้รับเปลี่ยน' : '',
        customer_name_previous: previous ? nameValue(prev) : '',
        customer_name_current: nameValue(curr),
        customer_cod_change_detected: changes.cod ? 'true' : 'false',
        customer_cod_previous: previousCod,
        customer_cod_current: currentCod,
        customer_cod_change_amount: codDeltaText,
      });
    }
    annotations.set(entry.index, base);
  }
}

// Preserve all input rows and their order; PRE-SAVE stamps metadata only.
return rows.map(({ index, json }) => ({
  json: {
    ...json,
    ...(annotations.get(index) || {}),
  },
}));
