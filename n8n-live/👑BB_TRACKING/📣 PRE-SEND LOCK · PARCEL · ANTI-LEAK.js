// 📣 PRE-SEND LOCK · PARCEL · ANTI-LEAK
// วางก่อน 👣 LIMBO JUNCTION1 · Facebook API
//
// หน้าที่:
// 1. คัดรายการที่ลง Facebook แล้วออกจากคิว
// 2. กันรายการซ้ำที่มาจาก ROGUE สองฝั่ง
// 3. แยกสี 🟢 🟡 🔴 ให้ไหลต่อไปพร้อมกัน
// 4. เตรียม lock ก่อนส่ง
// 5. ยังไม่ประกาศ ⚡SENT จนกว่า Facebook จะตอบสำเร็จ
//
// สถานะ:
// 📌       = มีข้อความแจ้งเลข แต่ยังไม่ส่ง Facebook
// 📣       = เตรียมส่ง / ถูกล็อกในรอบนี้
// 📌📣     = ส่ง Facebook สำเร็จแล้ว
// ⚡SENT    = ส่งเลขให้ลูกค้าสำเร็จแล้ว

const MARKER = '📌📣';
const BASE_MARKER = '📌 แจ้งเลขพัสดุจัดส่ง';
const FINAL_MARKER_TEXT = '📌📣 แจ้งเลขพัสดุจัดส่ง';

function text(value) {
  return String(value ?? '').trim();
}

function hasValue(value) {
  return text(value) !== '';
}

function normalizePhone(value) {
  return text(value).replace(/[^\d]/g, '');
}

function normalizeTracking(value) {
  return text(value).toUpperCase().replace(/\s+/g, '');
}

function normalizeMessage(value) {
  return text(value).replace(/\r\n/g, '\n');
}

function getColor(row) {
  const candidates = [
    row.parcel_status_emoji,
    row.delivery_status,
    row.parcel_delivery_status,
    row.color,
  ];

  for (const value of candidates) {
    const v = text(value);
    if (['🟢', '🟡', '🔴'].includes(v)) return v;
  }

  return '⚪';
}

function alreadyFacebookMarked(row, fbMsg, dsMsg) {
  const statusValues = [
    row.facebook_tracking_status,
    row.tracking_message_marker,
    row.pre_send_lock_status,
  ].map(text);

  // ลง Facebook สำเร็จแล้ว
  if (
    statusValues.includes('⚡SENT') ||
    statusValues.includes('📌📣') ||
    statusValues.includes('FACEBOOK_SENT')
  ) {
    return true;
  }

  // มีหัวข้อความสำเร็จอยู่แล้วในข้อมูลที่ถูกดึงกลับมา
  if (
    fbMsg.includes(MARKER) ||
    dsMsg.includes(MARKER) ||
    fbMsg.includes(FINAL_MARKER_TEXT) ||
    dsMsg.includes(FINAL_MARKER_TEXT)
  ) {
    return true;
  }

  return false;
}

function addMarker(message) {
  const value = normalizeMessage(message);

  if (!value) return '';

  // ถ้ามีหัวสำเร็จอยู่แล้ว ไม่เติมซ้ำ
  if (value.includes(MARKER) || value.includes(FINAL_MARKER_TEXT)) {
    return value;
  }

  // รูปแบบปกติ
  if (value.includes(BASE_MARKER)) {
    return value.replace(BASE_MARKER, FINAL_MARKER_TEXT);
  }

  // กันกรณีมีช่องว่างหรือขึ้นบรรทัดต่างรูปแบบ
  const flexibleHeader = /📌\s*แจ้งเลขพัสดุจัดส่ง/;

  if (flexibleHeader.test(value)) {
    return value.replace(flexibleHeader, FINAL_MARKER_TEXT);
  }

  // ถ้าไม่มีหัวข้อความเลย ไม่สร้างข้อความปลอม
  return value;
}

function buildSourceKey(row) {
  const tracking = normalizeTracking(row.tracking_number);
  const parcelId = text(row.parcel_row_id || row.id);
  const upsertKey = text(row.upsert_key);
  const recipientId = text(row.recipient_id);
  const pageId = text(row.page_id);

  // ใช้ parcel_row_id ก่อน เพราะเป็นตัวแทนแถว parcels โดยตรง
  if (parcelId) return `parcel:${parcelId}`;

  // เลขพัสดุหนึ่งเลขลงได้ครั้งเดียว
  if (tracking) return `tracking:${tracking}`;

  // fallback กรณีข้อมูลยังไม่มีเลข
  if (upsertKey) return `order:${upsertKey}`;

  return `room:${pageId}:${recipientId}`;
}

function buildLockKey(row) {
  const sourceKey = buildSourceKey(row);
  const recipientId = text(row.recipient_id);
  const pageId = text(row.page_id);

  return `PRE_SEND:${sourceKey}:${pageId}:${recipientId}`;
}

const seen = new Set();
const output = [];
const rejected = [];

for (const item of $input.all()) {
  const row = item.json ?? {};

  const fbMsg = normalizeMessage(row.facebook_tracking_message);
  const dsMsg = normalizeMessage(row.drakside_tracking_message);

  const tracking = normalizeTracking(row.tracking_number);
  const pageId = text(row.page_id);
  const recipientId = text(row.recipient_id);
  const messageId = text(row.message_id);

  const sourceKey = buildSourceKey(row);
  const lockKey = buildLockKey(row);

  // ------------------------------------------------------------
  // 1. ข้อมูลขั้นต่ำต้องครบก่อนส่ง
  // ------------------------------------------------------------
  const missing = [];

  if (!tracking) missing.push('tracking_number');
  if (!pageId) missing.push('page_id');
  if (!recipientId) missing.push('recipient_id');
  if (!messageId) missing.push('message_id');
  if (!fbMsg && !dsMsg) missing.push('tracking_message');

  if (missing.length) {
    rejected.push({
      reason: 'MISSING_REQUIRED_FIELDS',
      missing,
      source_key: sourceKey,
      tracking_number: tracking,
      page_id: pageId,
      recipient_id: recipientId,
      message_id: messageId,
    });
    continue;
  }

  // ------------------------------------------------------------
  // 2. เคยลง Facebook แล้ว ห้ามหลุดไปส่งซ้ำ
  // ------------------------------------------------------------
  if (alreadyFacebookMarked(row, fbMsg, dsMsg)) {
    rejected.push({
      reason: 'ALREADY_FACEBOOK_MARKED',
      source_key: sourceKey,
      tracking_number: tracking,
      page_id: pageId,
      recipient_id: recipientId,
      message_id: messageId,
    });
    continue;
  }

  // ------------------------------------------------------------
  // 3. กันรายการซ้ำภายในรอบเดียวกัน
  // ------------------------------------------------------------
  if (seen.has(sourceKey)) {
    rejected.push({
      reason: 'DUPLICATE_IN_SAME_BATCH',
      source_key: sourceKey,
      tracking_number: tracking,
      page_id: pageId,
      recipient_id: recipientId,
      message_id: messageId,
    });
    continue;
  }

  seen.add(sourceKey);

  // ------------------------------------------------------------
  // 4. เติมหัว 📌📣 แบบ idempotent
  // ------------------------------------------------------------
  const preparedFbMsg = addMarker(fbMsg);
  const preparedDsMsg = addMarker(dsMsg);

  // ต้องมีข้อความที่พร้อมส่งจริง
  const sendText = preparedFbMsg || preparedDsMsg;

  if (!sendText) {
    rejected.push({
      reason: 'EMPTY_PREPARED_MESSAGE',
      source_key: sourceKey,
      tracking_number: tracking,
      page_id: pageId,
      recipient_id: recipientId,
      message_id: messageId,
    });
    continue;
  }

  const color = getColor(row);
  const now = new Date().toISOString();

  output.push({
    json: {
      ...row,

      // -----------------------------
      // identity สำหรับจับห้อง/กันซ้ำ
      // -----------------------------
      parcel_source_key: sourceKey,
      pre_send_lock_key: lockKey,
      page_recipient_key: `${pageId}:${recipientId}`,
      message_recipient_key: `${messageId}:${recipientId}`,

      // -----------------------------
      // แยกสายสี
      // -----------------------------
      parcel_color: color,
      parcel_lane:
        color === '🟢'
          ? 'GREEN'
          : color === '🟡'
            ? 'YELLOW'
            : color === '🔴'
              ? 'RED'
              : 'UNKNOWN',

      // -----------------------------
      // ข้อความที่เตรียมไว้
      // -----------------------------
      facebook_tracking_message: preparedFbMsg,
      drakside_tracking_message: preparedDsMsg,

      tracking_message_marker: MARKER,
      tracking_message_marker_text: FINAL_MARKER_TEXT,

      // -----------------------------
      // lock ก่อนส่ง
      // -----------------------------
      pre_send_lock: '📣',
      pre_send_lock_status: '📣PREPARED',
      pre_send_lock_at: now,
      pre_send_state: 'READY_FOR_FACEBOOK',

      // สำคัญ: ยังไม่ใช่ SENT
      // ห้ามตั้ง parcel_status_emoji เป็น ⚡SENT ตรงนี้
      facebook_tracking_status: '📣PREPARED',

      // ใช้หลัง Facebook API ตอบสำเร็จ
      success_update_status: '⚡SENT',
      success_marker: MARKER,
      success_sent_at_field: 'facebook_tracking_sent_at',

      // ข้อมูลสำหรับส่ง Facebook
      send_page_id: pageId,
      send_recipient_id: recipientId,
      send_thread_id: text(row.thread_id || row.threadId),
      send_message_id: messageId,
      send_text: sendText,

      // debug / audit
      pre_send_rejected_count: rejected.length,
      pre_send_batch_key: `${now}:${sourceKey}`,
    },
  });
}

// สรุปจำนวนแต่ละสาย
const laneCounts = output.reduce((result, item) => {
  const lane = item.json.parcel_lane || 'UNKNOWN';
  result[lane] = (result[lane] || 0) + 1;
  return result;
}, {});

// ส่งเฉพาะรายการที่พร้อมไป Facebook
// รายการที่ถูกสกัดจะไม่หลุดไป node ถัดไป
return output.map((item) => ({
  ...item,
  json: {
    ...item.json,
    pre_send_lane_counts: laneCounts,
    pre_send_ready_count: output.length,
    pre_send_rejected_count: rejected.length,
  },
}));
