// n8n Code node
// Mode: Run Once for All Items
// ============================================================
//📣 PRE-SEND LOCK · PARCEL (Full Master Code)
// วางไว้ที่โหนดหน้าก่อนเข้ากระบวนการคัดแยกเส้นทาง
// 
// หลักการ:
// - ไม่คำนวณแบบบิดเบี้ยว เชื่อตามเวลาสากลจริงบดคู่กับปัจจุบัน
// - บิลใหม่ดั้งเดิมใช้หัวข้อความ 📌 เพื่อลงตารางบันทึกตามหลังแชทได้ถูกต้อง
// - โหนดหน้าดักสกัด 📌📣 แจ้งเลขพัสดุจัดส่ง เพื่อป้องกันบิลวนลูปยิงซ้ำหาลูกค้า
// - ส่ง 🟢 และ 🟡 เข้า ALLOW_FB_SEND เพื่อให้แอดมินตามจิ้มส่งมือหน้าเว็บได้สะดวก
// ============================================================

const MIN_DAYS_BACK = 3;

function clean(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .trim();
}

function cleanInline(value) {
  return clean(value).replace(/\s+/g, ' ');
}

function parseDateValue(value) {
  const raw = clean(value);
  if (!raw) return null;

  // แปลงวันที่ไทย DD/MM/YY หรือ DD/MM/YYYY
  const thaiMatch = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (thaiMatch) {
    let [, dd, mm, yyyy, hh = '0', mi = '0', ss = '0'] = thaiMatch;
    let year = Number(yyyy);

    if (year < 100) year += 2500;
    if (year > 2400) year -= 543;

    const utc = Date.UTC(
      year,
      Number(mm) - 1,
      Number(dd),
      Number(hh) - 7,
      Number(mi),
      Number(ss)
    );

    return Number.isFinite(utc) ? utc : null;
  }

  // ISO / timestamp มาตรฐาน เฟสบุ๊คสากล
  const direct = Date.parse(raw);
  if (Number.isFinite(direct)) return direct;

  const match = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  let [, dd, mm, yyyy, hh = '0', mi = '0', ss = '0'] = match;
  let year = Number(yyyy);

  if (year < 100) year += 2500;
  if (year > 2400) year -= 543;

  const utc = Date.UTC(
    year,
    Number(mm) - 1,
    Number(dd),
    Number(hh) - 7,
    Number(mi),
    Number(ss)
  );

  return Number.isFinite(utc) ? utc : null;
}

// 🎯 ฟังก์ชันเช็กเวลาแชทจริงนาฬิกาโลก: ไม่โดนตารางบันทึกหลอกหัวทิ่ม
function getRealParcelStatusEmoji(row) {
  const facebookTimeRaw = clean(row.customer_message_time_th || row.occurred_at || row.customer_message_time_utc);
  
  if (!facebookTimeRaw) {
    const currentEmoji = clean(row.parcel_status_emoji);
    return (currentEmoji && currentEmoji !== 'null' && currentEmoji !== '') ? currentEmoji : '🟢';
  }

  let messageMs = parseDateValue(facebookTimeRaw);
  if (!Number.isFinite(messageMs)) {
    messageMs = Date.parse(facebookTimeRaw);
  }

  if (!Number.isFinite(messageMs)) return '🟢';

  // คำนวณอายุชั่วโมงเทียบเวลาปัจจุบันเซิร์ฟเวอร์แบบวินาทีต่อวินาที
  const ageHours = (Date.now() - messageMs) / (60 * 60 * 1000);
  if (!Number.isFinite(ageHours) || ageHours < 0) return '🟢';

  if (ageHours < 24) return '🟢'; // แชทใหม่ 24 ชม. แท้
  if (ageHours < 48) return '🟡'; // แชทค้างข้ามวัน เอาสีเหลืองไปโชว์ประดับหน้าเว็บส่ง gate
  return '🔴'; // ดองเกิน 48 ชม.
}

function normalizeTracking(value) {
  return clean(value)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

function extractCarrier(text) {
  const value = String(text ?? '');

  if (/FLASH\s*EXPRESS|แฟลช\s*เอ็กซ์เพรส|แฟลช/i.test(value)) {
    return 'FLASH EXPRESS';
  }
  if (/J\s*&?\s*T|เจแอนด์ที/i.test(value)) {
    return 'J&T';
  }
  if (/KERRY|เคอรี่/i.test(value)) {
    return 'KERRY';
  }
  if (/BEST\s*EXPRESS|เบสท์/i.test(value)) {
    return 'BEST EXPRESS';
  }
  if (/ไปรษณีย์ไทย|THAILAND\s*POST/i.test(value)) {
    return 'THAILAND POST';
  }

  return null;
}

// 🚀 โหนดยอดนักสืบ: ดักตรวจสอบประวัติแชทหาเครื่องหมาย 📌📣 ส่งซ้ำ
function extractAdminTracking(row) {
  const pageLatestMessage = String(
    row.page_latest_message ??
    row.page_latest_message_text ??
    row.last_page_message ??
    row.lastPageMessage ??
    ''
  );

  const facebookTrackingMessage = String(row.facebook_tracking_message ?? '');
  const draksideTrackingMessage = String(row.drakside_tracking_message ?? '');
  
  const combinedMessage = [
    pageLatestMessage,
    facebookTrackingMessage,
    draksideTrackingMessage,
  ].join('\n');

  const trackingMatches = combinedMessage.match(
    /\bTH[0-9A-Z]{8,24}\b/gi
  ) || [];

  const adminTrackingNumber = trackingMatches.length
    ? normalizeTracking(trackingMatches[0])
    : null;

  // 🎯 กฎเหล็กสัจจะโหนดหน้า: ถ้าเจอ 📌📣 ในแชท แปลว่าเคยผ่านท่อยิงจริงออกไปหาลูกค้าแล้ว สกัดด่วน!
  const hasTrackingMarker = (message) =>
    /📌\s*📣\s*แจ้งเลขพัสดุจัดส่ง/u.test(
      String(message ?? '')
    );
    
  const hasPageTrackingNotice = hasTrackingMarker(pageLatestMessage);
  const hasFacebookTrackingNotice = hasTrackingMarker(facebookTrackingMessage);
  const hasDraksideTrackingNotice = hasTrackingMarker(draksideTrackingMessage);
  
  const hasTrackingNotice =
    hasPageTrackingNotice ||
    hasFacebookTrackingNotice ||
    hasDraksideTrackingNotice;
    
  const sentStatus = [
    row.delivery_status,
    row.facebook_tracking_status,
    row.parcel_delivery_status,
  ]
    .map(value => clean(value).toUpperCase())
    .some(value => ['📌📣', '🔥SENT','⚡SENT', 'SENT', 'SUCCESS', 'COMPLETED', 'DELIVERED', 'SENT_TO_TELEGRAM'].includes(value));

  const adminTrackingFound = Boolean(adminTrackingNumber);

  return {
    admin_tracking_number: adminTrackingNumber,
    admin_tracking_carrier: extractCarrier(combinedMessage),
    admin_tracking_found: adminTrackingFound,
    admin_tracking_source: adminTrackingFound ? 'ADMIN_MESSAGE_TH_PREFIX' : null,
    has_tracking_notice: hasTrackingNotice,
    // สกัดกั้นด้วยตัวแปรมาร์กเกอร์ส่งจริง 📌📣 เท่านั้น 
    already_sent: hasTrackingNotice || sentStatus,
    already_sent_source: hasPageTrackingNotice
      ? 'PAGE_LATEST_MESSAGE_TRACKING_MARKER'
      : hasFacebookTrackingNotice
        ? 'FACEBOOK_TRACKING_MESSAGE_MARKER'
        : hasDraksideTrackingNotice
          ? 'DRAKSIDE_TRACKING_MESSAGE_MARKER'
      : sentStatus
        ? 'DELIVERY_STATUS'
        : null,
  };
}

function getRecipientName(row) {
  return cleanInline(
    row.recipient_name ||
    row.customer_name ||
    row.facebook_name ||
    row.flash_consignee ||
    row.consignee ||
    ''
  ).replace(/^[👤📱\s]+|[👤📱\s]+$/gu, '').trim();
}

function routeFromEmoji(row, alreadySent, hasBlockingDataError) {
  const emoji = clean(row.parcel_status_emoji);

  if (alreadySent) {
    return {
      parcel_status_emoji: emoji,
      bkk_cutoff_route: 'ALREADY_SENT_SAVE_ONLY',
      route_source: 'ALREADY_SENT_GUARD',
    };
  }

  if (hasBlockingDataError) {
    return {
      parcel_status_emoji: emoji,
      bkk_cutoff_route: 'BLOCK_DATA_INCOMPLETE',
      route_source: 'CUTOFF_DATA_STATUS',
    };
  }

  // ปล่อยผ่านไปเปิดช่องหน้าเว็บ SEND GATE ทั้งคิวสีเขียว 🟢 และสีเหลือง 🟡
  if (emoji === '🟢' || emoji === '🟡') {
    return {
      parcel_status_emoji: emoji,
      bkk_cutoff_route: 'ALLOW_FB_SEND',
      route_source: 'parcel_status_emoji',
    };
  }

  return {
    parcel_status_emoji: emoji,
    bkk_cutoff_route: 'BLOCK_FB_EXPIRED',
    route_source: 'parcel_status_emoji',
  };
}

function buildFacebookTrackingMessage({
  trackingNumber,
  shippingCarrier,
  orderTimeDisplay,
  manusForPacker,
  codAmount,
  pageName,
  phoneNumber,
}) {
  return [
    `📌 แจ้งเลขพัสดุจัดส่ง 🚚: ${trackingNumber || 'รอเลขพัสดุ'}`,
    phoneNumber ? `📱 เบอร์โทร: ${phoneNumber}` : '',
    `🙏 หนูขอแจ้งเลขให้นะคะพี่ ${shippingCarrier}`,
    `🗓️ วันที่สั่งซื้อ: ${orderTimeDisplay}`,
    '',
    '📦 รายการสินค้า:',
    manusForPacker,
    `💰 ยอดเก็บเงินปลายทาง (COD): ${codAmount} บาท`,
    '',
    '⏰ (เลขพัสดุจะเริ่มเช็คสถานะการเดินทางได้ช่วงเย็นๆ นะคะพี่ 💕)',
    '',
    'เพื่อความสบายใจ พี่สามารถแกะก่อนรับได้นะคะ',
    'แต่ต้องถ่ายคลิปไว้นะคะ มีปัญหาร้านเรา รับผิดชอบให้ค่ะ',
    `ขอบพระคุณที่อุดหนุน ${pageName} ❤️ ค่ะพี่`,
  ].filter(Boolean).join('\n');
}


function buildDraksideTrackingMessage({
  trackingNumber,
  shippingCarrier,
  orderTimeDisplay,
  manusForPacker,
  codAmount,
  pageName,
  phoneNumber,
}) {
  return [
    pageName ? `╳╳ [        ${pageName}        ] ╳╳` : '',
    phoneNumber ? `📱 เบอร์โทร : ${phoneNumber}` : '',
    trackingNumber ? `🔢 เลขพัสดุ: ${trackingNumber}` : '',
    orderTimeDisplay ? `🗓️ ${orderTimeDisplay}` : '',
    manusForPacker ? `${manusForPacker}` : '',
    codAmount ? `💰 ยอดเก็บเงินปลายทาง : ${codAmount} บาท` : '',
    shippingCarrier ? `╳╳ [ ${shippingCarrier} ] ╳╳` : '',
  ].filter(Boolean).join('\n');
}


const nowMs = Date.now();
const minAllowedTimeMs = nowMs - (
  MIN_DAYS_BACK * 24 * 60 * 60 * 1000
);

const seen = new Set();
const output = [];

for (const item of $input.all()) {
  const row = item.json ?? {};
  const reasons = [];

  const pickupDate = clean(row.pickup_date);
  const pickupMs = parseDateValue(pickupDate);

  if (pickupMs === null) {
    reasons.push('MISSING_OR_INVALID_PICKUP_DATE');
  } else if (pickupMs < minAllowedTimeMs) {
    reasons.push('OLDER_THAN_3_DAYS');
  } else if (pickupMs > nowMs) {
    reasons.push('FUTURE_PICKUP_DATE');
  }

  const adminTracking = extractAdminTracking(row);
  const parcelTrackingNumber = normalizeTracking(row.tracking_number);
  const trackingNumber = parcelTrackingNumber || adminTracking.admin_tracking_number || '';
  const recipientName = getRecipientName(row);

  if (!trackingNumber) reasons.push('MISSING_TRACKING_NUMBER');
  if (!recipientName) reasons.push('MISSING_RECIPIENT_NAME');

  const pageId = clean(row.page_id);
  const recipientPsid = clean(row.recipient_psid || row.customer_id);

  const dedupKey = [
    pageId,
    recipientPsid,
    trackingNumber,
    clean(row.phone || row.extracted_phone),
    recipientName,
  ].join('|');

  const isDuplicateInBatch = seen.has(dedupKey);
  if (isDuplicateInBatch) reasons.push('DUPLICATE_IN_CURRENT_BATCH');
  seen.add(dedupKey);

  const hasDataError = reasons.some((reason) => [
    'MISSING_OR_INVALID_PICKUP_DATE',
    'OLDER_THAN_3_DAYS',
    'FUTURE_PICKUP_DATE',
    'MISSING_TRACKING_NUMBER',
    'MISSING_RECIPIENT_NAME',

].includes(reason));
// คำนวณจุดสีเรียลไทม์
const realParcelStatusEmoji = getRealParcelStatusEmoji(row);
const route = routeFromEmoji(
{ ...row, parcel_status_emoji: realParcelStatusEmoji },
adminTracking.already_sent,
hasDataError
);
const recordStatus = reasons.length === 0 ? 'READY' : 'KEEP_FOR_REVIEW';
const orderTimeDisplay = cleanInline(row.order_time_display || row.order_date || '-');
const manusForPacker = cleanInline(row.manus_for_packer || row.google_for_packer || row.sku || 'สินค้าทั่วไป');
const codAmount = cleanInline(row.cod_amount || row.final_order_price || '0');
const shippingCarrier = adminTracking.admin_tracking_carrier || cleanInline(row.shipping_carrier || row.carrier || 'ขนส่งตามระบบ');
const pageName = cleanInline(row.page_name || '');
// ดึงข้อความเดิม หรือสร้างใหม่แบบคงหัวข้อความ 📌 ไว้ตามสเปก
let facebookTrackingMessage = row.facebook_tracking_message || '';
if (!facebookTrackingMessage) {
facebookTrackingMessage = buildFacebookTrackingMessage({
trackingNumber,
shippingCarrier,
orderTimeDisplay,
manusForPacker,
codAmount,
pageName,
});
}
const draksideTrackingMessage = row.drakside_tracking_message || buildDraksideTrackingMessage({
trackingNumber,
shippingCarrier,
orderTimeDisplay,
manusForPacker,
codAmount,
pageName,
});
output.push({
json: {
...row,
      pickup_date: pickupDate || null,
      tracking_number: trackingNumber || null,
      recipient_name: recipientName || null,
      shipping_carrier: shippingCarrier,
      order_time_display: orderTimeDisplay,
      manus_for_packer: manusForPacker,
      cod_amount: codAmount,
      cutoff_record_status: recordStatus,
      cutoff_is_permanent: true,
      cutoff_processed_at: new Date().toISOString(),
      cutoff_reasons: reasons,
      cutoff_reason_text: reasons.length ? reasons.join(' | ') : 'PASS',
      duplicate_in_current_batch: isDuplicateInBatch,
      admin_tracking_number: adminTracking.admin_tracking_number,
      admin_tracking_carrier: adminTracking.admin_tracking_carrier,
      admin_tracking_found: adminTracking.admin_tracking_found,
      admin_tracking_source: adminTracking.admin_tracking_source,
      has_tracking_notice: adminTracking.has_tracking_notice,
      already_sent: adminTracking.already_sent,
      already_sent_source: adminTracking.already_sent_source,
      parcel_status_emoji: route.parcel_status_emoji,
      bkk_cutoff_route: route.bkk_cutoff_route,
      send_facebook_route: route.bkk_cutoff_route,
      sendFacebookRoute: route.bkk_cutoff_route,
      route_source: route.route_source,
      facebook_tracking_message: facebookTrackingMessage,
      drakside_tracking_message: draksideTrackingMessage,
      signature_status: row.signature_status || row.signatureStatus || (row.hasOrderSignature === false ? 'MISSING_SIGNATURE' : 'UNCHANGED'),
},
});
}
return output