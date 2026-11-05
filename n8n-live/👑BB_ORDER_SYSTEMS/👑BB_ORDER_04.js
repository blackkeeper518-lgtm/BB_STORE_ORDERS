// ============================================================
// MASTER ADDRESS CASCADE 3 SYSTEMS + ORDER FIBO + ADDRESS FIBO
// n8n Code Node — Run Once for All Items
// ============================================================
// Flow ภายในโหนด:
//   System 1 PRIMARY
//       ↓ ถ้าไม่ครบ
//   System 2 BACKUP
//       ↓ ถ้าไม่ครบ
//   System 3 CUSTOMER CHAT
//       ↓
//   Purifier → เลือก Address → Address Fibo
//       +
//   Order Fibo
//
// System 1: formatted_address / ค่าที่โหนดหน้าสกัดไว้แล้ว
// System 2: finalAddress / backup / address_candidates
// System 3: ข้อความลูกค้าจริงจาก chat_timeline
//
// ไม่ทำ:
// - ไม่ทำ Human/Bot Truth Gate
// - ไม่ส่ง Telegram
// - ไม่ลบ original/chat_timeline/raw
// - ไม่เอาคะแนน Order Fibo มาปน Address Fibo
// ============================================================

const items = $input.all();

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------
function asText(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') {
    try { return JSON.stringify(v); } catch (_) { return String(v); }
  }
  return String(v)
    .normalize('NFKC')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();
}
function oneLine(v) { return asText(v).replace(/\s+/gu, ' ').trim(); }
function digits(v) { return oneLine(v).replace(/\D/g, ''); }
function numberValue(v) {
  const n = Number(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function parseLines(v) {
  if (Array.isArray(v)) return v.map(asText).filter(Boolean);
  const s = asText(v);
  if (!s) return [];
  try {
    const x = JSON.parse(s);
    return Array.isArray(x) ? x.map(asText).filter(Boolean) : [s];
  } catch (_) {
    return s.split(/\n+/u).map(asText).filter(Boolean);
  }
}
function isMissing(v) {
  return /^(?:DATA_MISSING|DATA\s*MISSING|N\/A|NA|null|undefined|ไม่มีข้อมูล|-|_)$/iu.test(oneLine(v));
}

// ------------------------------------------------------------
// Purifier / Guard
// ------------------------------------------------------------
function removeNameAndPhoneLines(value, phoneValue) {
  const phone = digits(phoneValue);
  return asText(value)
    .split(/\n+/u)
    .filter(line => {
      const normalized = oneLine(line);
      if (!normalized) return false;
      if (phone.length >= 9 && digits(normalized) === phone) return false;
      if (/^\+?\d[\d\s().-]{8,}$/u.test(normalized)) return false;
      return true;
    })
    .join(' ')
    .trim();
}
function isNameOnlyAddress(value) {
  const s = asText(value);
  return /^(?:ชื่อผู้รับ|ชื่อ|ผู้รับ)\s*[:：]/iu.test(s)
    && !/(?:บ้านเลขที่|เลขที่|หมู่|หมู่บ้าน|ม\.|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|ถนน|ซอย|\d{5})/iu.test(s);
}
function stripTimelinePrefix(value) {
  return asText(value)
    .replace(/^\[[^\]]*\]\s*/u, '')
    .replace(/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?\]\s*/u, '')
    .replace(/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?\s*/u, '')
    .trim();
}

function stripToAddressPayload(rawValue, customerName, phoneValue) {
  let s = removeNameAndPhoneLines(stripTimelinePrefix(rawValue), phoneValue);
  if (!s || isMissing(s) || isNameOnlyAddress(s)) return '';

  // ที่อยู่จัดส่ง/ที่อยู่ เป็น anchor สูงสุด
  const labeled = s.match(/(?:ที่อยู่จัดส่ง|ที่อยู่|address)\s*[:：]\s*([\s\S]*)/iu);
  if (labeled) s = labeled[1];

  // ลบชื่อผู้รับที่วางไว้หน้าที่อยู่ ถ้ารู้ชื่อ
  const customer = asText(customerName);
  if (customer && s.startsWith(customer)) s = s.slice(customer.length).trim();

  // ตัดสินค้า/ขนส่ง/แฮชแท็ก
  s = s.split(/(?:📦\s*รายการสินค้า|รายการสินค้า\s*[:：]|🚚\s*ขนส่ง|#ORDER|ORDER_MYSTORY|◦◦◦|━━━━━━━━)/iu)[0];

  // หยุดก่อนโทร/เบอร์/มือถือ
  s = s.split(/(?:=|\s)(?:โทรศัพท์|โทร|เบอร์|มือถือ)\s*[:：=]?/iu)[0];

  // หา Address anchor จริง ไม่ใช้วันที่/COD/ชื่อสินค้าเป็นจุดเริ่ม
  const starts = [...s.matchAll(/(?:บ้านเลขที่\s*\d+[\/]?\d*|เลขที่\s*\d+[\/]?\d*|\b\d{1,5}\/\d{1,5}\b|หมู่บ้าน|หมู่(?:ที่)?\s*\d+|\bม\.\s*\d+|ตําบล|ตำบล|ต\.|อําเภอ|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต|ถนน|ถ\.|ซอย|ซ\.)/giu)]
    .map(m => ({ index: m.index, token: m[0] }))
    .filter(x => Number.isInteger(x.index));

  if (starts.length && !/^\d{1,5}(?:\/|-)?\s*\d{0,5}\b/u.test(s.trim())) {
    const strong = starts.find(x => /(?:บ้านเลขที่|เลขที่|\d{1,5}\/\d{1,5}|หมู่บ้าน|หมู่|\bม\.)/iu.test(x.token));
    s = s.slice((strong || starts[0]).index);
  }

  // ลบเบอร์เต็มที่หลุดใน payload
// ลบเฉพาะเลขท้ายเบอร์ที่ติดหน้าชื่อสถานที่
// ต้องตรงกับท้ายเบอร์ผู้รับ และตามด้วยคำบอกสถานที่/เขตปกครอง
const phoneDigits = digits(phoneValue);

if (phoneDigits.length >= 9) {
  const landmarkStart =
    String.raw`(?:ที่พักสงฆ์|สำนักสงฆ์|วัด|สำนัก|ศูนย์|ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต|หมู่บ้าน|โรงเรียน|ตลาด|โรงพยาบาล|บริษัท|หอพัก|คอนโด|ถนน|ซอย)`;

  const leadingPhoneTail = s.match(
    new RegExp(`^\\s*(\\d{4,9})\\s+(?=${landmarkStart})`, 'iu')
  );

  if (leadingPhoneTail && phoneDigits.endsWith(leadingPhoneTail[1])) {
    s = s.slice(leadingPhoneTail[0].length).trim();
  }
}

  return s
    .replace(/[=|]+/gu, ' ')
    .replace(/ตําบล/gu, 'ตำบล')
    .replace(/อําเภอ/gu, 'อำเภอ')
    .replace(/(?:กทม\.?\s*,?\s*)?(?:จ\.?\s*)?กรุงเทพมหานคร/giu, 'กรุงเทพมหานคร')
    .replace(/กรุงเทพฯ|กทม\.?/giu, 'กรุงเทพมหานคร')
    .replace(/\s+/gu, ' ')
    .trim();
}

// ------------------------------------------------------------
// System 3: customer chat only
// ------------------------------------------------------------
function parseTimelineEntry(value) {
  const line = asText(value);
  const m = line.match(/^\[([^:]+):\s*[^\]]+\]\s*([\s\S]*)$/u);
  if (!m) return { sender: '', body: stripTimelinePrefix(line) };
  return { sender: asText(m[1]), body: stripTimelinePrefix(m[2]) };
}
function isBotTimeline(sender, body) {
  return /(?:ร้าน|page|store|admin|แอดมิน|bot|ทีมงาน|หนูส่ง|สรุปรายการ|ปิดยอดสำเร็จ|รายการสินค้า|COD\s*[:：])/iu.test(`${sender} ${body}`);
}
function system3Evidence(row) {
  return parseLines(row.chat_timeline)
    .map(parseTimelineEntry)
    .filter(x => x.body)
    .filter(x => !isBotTimeline(x.sender, x.body))
    .filter(x => /(?:หมู่|บ้าน|เลขที่|ตําบล|ตำบล|ต\.|อําเภอ|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต|ถนน|ซอย|\d{5}|โทร|เบอร์)/iu.test(x.body))
    .map(x => ({
      system: 'SYSTEM_3_CUSTOMER_CHAT',
      field: 'chat_timeline.customer_message',
      sender: x.sender,
      raw: x.body
    }));
}

// ------------------------------------------------------------
// System 1 / System 2 candidates
// ------------------------------------------------------------
function system1Candidates(row) {
  return [
    ['formatted_address', row.formatted_address],
    ['address_display_packer', row.address_display_packer],
    ['addressclean', row.addressclean],
    ['full_address', row.full_address],
    ['final_address_for_bill', row.final_address_for_bill]
  ]
    .filter(([, value]) => value !== undefined && value !== null && !isMissing(value))
    .map(([field, raw]) => ({ system: 'SYSTEM_1_UPSTREAM', field, sender: '', raw: asText(raw) }));
}
function system2Candidates(row) {
  const out = [];
  const values = [
    ['finalAddress', row.finalAddress],
    ['full_address_backup_1', row.full_address_backup_1],
    ['full_address_backup_2', row.full_address_backup_2]
  ];
  for (const [field, value] of values) {
    if (value !== undefined && value !== null && !isMissing(value)) {
      out.push({ system: 'SYSTEM_2_FUSION_BACKUP', field, sender: '', raw: asText(value) });
    }
  }
  for (const value of parseLines(row.address_candidates)) {
    const raw = typeof value === 'object' ? (value.clean || value.raw || '') : value;
    if (raw && !isMissing(raw)) out.push({ system: 'SYSTEM_2_FUSION_BACKUP', field: 'address_candidates', sender: '', raw: asText(raw) });
  }
  for (const value of parseLines(row.address_candidates_all)) {
    const raw = typeof value === 'object' ? (value.clean || value.raw || '') : value;
    if (raw && !isMissing(raw)) out.push({ system: 'SYSTEM_2_FUSION_BACKUP', field: 'address_candidates_all', sender: '', raw: asText(raw) });
  }
  return out;
}

function system4RescueCandidates(row) {
  const rescueZip = [row.rescue_zipcode, row.clean_zipcode, row.zipcode]
    .map(value => asText(value).match(/(?<!\d)([1-9]\d{4})(?!\d)/u)?.[1] || '')
    .find(Boolean) || '';

  const values = [
    ['rescue_address_normalized', row.rescue_address_normalized],
    ['telegram_primary_address', row.telegram_primary_address],
    ['rescue_address', row.rescue_address],
    ['clean_address', row.clean_address],
    ['rescue_address_raw', row.rescue_address_raw]
  ];

  return values
    .filter(([, value]) => value !== undefined && value !== null && !isMissing(value))
    .map(([field, value]) => {
      const raw = asText(value);
      const hasZip = /(?<!\d)[1-9]\d{4}(?!\d)/u.test(raw);
      return {
        system: 'SYSTEM_4_RESCUE_NODE',
        field,
        sender: 'RESCUE_NODE',
        raw: rescueZip && !hasZip ? `${raw} ${rescueZip}` : raw
      };
    });
}

function assessCandidate(candidate, row) {
  const clean = stripToAddressPayload(
    candidate.raw,
    row.customer_name || row.facebook_name,
    row.phone || row.extracted_phone
  );
  if (!clean || isMissing(clean) || isNameOnlyAddress(clean)) {
    return { ...candidate, raw: candidate.raw, clean: '', score: -999, complete: false, usable: false, issues: ['NON_ADDRESS_CANDIDATE'], address_type: 'UNKNOWN' };
  }
function removeThaiDistrictProvincePrefixes(addressText) {
  let s = asText(addressText);
  if (!s) return '';

  // ตัดคำว่า ตำบล, อำเภอ, จังหวัด และตัวย่อออกให้เกลี้ยง เหลือแต่ชื่อสถานที่และตัวเลข
  s = s
    .replace(/(?:ตำบล|ตํำบล|ตําบล|ต\.|ต\s)/gu, '')
    .replace(/(?:อำเภอ|อําเภอ|อ\.|อ\s)/gu, '')
    .replace(/(?:จังหวัด|จ\.|จ\s)/gu, '')
    .replace(/(?:แขวง)/gu, '')
    .replace(/(?:เขต)/gu, '')
    .replace(/\s+/gu, ' ') // ยุบช่องว่างที่เกินให้เหลือช่องว่างเดียว
    .trim();

  return s;
}
  const isBangkok = /กรุงเทพมหานคร/iu.test(clean);
  const hasHouse = /(?:บ้านเลขที่|เลขที่|^\d{1,5}(?:\/|-)?\s*\d{0,5}\b|\d+\s*ม\.?|อาคาร|ห้อง)/iu.test(clean);
  const hasVillage = /(?:หมู่บ้าน|หมู่(?:ที่)?\s*\d+|\bม\.\s*\d+)/iu.test(clean);
  const hasLocal = isBangkok ? /แขวง\s*[^\s]+/iu.test(clean) : /(?:ตำบล|ต\.)\s*[^\s]+/iu.test(clean);
  const hasDistrict = isBangkok ? /เขต\s*[^\s]+/iu.test(clean) : /(?:อำเภอ|อ\.)\s*[^\s]+/iu.test(clean);
  const hasProvince = isBangkok || /(?:จังหวัด|จ\.)\s*[^\s]+/iu.test(clean);
  const hasZip = /(?<!\d)[1-9]\d{4}(?!\d)/u.test(clean);
  const contaminated = /(?:COD|ยอด\s*COD|รายการสินค้า|คอต\.?|ขนส่ง|ORDER_MYSTORY|หนูส่ง|ทีมงาน)/iu.test(clean);
  const landmark = /(?:วัด|สำนักสงฆ์|ร้านอาหาร|ร้านกาแฟ|ร้านตัดผม|ร้านค้า|ตลาด|โรงเรียน|บริษัท|หอพัก|รีสอร์ท|โรงแรม|คลินิก|โรงพยาบาล|ปั๊ม|ฟาร์ม|สวน)/iu.test(clean);
  const landmarkUsable = landmark && (hasLocal || hasDistrict || hasProvince || hasZip);

  const complete = hasHouse && hasZip && hasLocal && hasDistrict && hasProvince;
  const usable = complete || landmarkUsable || (hasLocal && (hasDistrict || hasProvince));
  const issues = [];
  if (!hasHouse) issues.push('MISSING_HOUSE_NUMBER');
  if (!hasZip) issues.push('MISSING_ZIPCODE');
  if (!hasLocal) issues.push(isBangkok ? 'MISSING_KHWANG' : 'MISSING_TAMBON');
  if (!hasDistrict) issues.push(isBangkok ? 'MISSING_KHET' : 'MISSING_AMPHOE');
  if (!hasProvince) issues.push('MISSING_PROVINCE');
  if (contaminated) issues.push('ADDRESS_CONTAMINATION');
  if (landmarkUsable && !complete) issues.push('LANDMARK_ADDRESS_REVIEW');

  return {
    ...candidate,
    clean,
    complete,
    usable,
    landmark_address: landmarkUsable,
    issues,
    address_type: isBangkok ? 'BANGKOK_KHWANG_KHET' : 'PROVINCE_TAMBON_AMPHOE',
    score: 0
  };
}

function cascadeAddress(row) {
  const s1 = system1Candidates(row).map(c => assessCandidate(c, row)).filter(c => c.clean);
  const s2 = system2Candidates(row).map(c => assessCandidate(c, row)).filter(c => c.clean);
  const s3 = system3Evidence(row).map(c => assessCandidate(c, row)).filter(c => c.clean);
  const s4 = system4RescueCandidates(row).map(c => assessCandidate(c, row)).filter(c => c.clean);

  const firstComplete = list => list.find(x => x.complete === true);
  const firstUsable = list => list.find(x => x.usable === true);

  // คงลำดับเดิมของ Systems 1–3; Rescue เป็น System 4
  const selected = firstComplete(s1) || firstComplete(s2) || firstComplete(s3) || firstComplete(s4)
    || firstUsable(s1) || firstUsable(s2) || firstUsable(s3) || firstUsable(s4)
    || s1[0] || s2[0] || s3[0] || s4[0]
    || { system: 'NONE', field: '', sender: '', raw: '', clean: '', score: -999, complete: false, usable: false, issues: ['ADDRESS_NOT_FOUND'], address_type: 'UNKNOWN' };

  const level = selected.system === 'SYSTEM_1_UPSTREAM' ? 'PRIMARY'
    : selected.system === 'SYSTEM_2_FUSION_BACKUP' ? 'FALLBACK_1'
    : selected.system === 'SYSTEM_3_CUSTOMER_CHAT' ? 'FALLBACK_2'
    : selected.system === 'SYSTEM_4_RESCUE_NODE' ? 'FALLBACK_3'
    : 'RAW_FALLBACK';

  return {
    selected,
    system1: s1,
    system2: s2,
    system3: s3,
    system4: s4,
    all: [...s1, ...s2, ...s3, ...s4],
    fallback_used: level !== 'PRIMARY',
    fallback_level: level,
    selection_reason: selected.complete
      ? `${selected.system}_COMPLETE`
      : selected.usable
        ? `${selected.system}_USABLE_REVIEW`
        : `${selected.system}_PARTIAL_REVIEW`
  };
}

function addressFibo(address) {
  const clean = asText(address?.clean);
  if (!clean) {
    return { score: 0, tier: '🔴 ADDRESS_EMPTY', badge: '📍 ADDRESS-FIBO-0 [🔴 ADDRESS_EMPTY]', reason: 'DATA_MISSING', usable: false, complete: false };
  }

  const isBangkok = /กรุงเทพมหานคร/iu.test(clean);
  const hasHouse = /(?:บ้านเลขที่|เลขที่|^\d{1,5}(?:\/|-)?\s*\d{0,5}\b|\d+\s*ม\.?|อาคาร|ห้อง)/iu.test(clean);
  const hasVillage = /(?:หมู่บ้าน|หมู่(?:ที่)?\s*\d+|\bม\.\s*\d+)/iu.test(clean);
  const hasLocal = isBangkok ? /แขวง\s*[^\s]+/iu.test(clean) : /(?:ตำบล|ต\.)\s*[^\s]+/iu.test(clean);
  const hasDistrict = isBangkok ? /เขต\s*[^\s]+/iu.test(clean) : /(?:อำเภอ|อ\.)\s*[^\s]+/iu.test(clean);
  const hasProvince = isBangkok || /(?:จังหวัด|จ\.)\s*[^\s]+/iu.test(clean);
  const hasZip = /(?<!\d)[1-9]\d{4}(?!\d)/u.test(clean);
  const contamination = /(?:COD|รายการสินค้า|คอต\.?|ขนส่ง|ORDER_MYSTORY|หนูส่ง|ทีมงาน)/iu.test(clean);
  const landmark = /(?:วัด|สำนักสงฆ์|ร้านอาหาร|ร้านกาแฟ|ร้านตัดผม|ร้านค้า|ตลาด|โรงเรียน|บริษัท|หอพัก|รีสอร์ท|โรงแรม|คลินิก|โรงพยาบาล|ปั๊ม|ฟาร์ม|สวน)/iu.test(clean);
  const landmarkUsable = landmark && (hasLocal || hasDistrict || hasProvince || hasZip);

  let score = 2;
  const reasons = ['ADDRESS_TEXT'];
  if (hasHouse) { score += 5; reasons.push('HOUSE_+5'); }
  if (hasVillage) { score += 3; reasons.push('VILLAGE_+3'); }
  if (hasLocal) { score += 8; reasons.push(isBangkok ? 'KHWANG_+8' : 'TAMBON_+8'); }
  if (hasDistrict) { score += 13; reasons.push(isBangkok ? 'KHET_+13' : 'AMPHOE_+13'); }
  if (hasProvince) { score += 21; reasons.push('PROVINCE_+21'); }
  if (hasZip) { score += 34; reasons.push('ZIPCODE_+34'); }
  if (!contamination) { score += 5; reasons.push('CLEAN_+5'); }
  if (landmarkUsable) { score += 8; reasons.push('LANDMARK_+8'); }

  const complete = hasHouse && hasZip && hasLocal && hasDistrict && hasProvince;
  const usable = complete || landmarkUsable || (hasLocal && (hasDistrict || hasProvince));
  const issues = address?.issues ? [...address.issues] : [];
  if (!hasHouse && !issues.includes('MISSING_HOUSE_NUMBER')) issues.push('MISSING_HOUSE_NUMBER');
  if (!hasZip && !issues.includes('MISSING_ZIPCODE')) issues.push('MISSING_ZIPCODE');
  if (!hasLocal && !issues.includes(isBangkok ? 'MISSING_KHWANG' : 'MISSING_TAMBON')) issues.push(isBangkok ? 'MISSING_KHWANG' : 'MISSING_TAMBON');
  if (!hasDistrict && !issues.includes(isBangkok ? 'MISSING_KHET' : 'MISSING_AMPHOE')) issues.push(isBangkok ? 'MISSING_KHET' : 'MISSING_AMPHOE');
  if (!hasProvince && !issues.includes('MISSING_PROVINCE')) issues.push('MISSING_PROVINCE');
  if (landmarkUsable && !complete && !issues.includes('LANDMARK_ADDRESS_REVIEW')) issues.push('LANDMARK_ADDRESS_REVIEW');

  let tier = '🔴 ADDRESS_REVIEW';
  if (score >= 89) tier = '👑 ADDRESS_ULTIMATE';
  else if (score >= 55) tier = '🌟 ADDRESS_GOLD';
  else if (score >= 34) tier = '🏆 ADDRESS_USABLE';
  else if (score >= 21) tier = '💵 ADDRESS_PARTIAL';

  return {
    score,
    tier,
    badge: `📍 ADDRESS-FIBO-${score} [${tier}]`,
    reason: reasons.join('|'),
    usable,
    complete,
    landmark: landmarkUsable,
    issues,
    type: isBangkok ? 'BANGKOK_KHWANG_KHET' : 'PROVINCE_TAMBON_AMPHOE'
  };
}

// ------------------------------------------------------------
// Order Fibo — แยก namespace จาก Address Fibo
// ------------------------------------------------------------
function productText(row) {
  return oneLine(row.trusted_product || row.for_packer_st_display || row.telegram_product_display || row.orderItems || row.sku || '');
}
function orderQty(row, product) {
  const explicit = numberValue(row.final_order_qty || row.extracted_text_qty || row.qty_display_th);
  if (explicit > 0) return explicit;
  const m = product.match(/(?:x|×|จำนวน)\s*(\d+(?:\.\d+)?)/iu)
    || product.match(/(\d+(?:\.\d+)?)\s*(?:คอต|คอต\.|ซอง|ชิ้น|กล่อง|แพ็ค|แพ็ก)/iu);
  return m ? Number(m[1]) : 0;
}
function orderFibo(row) {
  const product = productText(row);
  const qty = orderQty(row, product);
  const nodePrice = numberValue(row.final_order_price || row.node_price || row.cod_amount);
  const extractedPrice = numberValue(row.extracted_text_price || row.expected_cod);
  const effectivePrice = nodePrice > 0 ? nodePrice : extractedPrice;
  const source = [row.SNIPER_X_TEXT, row.original, row.original_api_message].filter(Boolean).map(asText).join('\n');

  let score = 0;
  if (effectivePrice >= 2000) score += 55;
  else if (effectivePrice >= 1000) score += 34;
  else if (effectivePrice >= 800) score += 21;
  else if (effectivePrice >= 400) score += 13;
  else if (effectivePrice > 200) score += 8;

  if (qty >= 10) score += 34;
  else if (qty >= 5) score += 21;
  else if (qty >= 2) score += 8;
  else score += 2;

  if (row.order_number || row.id) score += 3;
  if (row.customer_name || row.name || row.phone || row.extracted_phone) score += 3;
  if (source.toLowerCase().includes('#singto_order')) score += 5;
  if (source.toLowerCase().includes('cod') || row.is_cod === true) score += 3;
  if (source.includes('สรุปยอด') || source.includes('ปิดยอดสำเร็จ')) score += 5;

  let saltyGold = false;
  let silentWhale = false;
  if (effectivePrice >= 1500 && source.trim().length < 15) { score += 21; silentWhale = true; }
  if (qty === 1 && effectivePrice >= 1000) { score += 13; saltyGold = true; }

  let tier = '💲 21_GOLDEN_FLOOR';
  let mathematicalPrice = 200;
  if (score >= 89) { tier = '👑 144_ULTIMATE_VIP'; mathematicalPrice = 2000; }
  else if (score >= 55) { tier = '🌟 89_GOLDEN_TOP'; mathematicalPrice = 1000; }
  else if (score >= 34) { tier = '🏆 55_GOLDEN_RATIO'; mathematicalPrice = 700; }
  else if (score >= 21) { tier = '💵 34_GOLDEN_MEDIUM'; mathematicalPrice = 400; }

  let vipTag = '🔰 BRONZE_FOOT_SOLDIER';
  let vip = false;
  if (score >= 89) { vipTag = '👑 ULTIMATE_VIP_EXPRESS'; vip = true; }
  else if (score >= 55) { vipTag = '🌟 GOLDEN_TOP_EXPRESS'; vip = true; }
  else if (score >= 34) { vipTag = '🏆 GOLDEN_RATIO_COMMANDER'; vip = true; }
  else if (score >= 21) vipTag = '💵 MEDIUM_SOLDIER';
  if (saltyGold) vipTag = `🧈 GOLDEN_TURBO [${vipTag}]`;

  return {
    score,
    tier,
    badge: `🔥 FIBO-${score} [${tier}]`,
    mathematicalPrice,
    finalOrderPrice: nodePrice > 0 ? nodePrice : (extractedPrice > 0 ? extractedPrice : mathematicalPrice),
    effectivePrice,
    qty,
    product,
    saltyGold,
    silentWhale,
    vip,
    vipTag
  };
}
function removeThaiDistrictProvincePrefixes(addressText) {
  let s = asText(addressText);
  if (!s) return '';

  // ตัดคำว่า ตำบล, อำเภอ, จังหวัด และตัวย่อออกให้เกลี้ยง เหลือแต่ชื่อสถานที่และตัวเลข
  s = s
.replace(/(?:^|\s)(?:ตำบล|ตํำบล|ตําบล|ต\.)\s*/gu, ' ') // ตัดเฉพาะคำว่า ตำบล หรือ ต. ที่นำหน้าด้วยเว้นวรรคหรือจุดเริ่มต้น
    .replace(/(?:^|\s)(?:อำเภอ|อําเภอ|อ\.)\s*/gu, ' ')     // ตัดเฉพาะ อำเภอ หรือ อ.
    .replace(/(?:^|\s)(?:จังหวัด|จ\.)\s*/gu, ' ')          // ตัดเฉพาะ จังหวัด หรือ จ.
    .replace(/\s+/gu, ' ')                                // ยุบช่องว่างส่วนเกิน
    .trim();

  return s;
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
const output = [];

for (const item of items) {
  const row = item?.json || {};
  const cascade = cascadeAddress(row);
  const selected = cascade.selected;
  const address = addressFibo(selected);
  const order = orderFibo(row);

  output.push({
    json: {
      ...row,
// ---------------- CASCADE RESULT ----------------
finalAddress: removeThaiDistrictProvincePrefixes(selected.clean) || removeThaiDistrictProvincePrefixes(row.finalAddress) || '',
address_display_packer: removeThaiDistrictProvincePrefixes(selected.clean) || removeThaiDistrictProvincePrefixes(row.address_display_packer) || '',
addressclean: removeThaiDistrictProvincePrefixes(selected.clean) || removeThaiDistrictProvincePrefixes(row.addressclean) || '',
full_address: removeThaiDistrictProvincePrefixes(selected.clean) || removeThaiDistrictProvincePrefixes(row.full_address) || '',
final_address_for_bill: removeThaiDistrictProvincePrefixes(selected.clean) || removeThaiDistrictProvincePrefixes(row.final_address_for_bill) || '',
      
      address_raw_source_line: selected.raw || '',
      address_selected_system: selected.system,
      address_selected_field: selected.field,
      address_customer_sender: selected.sender || '',
      address_fallback_used: cascade.fallback_used,
      address_fallback_level: cascade.fallback_level,
      address_selection_reason: cascade.selection_reason,
      address_validation_status: selected.complete ? 'ADDRESS_OK' : 'ADDRESS_REVIEW',
      address_validation_complete: selected.complete === true,
      address_usable: selected.usable === true,
      address_capture_status: selected.landmark_address ? 'LANDMARK_CAPTURED_REVIEW' : (selected.complete ? 'COMPLETE' : 'PARTIAL_REVIEW'),
      address_validation_issues: selected.issues || [],
      address_type: selected.address_type || 'UNKNOWN',
      address_system_1_result: cascade.system1,
      address_system_2_result: cascade.system2,
      address_system_3_result: cascade.system3,
      address_system_4_result: cascade.system4,
      address_candidates_all: cascade.all,
      address_raw_retention: 'KEEP',

      // ---------------- ADDRESS FIBO ----------------
      address_fibo_score: address.score,
      address_fibo_tier: address.tier,
      address_fibo_badge: address.badge,
      address_fibo_reason: address.reason,
      address_fibo_usable: address.usable,
      address_fibo_complete: address.complete,
      address_fibo_landmark: address.landmark,
      address_fibo_issues: address.issues,
      address_fibo_type: address.type,
      address_fibo_selected_clean: selected.clean || '',
      address_fibo_selected_source: `${selected.system || 'NONE'}:${selected.field || ''}`,
      address_fibo_cleaner: 'CASCADE_PURIFIER_V1',

      // ---------------- ORDER FIBO ----------------
      fibo_score: order.score,
      fibo_tier: order.tier,
      fibo_badge: order.badge,
      mathematically_price: order.mathematicalPrice,
      final_order_price: order.finalOrderPrice,
      final_order_qty: order.qty || row.final_order_qty || '',
      is_salty_gold: order.saltyGold,
      is_silent_whale: order.silentWhale,
      is_vip: order.vip,
      vip_tag: order.vipTag,
      order_fibo_effective_price: order.effectivePrice,
      order_fibo_product: order.product,

      // ---------------- MASTER CONTRACT ----------------
      order_fibo_engine_version: 'ORDER_FIBO_V1',
      address_fibo_engine_version: 'ADDRESS_FIBO_V1',
      address_cascade_engine_version: 'CASCADE_4_SYSTEMS_V1',
      master_fibo_engine_version: 'MASTER_CASCADE_ORDER_ADDRESS_FIBO_V1',
      order_fibo_untouched_by_address: true,
      address_fibo_untouched_by_order: true
    }
  });
}

return output;
