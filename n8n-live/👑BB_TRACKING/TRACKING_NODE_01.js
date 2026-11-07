// n8n Code node
// Mode: Run Once for All Items
// ============================================================
// หน้าที่ของโหนดนี้มีแค่ 3 อย่าง
// 1) รับ parcelStatusEmoji จากโหนดก่อนหน้า ไม่คำนวณใหม่
// 2) ตรวจว่าเคยส่งเลขแล้วหรือยัง ถ้าเคยส่งให้ติด 📌
// 3) คง chat_link_key เดิม เพื่อให้ Order / Chat / Parcel ใช้คีย์เดียวกัน
//
// ไม่มีการกรองข้อมูล
// ไม่มีการคำนวณเวลาแชท
// ไม่มีการคำนวณ route
// ไม่มีการเปลี่ยน emoji อื่น
// ============================================================

function clean(value) {
  return String(value ?? '').trim();
}

function compact(value) {
  return clean(value).replace(/\s+/g, '');
}

function extractTrackingNumber(...values) {
  const text = values
    .map((value) => String(value ?? ''))
    .join('\n');

  const matches = text.match(/\bTH[0-9A-Z]{8,24}\b/gi) || [];

  return matches.length
    ? matches[0].toUpperCase()
    : null;
}

function buildSharedChatLinkKey(row) {
  // ใช้ค่าที่โหนดก่อนหน้าสร้างมาแล้วเป็นอันดับแรก
  const existingKey = clean(
    row.chat_link_key ||
    row.chatLinkKey ||
    ''
  );

  if (existingKey) return existingKey;

  // fallback สำหรับกรณีข้อมูลยังไม่มี chat_link_key
  const pageId = clean(row.page_id);
  const threadId = clean(
    row.threadId ||
    row.thread_id ||
    row.threadID ||
    row.recipient_psid ||
    row.customer_id ||
    ''
  );

  if (!pageId || !threadId) return null;

  return `${pageId}:${threadId}`;
}

const output = [];

for (const item of $input.all()) {
  const row = item.json ?? {};

  // รับค่าอีโมจิจากโหนดหน้าเท่านั้น
  const incomingParcelStatusEmoji = clean(
    row.parcelStatusEmoji ??
    row.parcel_status_emoji ??
    ''
  );

  const pageLatestMessage = String(
    row.page_latest_message ??
    row.page_latest_message_text ??
    ''
  );

  const facebookTrackingMessage = String(
    row.facebook_tracking_message ??
    ''
  );

  const draksideTrackingMessage = String(
    row.drakside_tracking_message ??
    ''
  );

  const allMessages = [
    pageLatestMessage,
    facebookTrackingMessage,
    draksideTrackingMessage,
  ].join('\n');

  const compactMessages = compact(allMessages);

  const trackingNumber = extractTrackingNumber(
    row.admin_tracking_number,
    row.tracking_number,
    allMessages
  );

  // ตรวจเฉพาะว่าเคยได้รับเลข/มีข้อความแจ้งเลขแล้วหรือไม่
  const hasTrackingNotice =
    /📌แจ้งเลขพัสดุจัดส่ง/.test(compactMessages);

  const hasTrackingNumberInMessage = Boolean(
    extractTrackingNumber(allMessages)
  );

  const alreadySent =
    incomingParcelStatusEmoji === '📌' ||
    Boolean(row.already_sent) ||
    hasTrackingNotice ||
    hasTrackingNumberInMessage;

  // ถ้าเดิมมีวันเวลาอยู่แล้ว ให้คงไว้
  // ถ้ายังไม่มีและตรวจพบว่าเคยส่ง ให้ประทับเวลาปัจจุบัน
  const existingSentAt = clean(
    row.already_sent_at ||
    row.tracking_sent_at ||
    row.facebook_tracking_sent_at ||
    ''
  );

  const alreadySentAt = alreadySent
    ? (existingSentAt || new Date().toISOString())
    : null;

  // เคยส่งแล้วให้ใช้ 📌
  // ยังไม่เคยส่งให้คงค่า emoji จากโหนดก่อนหน้าแบบเดิม
  const parcelStatusEmoji = alreadySent
    ? '📌'
    : incomingParcelStatusEmoji;

  // คีย์กลางที่ทั้ง 3 สายต้องใช้เหมือนกัน
  const chatLinkKey = buildSharedChatLinkKey(row);

  output.push({
    json: {
      ...row,

      // ค่าอีโมจิกลาง
      parcelStatusEmoji,
      parcel_status_emoji: parcelStatusEmoji,

      // สถานะเคยส่งและเวลา เผื่อใช้ตรวจฉุกเฉิน
      already_sent: alreadySent,
      has_tracking_notice: hasTrackingNotice,
      admin_tracking_found: Boolean(
        row.admin_tracking_number ||
        hasTrackingNumberInMessage
      ),
      admin_tracking_number:
        row.admin_tracking_number || trackingNumber,
      already_sent_at: alreadySentAt,

      // เลขที่พบจากข้อความ ใช้ตรวจสอบเท่านั้น
      detected_tracking_number: trackingNumber,

      // คีย์กลาง Order / Chat / Parcel
      chat_link_key: chatLinkKey,
    },
  });
}

return output;
