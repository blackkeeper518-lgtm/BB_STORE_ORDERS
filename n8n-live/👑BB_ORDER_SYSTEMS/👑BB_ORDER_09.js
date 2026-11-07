// ============================================================
// FOUR2 CLEAN AUDIT + BILL BUILDER (Sanitized Edition)
// เปรียบเทียบครั้งเดียว / สร้างบิลครั้งเดียว / ตัดสินสีครั้งเดียว
// เพิ่มระบบตัดข้อความ Audit ส่วนท้ายทิ้ง ป้องกันการอ่านข้อมูลเก่าปะปน
// ============================================================

const input = $input.all();
const rows = input.map((item, index) => ({ index, json: item?.json || {} }));

function text(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') { try { return JSON.stringify(v); } catch (_) { return String(v); } }
  return String(v).normalize('NFC').trim();
}

// 🎯 ฟังก์ชันตัดตอนข้อความดิบ: ตัดทิ้งทันทีเมื่อเจอโซนประวัติการเปลี่ยนแปลง
function sanitizeRawText(textVal) {
  const s = text(textVal);
  if (!s) return '';
  // ตัดข้อความตั้งแต่เริ่มเจอแถบ MYSTORY_ORDER, CHANGE_AUDIT หรือคำว่า 📌 เปลี่ยน
  const cleaned = s.split(/█▓▒░░|𝖬𝖸𝖲𝖳𝖮𝖱𝖸_𝖮𝖱𝖣𝖤𝖱|⚙️\s*𝖢𝖧𝖠𝖭𝖦𝖤_𝖠𝖴𝖣𝖨𝖳|📌\s*เปลี่ยน/iu)[0];
  return cleaned.trim();
}

function bool(v) { return v === true || /^(true|1|yes)$/i.test(text(v)); }
function firstExisting(row, keys) {
  for (const key of keys) {
    const value = text(row?.[key]);
    if (value) return sanitizeRawText(value);
  }
  return '';
}
function esc(v) {
  return text(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
}

function htmlToPlainText(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function bestAddress(row) {
  return firstExisting(row, [
   'address_display_packer',     // ฟิลด์ผ่านเกณฑ์คัดกรองทำบิลที่ดีที่สุด
  'final_address_for_bill',     // ฟิลด์สำหรับหน้างานแพ็ก
  'rescue_address_normalized',  // ที่อยู่ที่กู้มาและจัดรูปแล้ว
  'addressclean',               // ที่อยู่ที่ผ่านการทำความสะอาดเบื้องต้น
  'full_address'           
  ]).replace(/^📍\s*/u, '').trim();
}

// Non-blocking check of the values that buildBill() actually prints.
// The audit only adds text to the existing balloonnotice field; it never changes routing.
const BILL_AUDIT_MARKER = '⚠️ BILL_AUDIT:';
const RESTRICTED_AREAS = [
  { name: 'นครราชสีมา', prefix: '30' }, { name: 'บุรีรัมย์', prefix: '31' },
  { name: 'สุรินทร์', prefix: '32' }, { name: 'ศรีสะเกษ', prefix: '33' },
  { name: 'อุบลราชธานี', prefix: '34' }, { name: 'ยโสธร', prefix: '35' },
  { name: 'ชัยภูมิ', prefix: '36' }, { name: 'อำนาจเจริญ', prefix: '37' },
  { name: 'บึงกาฬ', prefix: '38' }, { name: 'หนองบัวลำภู', prefix: '39' },
  { name: 'ขอนแก่น', prefix: '40' }, { name: 'อุดรธานี', prefix: '41' },
  { name: 'เลย', prefix: '42' }, { name: 'หนองคาย', prefix: '43' },
  { name: 'มหาสารคาม', prefix: '44' }, { name: 'ร้อยเอ็ด', prefix: '45' },
  { name: 'กาฬสินธุ์', prefix: '46' }, { name: 'สกลนคร', prefix: '47' },
  { name: 'นครพนม', prefix: '48' }, { name: 'มุกดาหาร', prefix: '49' }
];

function isMissingBillValue(value) {
  const s = text(value).trim();
  return !s || /^(?:DATA[\s_-]*MISSING|DATA[\s_-]*MISS|MISSING|NULL|UNDEFINED|N\/A|NONE|ยังไม่มี(?:ที่อยู่|สินค้า|เบอร์)?|ไม่พบ(?:ที่อยู่|สินค้า|เบอร์)?|🔴\s*รอเช็คที่อยู่)$/iu.test(s);
}

function normalizedAddressPart(value) {
  return text(value).normalize('NFC')
    .replace(/กรุงเทพ(?:มหานคร|ฯ)?|กทม\.?|bangkok/giu, 'กรุงเทพ')
    .replace(/ตำบล|ตําบล|ต\.|อำเภอ|อําเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต/gu, '')
    .replace(/[^\p{L}\p{M}\p{N}]/gu, '')
    .toLowerCase();
}

function addressHasFieldPart(address, fieldPart) {
  if (isMissingBillValue(fieldPart)) return false;
  const part = normalizedAddressPart(fieldPart);
  return part.length >= 2 && /\p{L}/u.test(part) && normalizedAddressPart(address).includes(part);
}

function auditBillFields(d, bill) {
  const warnings = [];
  const added = new Set();
  const add = (code, message) => {
    if (added.has(code)) return;
    added.add(code);
    warnings.push(`[${code}] ${message}`);
  };

  const customer = text(d.customer_name);
  if (isMissingBillValue(customer)) add('NAME_MISSING', 'ฟิลด์ customer_name ที่บิลใช้ว่างหรือเป็น DATA_MISSING');

  let phoneDigits = text(d.extracted_phone).replace(/\D/g, '');
  if (phoneDigits.startsWith('66') && phoneDigits.length === 11) phoneDigits = `0${phoneDigits.slice(2)}`;
  if (!/^0\d{9}$/.test(phoneDigits)) add('PHONE_INVALID', 'ฟิลด์ extracted_phone ที่บิลใช้ไม่ครบ 10 หลัก');

  const product = billProductDisplay(d);
  if (isMissingBillValue(product)) add('PRODUCT_MISSING', 'ไม่พบรายการสินค้าในฟิลด์ที่ BILL BUILDER1 ใช้');

  const codText = text(d.cod_amount).replace(/,/g, '');
  if (isMissingBillValue(d.cod_amount) || !Number.isFinite(Number(codText))) {
    add('COD_INVALID', 'ฟิลด์ cod_amount ที่บิลใช้ว่างหรือไม่ใช่ตัวเลข');
  }

  const address = bestAddress(d);
  const addressCore = address.replace(/^.*?(?:ที่อยู่|address)\s*[:：]\s*/isu, '').trim();
  const province = text(d.province);
  const zipcode = text(d.zipcode);
  const postalMatches = Array.from(addressCore.matchAll(/(?:^|\D)(\d{5})(?!\d)/gu), match => match[1]);
  const postal = postalMatches[postalMatches.length - 1] || '';
  const riskyArea = RESTRICTED_AREAS.find(({ name, prefix }) =>
    `${province} ${addressCore}`.replace(/\s+/g, '').includes(name) || postal.startsWith(prefix)
  );
  const explicitRisk = bool(d.high_risk_area) || bool(d.risk_area)
    || /พื้นที่เสี่ยงสูง|RISK\s*AREA|ของโดนขโมย|งดส่งพื้นที่/iu.test(text(d.warning_tag));
  if (riskyArea || explicitRisk) {
    add('RESTRICTED_AREA', `พบพื้นที่เสี่ยง${riskyArea ? ` · ${riskyArea.name}` : ''} — ตรวจสอบก่อนจัดส่ง`);
  }

  if (isMissingBillValue(address)) {
    add('ADDRESS_MISSING', 'ฟิลด์ที่อยู่ที่ BILL BUILDER1 เลือกว่างหรือเป็น DATA_MISSING');
  } else {
    const missingParts = [];
    if (addressCore.length < 15) missingParts.push('ที่อยู่สั้นผิดปกติ');
    const houseOrPlace = /^\s*(?:(?:บ้าน(?:เลขที่)?|เลขที่)\s*)?\d{1,5}(?:\/\d{1,6})?(?=$|[\s,])/u.test(addressCore)
      || /(?:บ้าน(?:เลขที่)?|เลขที่)\s*\d{1,6}(?:\/\d{1,6})?/u.test(addressCore)
      || /วัด|มัสยิด|โบสถ์|โรงเรียน|มหาวิทยาลัย|โรงพยาบาล|คลินิก|ตลาด|ห้าง|บริษัท|โรงงาน|โรงแรม|รีสอร์ต|รีสอร์ท|หมู่บ้าน|ชุมชน|อาคาร|คอนโด|หอพัก|ร้าน|ศูนย์|สำนักงาน|ท่าเรือ|ท่ารถ|สนามบิน|ปั๊ม|สถานี|สวน|ไร่|ฟาร์ม|ไม่มีบ้านเลขที่|ใกล้|ตรงข้าม|เยื้อง|ข้าง(?:หน้า|หลัง)?|ปากซอย|ท้ายซอย|หน้าวัด|หลังวัด|หมู่ที่\s*\d|ม\.?\s*\d|ถนน\s*[\p{L}\p{M}\d]{2,}|ซอย\s*[\p{L}\p{M}\d]{2,}/iu.test(addressCore);
    if (!houseOrPlace) missingParts.push('บ้านเลขที่หรือสถานที่/จุดสังเกต');

    const isBangkok = /กรุงเทพ|กทม|bangkok/iu.test(`${province} ${addressCore}`);
    const subdistrict = firstExisting(d, ['district', 'subdistrict', 'sub_district', 'tambon', 'tambol']);
    const amphoe = firstExisting(d, ['amphoe', 'amphur', 'amphur_name', 'district_name']);
    const subdistrictPattern = isBangkok ? /แขวง\s*[\p{L}\p{M}]/u : /(?:ตำบล|ต\.)\s*[\p{L}\p{M}]/u;
    const amphoePattern = isBangkok ? /เขต\s*[\p{L}\p{M}]/u : /(?:อำเภอ|อ\.)\s*[\p{L}\p{M}]/u;
    const provincePattern = /(?:จังหวัด|จ\.)\s*[\p{L}\p{M}]|กรุงเทพ(?:มหานคร|ฯ)?|กทม\.?/iu;
    if (!(addressHasFieldPart(addressCore, subdistrict) || (isMissingBillValue(subdistrict) && subdistrictPattern.test(addressCore)))) {
      missingParts.push(isBangkok ? 'แขวง' : 'ตำบล');
    }
    if (!(addressHasFieldPart(addressCore, amphoe) || (isMissingBillValue(amphoe) && amphoePattern.test(addressCore)))) {
      missingParts.push(isBangkok ? 'เขต' : 'อำเภอ');
    }
    if (!(addressHasFieldPart(addressCore, province) || (isMissingBillValue(province) && provincePattern.test(addressCore)))) {
      missingParts.push('จังหวัด');
    }
    if (!/^\d{5}$/u.test(postal)) missingParts.push('รหัสไปรษณีย์ 5 หลัก');
    const expectedPostal = zipcode.match(/\d{5}/u)?.[0] || '';
    if (expectedPostal && postal && expectedPostal !== postal) missingParts.push('รหัสไปรษณีย์ในบิลไม่ตรงกับฟิลด์ zipcode');
    if (/(?:ชื่อ|เบอร์|โทร(?:ศัพท์)?|name|phone)\s*[:：]/iu.test(address)) {
      missingParts.push('ฟิลด์ที่อยู่มีชื่อ/เบอร์ปน');
    }
    if (missingParts.length) add('ADDRESS_REVIEW', `ที่อยู่ในบิลควรตรวจ: ${missingParts.join(' · ')}`);
  }

  const packer = d.packer_obj && typeof d.packer_obj === 'object' ? d.packer_obj : {};
  const completeFlag = d.darksideBillDataComplete ?? d.bill_data_complete
    ?? packer.darksideBillDataComplete ?? packer.bill_data_complete;
  const completeness = text(d.darkside_completeness_status ?? packer.darkside_completeness_status).toUpperCase();
  const rawReasons = d.darkside_missing_reasons ?? packer.darkside_missing_reasons;
  const reasons = Array.isArray(rawReasons) ? rawReasons.map(text).filter(Boolean).join(', ') : text(rawReasons);
  const flagSaysIncomplete = completeFlag === false || ['false', '0', 'no', 'n'].includes(text(completeFlag).toLowerCase());
  const hasReasons = Boolean(reasons && !['[]', 'null', 'DATA_MISSING'].includes(reasons.toUpperCase()));
  if (flagSaysIncomplete || /INCOMPLETE|DATA[\s_-]*MISS/iu.test(completeness) || hasReasons) {
    add('DATA_MISS', `พบสัญญาณข้อมูลไม่ครบจาก n8n${reasons ? ` · ${reasons}` : ''}`);
  }

  if (/บอท.{0,20}(?:ทวน|ยืนยัน)|(?:ทวน|ยืนยัน).{0,20}บิล|รอ.{0,12}(?:ทวน|ยืนยัน)|กรุณา.{0,24}(?:ตรวจ|ทวน|ยืนยัน)|ตรวจสอบ.{0,16}(?:ก่อนส่ง|บิล)|bot.{0,20}(?:review|confirm|verify)/iu.test(text(bill))) {
    add('BOT_RECHECK', 'พบข้อความบอทให้ทวน/ยืนยันในข้อความบิล');
  }
  if (/ยกเลิก(?:สินค้า|รายการ)|สินค้า.{0,16}(?:ถูกยกเลิก|ยกเลิกแล้ว)|(?:cancelled|canceled)\s+(?:item|product)/iu.test(product)) {
    add('ITEM_CANCELLED', 'พบข้อความยกเลิกสินค้าในรายการสินค้าของบิล');
  }

  return warnings;
}

function mergeBillAuditNotice(existingNotice, warnings) {
  const original = text(existingNotice);
  const markerIndex = original.lastIndexOf(BILL_AUDIT_MARKER);
  const base = (markerIndex >= 0 ? original.slice(0, markerIndex) : original)
    .replace(/\s*(?:\||·)\s*$/u, '').trim();
  if (!warnings.length) return base;
  const auditText = `${BILL_AUDIT_MARKER} ${warnings.join('; ')}`;
  return [base, auditText].filter(Boolean).join(' | ');
}

function parseTime(v) {
  const s = text(v);
  if (!s) return 0;
  const iso = Date.parse(s);
  if (Number.isFinite(iso) && !/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(s)) return iso;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2})[:.](\d{2})(?::(\d{2}))?/);
  if (!m) return 0;
  let y = Number(m[3]);
  if (y < 100) y += 1957;
  if (y >= 2400) y -= 543;
  return Date.UTC(y, Number(m[2]) - 1, Number(m[1]), Number(m[4]) - 7, Number(m[5]), Number(m[6] || 0));
}
function normalize(v, kind) {
  let s = text(v).toLowerCase().normalize('NFC');
  if (kind === 'phone') return s.replace(/\D/g, '');
  if (kind === 'cod') return s.replace(/,/g, '');
  if (kind === 'address') s = s.replace(/ตำบล|ตําบล/g, 'ต').replace(/อำเภอ|อําเภอ/g, 'อ').replace(/จังหวัด/g, 'จ');
  return s.replace(/[^\p{L}\p{N}]/gu, '');
}

function billProductDisplay(row) {
  const sources = ['product_items_v5', 'product_items_matched', 'product_map_items', 'orderItems', 'order_items'];
  let items = [];
  for (const key of sources) {
    if (Array.isArray(row?.[key]) && row[key].length) { items = row[key]; break; }
  }
  if (!items.length) {
    return firstExisting(row, [
      'order_fibo_product', 'trusted_product', 'for_packer_st_display',
      'manus_for_packer', 'google_for_packer', 'packer_tag_display',
      'final_display_for_packer', 'display_for_packer', 'telegram_product_display',
      'final_product', 'sku'
    ]);
  }
  const alternateArrays = sources.map(key => row?.[key]).filter(v => Array.isArray(v) && v.length && v !== items);
  const qtyPattern = /(?:[x×]\s*|จำนวน\s*)(\d+(?:\.\d+)?)\s*(คอต\.?|ซอง|แพ็ค|แพ็ก|กล่อง|ชิ้น|หีบ|ขวด|กระปุก|ชุด)/iu;
  const looseQtyPattern = /(\d+(?:\.\d+)?)\s*(คอต\.?|ซอง|แพ็ค|แพ็ก|กล่อง|ชิ้น|หีบ|ขวด|กระปุก|ชุด)/iu;
  const unitPattern = /(คอต\.?|ซอง|แพ็ค|แพ็ก|กล่อง|ชิ้น|หีบ|ขวด|กระปุก|ชุด)/iu;
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i] && typeof items[i] === 'object' ? items[i] : {};
    const altCandidates = alternateArrays.map(arr => arr[i]).filter(x => x && typeof x === 'object');
    const altQty = x => Number(x.quantity ?? x.qty ?? x.extractedQtyNum ?? x.quantity_value);
    const altText = x => sanitizeRawText([x.final_product, x.mapped_display, x.raw_line, x.raw_source_line].filter(Boolean).join(' '));
    const alt = altCandidates.find(x => Number.isFinite(altQty(x)) && altQty(x) > 0)
      || altCandidates.find(x => qtyPattern.test(altText(x)) || looseQtyPattern.test(altText(x)))
      || altCandidates[0] || {};
    let display = sanitizeRawText(firstExisting(item, [
      'final_product', 'mapped_display', 'master_display_for_packer',
      'display_for_packer', 'trusted_product', 'product_name', 'th_name',
      'name', 'sku', 'master_sku', 'raw_line'
    ]) || text(items[i]));
    if (!display || display === '[object Object]') continue;
    const detail = sanitizeRawText([display, firstExisting(item, ['raw_line', 'raw_source_line', 'source_line']),
      firstExisting(alt, ['final_product', 'mapped_display', 'raw_line'])].filter(Boolean).join(' '));
    const existingMatch = display.match(qtyPattern) || display.match(looseQtyPattern);
    let qty = Number(item.quantity ?? item.qty ?? item.extractedQtyNum ?? item.quantity_value
      ?? alt.quantity ?? alt.qty ?? alt.extractedQtyNum ?? alt.quantity_value);
    let unit = firstExisting(item, ['quantity_unit', 'unit_label', 'unit'])
      || firstExisting(alt, ['quantity_unit', 'unit_label', 'unit']);
    const parsed = detail.match(qtyPattern) || detail.match(looseQtyPattern);
    if (!Number.isFinite(qty) || qty <= 0) qty = parsed ? Number(parsed[1]) : 0;
    if (!unit) unit = parsed ? parsed[2] : (detail.match(unitPattern)?.[1] || 'คอต');
    unit = String(unit).replace(/\.$/u, '');
    if (!existingMatch && qty > 0) display = `${display} x ${qty} ${unit}`;
    result.push(display);
  }
  return result.join('\n') || firstExisting(row, [
    'order_fibo_product', 'trusted_product', 'for_packer_st_display',
    'manus_for_packer', 'google_for_packer', 'packer_tag_display'
  ]);
}

function value(row, field) {
  const d = row || {};
  if (field === 'product') return billProductDisplay(d);
  if (field === 'color') return firstExisting(d, ['customer_color_current', 'product_color_display']);
  if (field === 'quantity') return firstExisting(d, ['customer_quantity_current', 'qty_display_th', 'final_order_qty']);
  if (field === 'cod') return firstExisting(d, ['cod_amount', 'expected_cod', 'cod_value']);
  if (field === 'phone') return firstExisting(d, ['phone', 'extracted_phone', 'phone_number', 'clean_phone']);
  if (field === 'name') return firstExisting(d, ['customer_name', 'recipient_name', 'name', 'customer']);
  if (field === 'address') return bestAddress(d);
  if (field === 'carrier') return text(d.shipping_carrier);
  return '';
}
function label(field) {
  return { product: 'รายการสินค้า', color: 'สี/รุ่นสินค้า', quantity: 'จำนวนสินค้า', cod: 'ยอด COD', phone: 'เบอร์โทร', name: 'ชื่อผู้รับ', address: 'ที่อยู่จัดส่ง', carrier: 'ขนส่ง' }[field] || field;
}
function emoji(field) {
  return { product: '📦', color: '🎨', quantity: '🔢', cod: '💰', phone: '📞', name: '👤', address: '🏠', carrier: '🚚' }[field] || '🔸';
}
function compare(oldRow, newRow) {
  const fields = ['product', 'color', 'quantity', 'cod', 'phone', 'name', 'address', 'carrier'];
  return fields.map(field => {
    const before = value(oldRow, field);
    const after = value(newRow, field);
    if (!before && !after) return null;
    if (normalize(before, field) === normalize(after, field)) return null;
    return {
      field,
      label: label(field),
      emoji: emoji(field),
      before,
      after,
      changed_at: text(newRow.order_time_display)
    };
  }).filter(Boolean);
}
function upstreamChangeFields(row) {
  const fields = new Set();
  const add = (raw) => {
    const s = sanitizeRawText(raw);
    if (!s) return;
    const tokens = s.toUpperCase().replace(/[\[\]\"']/g, '').split(/[,_\s]+/u);
    for (const token of tokens) {
      if (token === 'PRODUCT' || token === 'PRODUCT_CHANGE' || token === 'PRODUCT_ADDED' || token === 'PRODUCT_REMOVED') fields.add('product');
      if (token === 'COLOR' || token === 'COLOR_CHANGE' || token === 'VARIANT' || token === 'VARIANT_CHANGE') fields.add('color');
      if (token === 'QUANTITY' || token === 'QUANTITY_CHANGE' || token === 'QTY' || token === 'QTY_CHANGE') fields.add('quantity');
      if (token === 'ADDRESS' || token === 'ADDRESS_CHANGE') fields.add('address');
      if (token === 'PHONE' || token === 'PHONE_CHANGE') fields.add('phone');
      if (token === 'NAME' || token === 'CUSTOMER' || token === 'CUSTOMER_CHANGE') fields.add('name');
      if (token === 'COD' || token === 'COD_CHANGE') fields.add('cod');
      if (token === 'CARRIER' || token === 'CARRIER_CHANGE') fields.add('carrier');
    }
  };
  add(row.changed_fields);
  add(row.customer_change_fields);
  add(row.pre_save_change_fields);
  add(row.customer_change_type);
  add(row.change_note_th);
  if (bool(row.cluster_has_change) || /ORDER_UPDATED|CHANGE|เปลี่ยน/iu.test(text(row.change_status))) {
    add(row.change_status);
    add(row.change_note_th);
  }
  return fields;
}
function mergeChangeSignals(localChanges, oldRow, newRow) {
  const merged = [...localChanges];
  const already = new Set(merged.map(x => x.field));
  for (const field of upstreamChangeFields(newRow)) {
    if (already.has(field)) continue;
    merged.push({
      field,
      label: label(field),
      emoji: emoji(field),
      before: value(oldRow, field),
      after: value(newRow, field),
      changed_at: text(newRow.order_time_display),
      source: 'UPSTREAM_CHANGE_SIGNAL'
    });
  }
  return merged;
}
function buildAudit(changes) {
  if (!changes.length) return '';
  const lines = [
    '',
    '█▓▒░░ 𝖬𝖸𝖲𝖳𝖮𝖱𝖸_𝖮𝖱𝖣𝖤𝖱 ░░▒▓█',
    '⚙️ <b>𝖢𝖧𝖠𝖭𝖦𝖤_𝖠𝖴𝖣𝖨𝖳</b> • รายการเปลี่ยน',
    '⌬━━━━━━━━━━━━━━━━━━━━⌬',
    `📌 <b>เปลี่ยน ${changes.length} รายการ</b>`,
    ''
  ];
  for (const c of changes) {
    lines.push(`${c.emoji} <b>${esc(c.label)}</b>`);
    lines.push(`◁ <code>${esc(c.before)}</code>`);
    lines.push(`▷ <code>${esc(c.after)}</code>`);
    const reason = {
      product: 'ลูกค้าเพิ่ม/ลบ/เปลี่ยนรายการสินค้า',
      color: 'ลูกค้าเปลี่ยนสีหรือรุ่นสินค้า',
      quantity: 'ลูกค้าเปลี่ยนจำนวนสินค้า',
      cod: 'ยอด COD เปลี่ยน',
      phone: 'เบอร์โทรศัพท์เปลี่ยน',
      name: 'ชื่อผู้รับเปลี่ยน',
      address: 'ลูกค้าแก้ไขหรือส่งที่อยู่ชุดใหม่',
      carrier: 'ลูกค้าเปลี่ยนขนส่ง'
    }[c.field] || `ข้อมูล${c.label}เปลี่ยน`;
    lines.push(`เหตุผล: ${esc(reason)}`);
    lines.push(`เวลาเปลี่ยน: ${esc(c.changed_at)}`);
    lines.push('');
  }
  lines.push('⌬━━━━━━━━━━━━━━━━━━━━⌬');
  return lines.join('\n');
}

function buildBill(d) {
  const header = sanitizeRawText(d.stock_notice);
  const orderTime = text(d.order_time_display);
  const orderNumber = text(d.order_number_display || d.order_number);
  const page = text(d.page_name);
  const facebook = text(d.facebook_name);
  const customer = text(d.customer_name);
  const phone = text(d.extracted_phone);
  const address = bestAddress(d);
  const product = billProductDisplay(d);
  const cod = d.cod_amount;
  const carrier = text(d.shipping_carrier);
  return [
    header ? `<b>${esc(header)}</b>` : '',
    '━━━━━━━━━━━━━━━━━━━━',
    orderTime ? `⏰ <b>เวลาสั่งซื้อ:</b> ${esc(orderTime)}` : '',
    orderNumber ? `🆔 <b>เลขออเดอร์:</b> <code>${esc(orderNumber)}</code>` : '',
    page ? `📢 <b>ชื่อเพจ:</b> ${esc(page)}` : '',
    facebook ? `👤 <b>Facebook:</b> ${esc(facebook)}` : '',
    cod !== undefined && cod !== null && text(cod) ? `💰 <b>ยอด COD:</b> <code>${esc(cod)}</code> บาท` : '',
    '━━━━━━━━━━━━━━━━━━━━',
    customer ? `<code>${esc(customer)}</code>` : '',
    phone ? `<code>${esc(phone)}</code>` : '',
    address ? `<code>${esc(address)}</code>` : '',
    '',
    product ? '📦 <b>รายการสินค้า:</b>' : '',
    product ? `<code>${esc(product)}</code>` : '',
    '━━━━━━━━━━━━━━━━━━━━',
    carrier ? `🚚 <b>ขนส่ง:</b> ${esc(carrier)}` : ''
  ].filter(Boolean).join('\n');
}
function groupKey(d, index) {
  return text(d.pre_save_change_group_key || d.customer_change_audit_group_key) || `SINGLE|${index}`;
}

const groups = new Map();
for (const row of rows) {
  const key = groupKey(row.json, row.index);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

const result = [];
function selectedMarker(row) {
  return bool(row?.customer_change_audit_is_current)
    || bool(row?.pre_save_change_selected)
    || bool(row?.four1_winner)
    || row?.duplicate_role === 'SELECTED_CANDIDATE';
}
function explicitlyBlocked(row) {
  const d = row || {};
  return d.darksideBillDataComplete === false
    || d.bill_data_complete === false
    || d.source_gate_color === '⚫'
    || d.source_gate_status === 'BLACK_REVIEW'
    || d.bill_send_decision === 'DO_NOT_SEND'
    || d.bill_send_signal === 'DO_NOT_SEND_BILL'
    || bool(d.tracking_request_48h)
    || bool(d.tracking_request_same_thai_date)
    || d.switch3_route_status === 'REVIEW';
}
function isGhostRoute(route) {
  return route === '👻' || route === '👻Ghost_Black';
}


for (const group of groups.values()) {
  const ordered = [...group].sort((a, b) =>
    parseTime(a.json.order_time_display) - parseTime(b.json.order_time_display) || a.index - b.index
  );
  const declaredSize = Math.max(1, ...ordered.map(row => Number(
    row.json.customer_change_audit_group_size || row.json.pre_save_change_group_size || row.json.currentThreadTotalBills || 1
  ) || 1));
  const hasPair = ordered.length > 1 || declaredSize > 1;

  const markedWinners = ordered.filter(row => selectedMarker(row.json));
  const newRow = markedWinners[0] || ordered[ordered.length - 1];
  const selectedTime = parseTime(newRow.json.order_time_display);
  const previousCandidates = ordered
    .filter(row => row.index !== newRow.index)
    .filter(row => !selectedTime || !parseTime(row.json.order_time_display) || parseTime(row.json.order_time_display) < selectedTime);
  const oldRow = previousCandidates[previousCandidates.length - 1]
    || ordered.find(row => row.index !== newRow.index)
    || null;
  const localChanges = oldRow ? compare(oldRow.json, newRow.json) : [];
  const hasFooterDiffContract = Array.isArray(newRow.json.customer_change_diff_json);
  const changes = hasFooterDiffContract
    ? newRow.json.customer_change_diff_json
    : (oldRow ? mergeChangeSignals(localChanges, oldRow.json, newRow.json) : []);
  const audit = buildAudit(changes);
  const pairLoss = ['PAIR_LOSS', 'LOSE_PAIR', 'HOLD_PAIR_LOSS', 'HOLD_DUPLICATE'].includes(
    text(newRow.json.bill_send_decision).toUpperCase()
  );
  const winnerKey = firstExisting(newRow.json, ['upsert_key', 'order_number', 'id']);

  for (const row of group) {
    const isNew = row.index === newRow.index;
    const isOld = hasPair && !isNew;
    const incomingRoute = text(row.json.bb_express_send_route);
    const rowIncomplete = row.json.darksideBillDataComplete === false
      || row.json.bill_data_complete === false
      || row.json.source_gate_color === '⚫'
      || row.json.source_gate_status === 'BLACK_REVIEW';
    const trackingBlock = bool(row.json.tracking_request_48h)
      || bool(row.json.tracking_request_same_thai_date)
      || incomingRoute === '🔴';
    const holdRoute = incomingRoute === '⚫' || trackingBlock || isGhostRoute(incomingRoute);

    const route = pairLoss || rowIncomplete
      ? '⚫'
        : isOld
          ? (changes.length ? '🟠' : '⬛')
        : hasPair && isNew && holdRoute
          ? (trackingBlock ? '🔴' : incomingRoute)
          : hasPair && isNew && changes.length
            ? '🟨'
            : hasPair && isNew
              ? '🟦'
              : (incomingRoute || '⚪');

    const routeReason = pairLoss
      ? 'PAIR_LOSS_OR_HOLD'
      : rowIncomplete
        ? 'INCOMPLETE_BILL_DATA'
        : isOld
          ? 'HISTORY_OLD_VERSION_NOT_SELECTED'
          : hasPair && isNew && holdRoute
            ? 'WINNER_BLOCKED_BY_UPSTREAM_ROUTE'
            : hasPair && isNew && changes.length
              ? `LATEST_VERSION_CHANGED: ${changes.map(x => x.field.toUpperCase()).join(',')}`
              : hasPair && isNew
                ? 'LATEST_GROUP_VERSION_NO_CHANGE_SELECTED_FOR_SEND'
                : incomingRoute
                  ? 'SINGLE_PASS_THROUGH_FROM_UPSTREAM'
                  : 'SINGLE_COMPLETE_FROM_ORDER_MASTER';

    const sendRouteAllowed = ['🟦', '🟨', '⚪', '⚪White'].includes(route);
    const selectedEligible = isNew
      && !isOld
      && !pairLoss
      && !rowIncomplete
      && !explicitlyBlocked(row.json)
      && sendRouteAllowed;

    const routeReasonLabel = route === '🟦'
      ? '🟦 ใบล่าสุดในกลุ่ม · ไม่พบการเปลี่ยน · เลือกส่งเพียงใบเดียว'
      : route === '🟨'
        ? `🟨 ใบล่าสุดในกลุ่ม · พบการเปลี่ยน ${changes.map(x => x.field.toUpperCase()).join(', ')}`
        : route === '🟠'
          ? '🟠 ใบอื่นในกลุ่ม · เก็บประวัติ ไม่ส่งซ้ำ'
          : route === '⚫'
            ? '⚫ ข้อมูลไม่ครบหรือกลุ่มถูก HOLD · ห้ามส่ง'
            : isGhostRoute(route)
              ? '👻 ออเดอร์เก่า · ห้ามส่งซ้ำ'
              : route === '🔴'
                ? '🔴 คำขอเลข/route ตรวจสอบ · ห้ามส่งเป็นบิลใหม่'
                : '⚪ ใบเดี่ยวสมบูรณ์จากโหนดต้นทาง';

    const bill = buildBill(row.json);
    // Audit the current bill only. These notices are informational and do not affect routing.
    const billWarnings = isNew ? auditBillFields(row.json, bill) : [];
    const existingBalloonNotice = row.json.balloonnotice ?? row.json.balloonNotice ?? '';
    const balloonnotice = isNew
      ? mergeBillAuditNotice(existingBalloonNotice, billWarnings)
      : existingBalloonNotice;
    const oldWarning = isOld
      ? '\n⚠️ <i>ใบนี้ไม่ถูกเลือก เก็บเป็นประวัติเท่านั้น และไม่ใช้ส่งซ้ำ</i>'
      : '';
    const message = (isNew || isOld) && changes.length
      ? `${bill}\n${audit}${oldWarning}`
      : bill;
    const alert = isNew && changes.length ? audit : '';
    const diff = isNew ? changes : [];

    result.push({
      json: {
        ...row.json,
        balloonnotice,
        customer_change_audit_group_key: groupKey(row.json, row.index),
        customer_change_audit_group_size: String(Math.max(ordered.length, declaredSize)),
        customer_change_audit_is_current: isNew,
        customer_change_audit_is_previous: isOld,
        customer_change_detected: isNew && changes.length > 0 ? 'true' : 'false',
        customer_change_count: String(isNew ? changes.length : 0),
        customer_change_type: isNew && changes.length ? changes.map(x => x.field.toUpperCase()).join('_AND_') + '_CHANGE' : 'NONE',
        customer_change_diff_json: diff,
        history_bucket: isOld ? 'CHANGED_ORDER_HISTORY' : (isNew && changes.length ? 'CURRENT_CHANGED_BILL' : ''),
        history_route_required: isOld,
        history_route_status: isOld ? 'ARCHIVE_ONLY' : '',
        history_route_key: isOld ? winnerKey : '',
        customer_change_route_hint: isOld ? 'HISTORY_ROUTING' : (isNew && changes.length ? 'CURRENT_BILL_SEND_CANDIDATE' : 'NO_CHANGE'),
        bb_express_send_route: route,
        switch3_route: route,
        four2_route_reason: routeReason,
        four2_route_reason_label: routeReasonLabel,
        four2_order_time_source: 'order_time_display',
        four2_selected_by: isNew ? (markedWinners.length ? 'UPSTREAM_AUDIT_WINNER' : 'LATEST_ORDER_TIME_DISPLAY') : 'NOT_SELECTED_OLD_VERSION',
        four2_change_fields: changes.map(x => x.field.toUpperCase()),
        four2_change_count: changes.length,
        four2_selected_for_send: selectedEligible,
        four2_winner_key: winnerKey,
        send_eligible: selectedEligible ? 'true' : 'false',
        telegram_bill_send_eligible: selectedEligible ? 'true' : 'false',
        telegram_send_blocked: selectedEligible ? 'false' : 'true',
        telegram_block_reason: selectedEligible ? '' : (isOld ? 'NOT_SELECTED_HISTORY_ONLY' : (rowIncomplete ? 'INCOMPLETE_BILL_DATA' : pairLoss ? 'PAIR_LOSS_OR_HOLD' : routeReason)),
        is_ready_to_pack: selectedEligible ? 'true' : 'false',
        should_should_to_packing: selectedEligible,
        target_room: isOld ? 'CHRONOS_TARTARUS' : (selectedEligible ? 'PACKING_ROOM' : row.json.target_room),
        telegram_main_bill: bill,
        telegram_message: message,
        telegram_message_for_send_final: message,
        telegram_message_with_change_audit: message,
        telegram_change_alert: alert,
        
        // Plain-text columns for the website; leave HTML message/body for Telegram untouched.
        telegram_message_web: htmlToPlainText(message),
        telegram_change_alert_web: htmlToPlainText(alert),
        telegram_body: {
          chat_id: text(row.json.telegram_chat_id),
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      }
    });
  }
}

return result;
