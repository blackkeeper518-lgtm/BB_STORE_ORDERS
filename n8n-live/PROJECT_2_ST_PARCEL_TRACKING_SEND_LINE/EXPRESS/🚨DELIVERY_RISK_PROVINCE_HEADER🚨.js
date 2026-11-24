// ============================================================================
// 🚨 DELIVERY RISK PROVINCE HEADER GATE V2 — CANONICAL ONLY
// n8n Code node — Run Once for All Items
//
// แก้ปัญหา bot recap หลุดมาเป็นที่อยู่:
// - ไม่สแกน original / telegram_message / chat_timeline เป็นที่อยู่หลัก
// - ใช้เฉพาะฟิวด์ที่โหนดก่อนหน้าคัดแล้ว
// - ตัดข้อความบอท/ร้านออกจากหลักฐาน
// - ถ้าจังหวัดกับรหัสไปรษณีย์ขัดกัน ให้ REVIEW ห้ามเดา
// - ไม่ลบแถว และเก็บหัวบิลเดิมไว้เสมอ
// ============================================================================

const RESTRICTED_AREAS = [
  ['นครราชสีมา', '30000'], ['บุรีรัมย์', '31000'], ['สุรินทร์', '32000'],
  ['ศรีสะเกษ', '33000'], ['อุบลราชธานี', '34000'], ['ยโสธร', '35000'],
  ['ชัยภูมิ', '36000'], ['อำนาจเจริญ', '37000'], ['บึงกาฬ', '38000'],
  ['หนองบัวลำภู', '39000'], ['ขอนแก่น', '40000'], ['อุดรธานี', '41000'],
  ['เลย', '42000'], ['หนองคาย', '43000'], ['มหาสารคาม', '44000'],
  ['ร้อยเอ็ด', '45000'], ['กาฬสินธุ์', '46000'], ['สกลนคร', '47000'],
  ['นครพนม', '48000'], ['มุกดาหาร', '49000'],
].map(([province, postcode]) => ({ province, postcode, prefix: postcode.slice(0, 2) }));

const BILL_HEADER_KEYS = [
  'bill_header', 'bill_header_saved', 'telegramHeader', 'telegram_header',
  'stock_notice', 'product_master_stock_notice', 'header',
];

// เฉพาะชื่อฟิวด์ที่ถือว่าเป็นผลคัดที่อยู่แล้ว ห้ามเติม original/message/chat_timeline ที่นี่
const CANONICAL_DESTINATION_KEYS = new Set([
  'address_fibo_selected_clean', 'address_display_packer', 'addressclean',
  'clean_address', 'rescue_address_normalized', 'final_address_for_bill',
  'full_address', 'telegram_primary_address', 'shipping_address',
  'delivery_address', 'recipient_address', 'address', 'province',
  'province_name', 'shipping_province', 'delivery_province',
  'postcode', 'postal_code', 'zip', 'zipcode', 'shipping_postcode',
  'delivery_postcode', 'รหัสไปรษณีย์', 'จังหวัด',
]);

const SHIPPING_PATH_HINT = /shipping|ship_to|delivery|deliver_to|recipient|receiver|consignee|destination|ปลายทาง|จัดส่ง|ผู้รับ/iu;
const BILLING_HINT = /billing|invoice|bill_to|ใบกำกับ|ที่อยู่ใบเสร็จ|ที่อยู่ออกบิล/iu;
const POSTCODE_KEY = /postcode|postal|zip|รหัสไปรษณีย์/iu;
const PROVINCE_KEY = /province|จังหวัด/iu;
const ORDER_REFERENCE_KEYS = [
  'order_number', 'order_no', 'order_id', 'upsert_key',
  'chat_link_key', 'invoice_number', 'tracking_number', 'id',
];

// ถ้าพบวลีเหล่านี้ในค่าที่อยู่ ให้ถือเป็นข้อความทวน/ข้อความหลังการขาย ไม่ใช่ address evidence
const BOT_RECAP_RE = /(?:เชื่อมต่อ.{0,80}ทีม|ได้เชื่อมต่อพี่กับทีม|ส่งต่อออเดอร์ให้ทีม|ทีมจะ(?:ช่วย|ตรวจ|จัดส่ง|แจ้ง|ดูแล)|ทีมจะรีบจัดส่ง|อัปเดตเลขพัสดุ|ขอเลขพัสดุ|เช็คพัสดุ|เช็กพัสดุ|tracking|หน้าเช็คพัสดุ|รบกวนถ่าย(?:คลิป|วิดีโอ)|แกะเช็คของก่อนจ่าย|ไม่ต้องโอนก่อน|มีอะไรให้หนูช่วยเพิ่ม)/iu;

function text(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch (_) { return String(value); }
  }
  return String(value).normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\\n/g, '\n').trim();
}
function compact(value) { return text(value).replace(/\s+/g, ' ').trim(); }
function normalizeText(value) {
  return text(value).replace(/\s+/g, '').replace(/^จังหวัด/iu, '').replace(/^จ\./iu, '');
}
function firstExisting(row, keys) {
  for (const key of keys) {
    const value = text(row?.[key]);
    if (value) return value;
  }
  return '';
}
function isBotRecap(value) { return BOT_RECAP_RE.test(compact(value)); }
function keyName(path) { return String(path[path.length - 1] || '').toLowerCase(); }

function collectCanonicalFields(value, path = [], out = [], depth = 0) {
  if (value === null || value === undefined || depth > 5) return out;
  if (typeof value === 'string' || typeof value === 'number') {
    const fieldKey = keyName(path);
    const pathText = path.join('.');
    const fieldText = text(value);
    if (!fieldText || !CANONICAL_DESTINATION_KEYS.has(fieldKey)) return out;
    if (BILLING_HINT.test(pathText)) return out;
    out.push({
      path: pathText,
      key: fieldKey,
      text: fieldText,
      shipping: SHIPPING_PATH_HINT.test(pathText) || fieldKey.includes('address') || fieldKey.includes('province') || fieldKey.includes('post'),
      botRecap: isBotRecap(fieldText),
    });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectCanonicalFields(entry, [...path, String(index)], out, depth + 1));
    return out;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectCanonicalFields(child, [...path, key], out, depth + 1);
    }
  }
  return out;
}

function collectPostcodes(fields) {
  const values = [];
  for (const field of fields) {
    const direct = POSTCODE_KEY.test(field.path) || /address|จัดส่ง|ปลายทาง/iu.test(field.path);
    if (!direct) continue;
    for (const match of field.text.matchAll(/(?:^|\D)(\d{5})(?!\d)/g)) values.push(match[1]);
  }
  return [...new Set(values)];
}

function findOrderReference(json) {
  const wanted = new Set(ORDER_REFERENCE_KEYS.map((key) => key.toLowerCase()));
  const queue = [{ value: json, depth: 0 }];
  while (queue.length) {
    const { value, depth } = queue.shift();
    if (!value || typeof value !== 'object' || depth > 5) continue;
    for (const [key, child] of Object.entries(value)) {
      if (wanted.has(key.toLowerCase()) && (typeof child === 'string' || typeof child === 'number') && text(child)) {
        return text(child).replace(/[\r\n\t]+/g, ' ').slice(0, 100);
      }
      if (child && typeof child === 'object') queue.push({ value: child, depth: depth + 1 });
    }
  }
  return 'ไม่พบเลขอ้างอิง';
}

function inspectDestination(json) {
  const all = collectCanonicalFields(json);
  const usable = all.filter((field) => !field.botRecap);
  const botRejected = all.filter((field) => field.botRecap);

  // ถ้ามี shipping-labelled fields ให้เชื่อเฉพาะชุดนั้นก่อน
  const shipping = usable.filter((field) => field.shipping);
  const fields = shipping.length ? shipping : usable;
  const normalizedAddress = fields.map((field) => normalizeText(field.text)).join('|');

  const provinceMatches = RESTRICTED_AREAS.filter((area) => normalizedAddress.includes(normalizeText(area.province)));
  const postcodes = collectPostcodes(fields);
  const postcodeMatches = RESTRICTED_AREAS.filter((area) => postcodes.some((postcode) => postcode.startsWith(area.prefix)));
  const provinceArea = provinceMatches[0] || null;
  const postcodeArea = postcodeMatches[0] || null;

  const conflict = Boolean(
    provinceArea && postcodeArea && provinceArea.province !== postcodeArea.province
  ) || provinceMatches.length > 1 || postcodeMatches.length > 1;

  const explicitProvincePresent = fields.some((field) => PROVINCE_KEY.test(field.path) && text(field.text));
  const destinationEvidence = fields.length > 0;
  const enoughToDecide = Boolean(provinceArea || postcodeArea || postcodes.length || explicitProvincePresent);

  return {
    allFields: all,
    fields,
    botRejected,
    area: conflict ? null : (provinceArea || postcodeArea),
    provinceArea,
    postcodeArea,
    matchedBy: conflict
      ? 'conflict'
      : provinceArea && postcodeArea && provinceArea.province === postcodeArea.province
        ? 'province_and_postcode'
        : provinceArea
          ? 'province'
          : postcodeArea
            ? 'postcode_prefix'
            : '',
    postcodes,
    conflict,
    destinationEvidence,
    enoughToDecide,
  };
}

function originalHeader(row) { return firstExisting(row, BILL_HEADER_KEYS); }

function buildRiskHeader({ status, province, postcodeText, orderReference, matchedBy, conflict }) {
  if (status === 'BLOCK') {
    return [
      '🚨 RISK DESTINATION ALERT 🚨',
      '━━━━━━━━━━━━━━━━━━━━',
      
      '⚠ ปลายทางอยู่ในกลุ่มพื้นที่เสี่ยง ⚠ ',
      ` 🗺 จังหวัด: ${province}`,
      `📮 รหัสไปรษณีย์: ${postcodeText}`,

      '━━━━━━━━━━━━━━━━━━━━',
  '🚧 กรุณาตรวจสอบก่อนแพ็ก/ส่ง',
    ].join('\n');
  }
  if (status === 'REVIEW') {
    return [
      conflict ? '🧩 ADDRESS EVIDENCE CONFLICT 🧩' : '⚠️ DESTINATION REVIEW REQUIRED ⚠️',
      '━━━━━━━━━━━━━━━━━━━━',
      conflict ? 'พบจังหวัดกับรหัสไปรษณีย์ไม่ตรงกัน หรือพบหลายหลักฐาน' : 'ยังยืนยันจังหวัดปลายทางจากฟิวด์คัดแล้วไม่ได้',
      '🔍 ไม่ใช้ข้อความบอททวนมาตัดสินอัตโนมัติ กรุณาตรวจที่อยู่จริง',
      '━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');
  }
  return '';
}

function applyHeaderOverride(json, riskHeader, original) {
  if (!riskHeader) {
    return { ...json, risk_header_override_active: false, risk_header_original: original || '' };
  }
  return {
    ...json,
    risk_header_original: original || '',
    risk_header_override_active: true,
    risk_header_override: riskHeader,
    bill_header: riskHeader,
    bill_header_saved: riskHeader,
    telegramHeader: riskHeader,
    telegram_header: riskHeader,
    stock_notice: riskHeader,
    original_bill_header: original || '',
    original_stock_notice: text(json.stock_notice),
    original_product_master_stock_notice: text(json.product_master_stock_notice),
  };
}

return $input.all().map((item, index) => {
  const json = item?.json || {};
  const destination = inspectDestination(json);
  const status = destination.conflict
    ? 'REVIEW'
    : destination.area
      ? 'BLOCK'
      : destination.enoughToDecide
        ? 'ALLOW'
        : 'REVIEW';

  const orderReference = findOrderReference(json);
  const province = destination.area?.province || 'ยังระบุจังหวัดไม่ได้';
  const postcodeText = destination.postcodes.length ? destination.postcodes.join(', ') : 'ไม่พบ';
  const riskHeader = buildRiskHeader({
    status,
    province,
    postcodeText,
    orderReference,
    matchedBy: destination.matchedBy,
    conflict: destination.conflict,
  });
  const outputJson = applyHeaderOverride(json, riskHeader, originalHeader(json));

  return {
    json: {
      ...outputJson,
      _delivery_gate: {
        status,
        restricted: status === 'BLOCK',
        review: status === 'REVIEW',
        province: destination.area?.province || null,
        matchedBy: destination.matchedBy || null,
        postcodes: destination.postcodes,
        orderReference,
        destinationEvidence: destination.destinationEvidence,
        enoughToDecide: destination.enoughToDecide,
        conflict: destination.conflict,
        canonicalFieldPaths: destination.fields.map((field) => field.path),
        botFieldsRejected: destination.botRejected.map((field) => field.path),
        riskHeaderActive: Boolean(riskHeader),
        telegramWarning: riskHeader,
      },
      delivery_risk_status: status,
      delivery_risk_province: destination.area?.province || '',
      delivery_risk_matched_by: destination.matchedBy || '',
      delivery_risk_postcodes: destination.postcodes,
      delivery_risk_header: riskHeader,
      delivery_risk_header_active: Boolean(riskHeader),
      delivery_risk_order_reference: orderReference,
      delivery_risk_conflict: destination.conflict,
      delivery_risk_canonical_fields: destination.fields.map((field) => field.path),
      delivery_risk_bot_fields_rejected: destination.botRejected.map((field) => field.path),
    },
    ...(item.binary ? { binary: item.binary } : {}),
    pairedItem: { item: index },
  };
});
