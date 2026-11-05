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

// 🎯 Main Loop: รับค่าที่แมปจากโหนด V7 มาประกอบร่างบิล
const inputItems = $input.all();
return inputItems.map((item) => {
  const row = item?.json ?? {};

  // 📦 ดึงสินค้าที่ผ่านการแมป + รวมยอดสำเร็จรูปจากโหนด V7
  const product = firstExisting(row, [
    'final_product',
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
  // Clean web fields are separate from Telegram's HTML payload and preserve the original send text.
  const telegramMessageWeb = htmlToPlainText(telegramMessage);
  const telegramChangeAlertWeb = htmlToPlainText(firstExisting(row, ['telegram_change_alert']));

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
      telegram_message_web: telegramMessageWeb,
      telegram_change_alert_web: telegramChangeAlertWeb,
      bill_header_insert_status: 'HEADER_INSERTED'
    }
  };
});
