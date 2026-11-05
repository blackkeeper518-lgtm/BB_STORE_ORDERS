// ============================================================
// TELEGRAM BILL DECORATOR — หน้าที่แต่งหล่อสร้างข้อความ Telegram เท่านั้น
// ============================================================

function value(r, k) {
  const v = r?.[k];
  return v === undefined || v === null ? "" : String(v).trim();
}

function firstExisting(r, keys) {
  for (const k of keys) {
    const v = value(r, k);
    if (v !== "") return v;
  }
  return "";
}

function parseNumber(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return null;
  const c = String(raw).replaceAll(",", "").replace(/[^0-9.-]/g, "");
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
}

function formatBaht(n) {
  const num = parseNumber(n);
  if (num === null) return "";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatOrderTime(row) {
  const raw = firstExisting(row, ["orderTimeDisplay", "order_time_display", "order_time", "order_date"]);
  if (raw && raw.includes("/")) return raw;
  const iso = firstExisting(row, ["created_at", "updated_at", "orderTimeIso"]);
  if (!iso) return raw;
  try {
    const d = new Date(iso);
    const th = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    const dd = String(th.getUTCDate()).padStart(2, "0");
    const mm = String(th.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = th.getUTCFullYear() + 543;
    const hh = String(th.getUTCHours()).padStart(2, "0");
    const mi = String(th.getUTCMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi} น.`;
  } catch (e) {
    return raw || iso;
  }
}

function resolvePhone(row) {
  if (Array.isArray(row.phone_candidates)) {
    for (const candidate of row.phone_candidates) {
      const phone = String(candidate?.phone ?? '').trim();
      if (phone && phone !== '0') return phone;
    }
  }
  for (const key of ['phone_norm', 'phone_clean', 'extracted_phone', 'phone', 'phone_number', 'customer_phone']) {
    const phone = String(row?.[key] ?? '').trim();
    if (phone && phone !== '0') return phone;
  }
  return '';
}

function parseCustomerMessageTime(rawValue) {
  const raw = String(rawValue ?? '').trim();
  if (!raw) return null;

  // เวลาไทย เช่น 31/10/69 12:22:21 หรือ 31/10/2569 12:22:21
  const thai = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?(?:\s*น\.)?$/u);
  if (thai) {
    const day = Number(thai[1]);
    const month = Number(thai[2]);
    let year = Number(thai[3]);
    if (year < 100) year += 1957; // ปี พ.ศ. 2 หลัก เช่น 69 -> ค.ศ. 2026
    else if (year >= 2400) year -= 543;
    const hour = Number(thai[4] ?? 0);
    const minute = Number(thai[5] ?? 0);
    const second = Number(thai[6] ?? 0);
    const ms = Date.UTC(year, month - 1, day, hour - 7, minute, second);
    const check = new Date(ms + 7 * 60 * 60 * 1000);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    return ms;
  }

  // ISO ที่มี timezone ใช้ตรง ๆ; ISO ไม่มี timezone ให้ถือเป็นเวลาไทย
  const isoLocal = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?$/u);
  if (isoLocal) {
    let year = Number(isoLocal[1]);
    if (year >= 2400) year -= 543;
    return Date.UTC(year, Number(isoLocal[2]) - 1, Number(isoLocal[3]), Number(isoLocal[4]) - 7, Number(isoLocal[5]), Number(isoLocal[6] ?? 0), Number(`0.${isoLocal[7] ?? 0}`) * 1000);
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getParcelStatusEmoji(row, nowMs = Date.now()) {
  // สถานะส่งสำเร็จจากระบบพัสดุมีลำดับสูงสุด
  const sentValues = new Set(['🔥SENT', 'SENT', 'SUCCESS', 'COMPLETED', 'DELIVERED', 'SENT_TO_TELEGRAM']);
  const sentStatus = ['delivery_status', 'parcel_delivery_status', 'facebook_tracking_status']
    .map(key => value(row, key).toUpperCase())
    .some(status => sentValues.has(status));
  const sentAt = firstExisting(row, ['sent_at', 'parcel_sent_at', 'facebook_tracking_sent_at']);
  if (sentStatus || sentAt) return '🔥';

  // อายุแชตใช้สองฟิลด์นี้เท่านั้น; ไม่ใช้เวลาบิล/เวลาเพจ/วันรับพัสดุ
  if (!value(row, 'customer_latest_message')) return null;
  const messageTimeMs = parseCustomerMessageTime(value(row, 'customer_message_time_th'));
  if (messageTimeMs === null || messageTimeMs > nowMs) return null;

  const ageHours = (nowMs - messageTimeMs) / 3600000;
  if (ageHours >= 48) return '🔴';
  if (ageHours >= 24) return '🟡';
  return '🟢';
}

// 🎯 Main Loop: รับค่าที่แมปจากโหนด V7 มาประกอบร่างบิล
const inputItems = $input.all();
return inputItems.map((item) => {
  const row = item?.json ?? {};

  // 📦 ดึงสินค้าที่ผ่านการแมป + รวมยอดสำเร็จรูปจากโหนด V7
  const product = firstExisting(row, [
    'manus_for_packer',
    'display_for_packer',
    'for_packer_st_display',
    'product_map_primary',
    'raw_text'
  ]) || '📦 ตรวจสินค้า: ยังไม่พบรายการสินค้า';

  const header = firstExisting(row, ['stock_notice']);
  const orderTime = formatOrderTime(row);
  const orderNumber = firstExisting(row, ['order_number_display', 'order_number', 'upsert_key']);
  const page = firstExisting(row, ['page_name', 'page_Name', 'facebook_page_name']);
  const facebook = firstExisting(row, ['facebook_name', 'customer_facebook_name', 'sender_name']);
  const cod = parseNumber(firstExisting(row, ['cod_amount', 'expected_cod', 'cod', 'total_cod']));
  const customer = firstExisting(row, ['customer_name', 'recipient_name', 'facebook_name']);
  const phone = resolvePhone(row);
 // 🎯 ดึงที่อยู่ที่ผ่านการคัดกรองคะแนนและความสะอาดแบบหล่อๆ มาใช้
const address = firstExisting(row, [
  'address_display_packer',     // ฟิลด์ผ่านเกณฑ์คัดกรองทำบิลที่ดีที่สุด
  'final_address_for_bill',     // ฟิลด์สำหรับหน้างานแพ็ก
  'rescue_address_normalized',  // ที่อยู่ที่กู้มาและจัดรูปแล้ว
  'addressclean',               // ที่อยู่ที่ผ่านการทำความสะอาดเบื้องต้น
  'full_address'                // สำรองสุดท้าย
]);
  const carrier = firstExisting(row, ['shipping_carrier', 'rescue_shipping_carrier', 'carrier']);
  const parcelStatusEmoji = getParcelStatusEmoji(row);

  
  // 🎨 จัดฟอร์แมต HTML สำหรับส่ง Telegram
  const htmlHeader = [
    header ? `<b>${escapeHtml(header)}</b>` : '',
    '━━━━━━━━━━━━━━━━━━━━',
    orderTime ? `⏰ <b>เวลาสั่งซื้อ:</b> ${escapeHtml(orderTime)}` : '',
    orderNumber ? `🆔 <b>เลขออเดอร์:</b> <code>${escapeHtml(orderNumber)}</code>` : '',
    page ? `📢 <b>ชื่อเพจ:</b> ${escapeHtml(page)}` : '',
    facebook ? `👤 <b>Facebook:</b> ${escapeHtml(facebook)}` : '',
    cod !== null ? `💰 <b>ยอด COD:</b> <code>${formatBaht(cod)}</code> บาท` : '',
    '━━━━━━━━━━━━━━━━━━━━'
  ].filter(Boolean);

  const plainHeader = [
    header,
    '━━━━━━━━━━━━━━━━━━━━',
    orderTime ? `⏰ เวลาสั่งซื้อ: ${orderTime}` : '',
    orderNumber ? `🆔 เลขออเดอร์: ${orderNumber}` : '',
    page ? `📢 ชื่อเพจ: ${page}` : '',
    facebook ? `👤 Facebook: ${facebook}` : '',
    cod !== null ? `💰 ยอด COD: ${formatBaht(cod)} บาท` : '',
    '',
    '━━━━━━━━━━━━━━━━━━━━'
  ].filter(Boolean);

  const htmlBody = [
      customer ? `<code>${escapeHtml(customer)}</code>` : '',
    phone ? `<code>${escapeHtml(phone)}</code>` : '',
    address ? `<code>${escapeHtml(address)}</code>` : '',
    '',
    '',
    '📦 <b>รายการสินค้า:</b>',
    `<code>${escapeHtml(product)}</code>`,
    '━━━━━━━━━━━━━━━━━━━━',
    carrier ? `🚚 <b>ขนส่ง:</b> ${escapeHtml(carrier)}` : ''
  ].filter(Boolean);

  const plainBody = [
    customer,
    phone,
    address,
    '',
    '📦 รายการสินค้า:',
    product,
    '━━━━━━━━━━━━━━━━━━━━',
    carrier ? `🚚 ขนส่ง: ${carrier}` : ''
  ].filter(Boolean);

  const telegramMessage = [...htmlHeader, ...htmlBody].join('\n');
  const telegramCopyText = [...plainHeader, ...plainBody].join('\n');

  return {
    json: {
      ...row,
      phone,
      extracted_phone: phone,
      display_for_packer: product,
      for_packer_st_display: product,
      final_display_for_packer: product,
      telegram_product_display: product,
      telegram_bill_header: htmlHeader.join('\n'),
      telegram_bill_body: htmlBody.join('\n'),
      telegram_message: telegramMessage,
      telegram_copy_text: telegramCopyText,
      telegram_main_bill: telegramMessage,
      telegram_message_for_send_final: telegramMessage,
      parcel_status_emoji: parcelStatusEmoji,
      bill_header_insert_status: 'HEADER_INSERTED'
    }
  };
});
