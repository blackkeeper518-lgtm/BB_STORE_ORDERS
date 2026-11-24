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

const inputItems = $input.all();

return inputItems.map((item) => {
  const row = item?.json ?? {};

  // 1. ดึงข้อความบิลเดิม (ที่มีบล็อก Change Audit ครบถ้วนแล้ว) มาเป็นตัวตั้งต้น
  let telegramMsg = firstExisting(row, [
    'telegram_message',
    'telegram_main_bill',
    'telegram_message_for_send_final',
    'raw_text'
  ]);

  // 2. ดึง stock_notice มาแต่งHTMLให้หล่อเหมือนฝั่งบิลเดี่ยว
  const rawStockNotice = firstExisting(row, ['stock_notice', 'dynamic_header', 'header_notice']);
  const formattedNotice = rawStockNotice ? `<b>${escapeHtml(rawStockNotice)}</b>` : "";

  // 3. เช็คว่าในข้อความมี stock_notice ตัวนี้แปะอยู่แล้วหรือยัง (ป้องกันการเบิ้ลซ้ำ)
  const hasNoticeAlready = formattedNotice && telegramMsg.includes(rawStockNotice);

  // 4. ถ้ามี stock_notice และยังไม่เคยถูกแปะ ให้เอามา "เสียบบนสุด" เหนือเวลาสั่งซื้อ
  if (formattedNotice && !hasNoticeAlready) {
    telegramMsg = `${formattedNotice}\n${telegramMsg}`;
  }

  // สร้างฟิลด์เว็บแยกจาก HTML สำหรับ Telegram; ฟิลด์ส่งกลุ่มคงเดิม
  const telegramChangeAlert = firstExisting(row, ['telegram_change_alert']);
  const telegramMessageWeb = htmlToPlainText(telegramMsg);
  const telegramChangeAlertWeb = htmlToPlainText(telegramChangeAlert);

  return {
    json: {
      ...row,
      // อัปเดตฟิลด์ข้อความส่งออกให้เป็นตัวที่ใส่หัวแจ้งเตือนสต็อกเรียบร้อยแล้ว
      telegram_message: telegramMsg,
      telegram_main_bill: telegramMsg,
      telegram_message_for_send_final: telegramMsg,
      telegram_message_web: telegramMessageWeb,
      telegram_change_alert_web: telegramChangeAlertWeb,
      audit_header_inject_status: formattedNotice ? (hasNoticeAlready ? 'ALREADY_EXISTS' : 'INJECTED_SUCCESS') : 'NO_NOTICE'
    }
  };
});