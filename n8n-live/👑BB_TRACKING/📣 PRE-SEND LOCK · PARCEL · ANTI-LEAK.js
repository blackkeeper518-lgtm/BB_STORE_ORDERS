// 📣 PRE-SEND LOCK · PARCEL · ANTI-LEAK
// วางก่อน 👣 LIMBO JUNCTION1 · Facebook API
//
// หน้าที่:
// 1. ตรวจเฉพาะ facebook_tracking_message: มี 📌📣 แล้วให้หยุดส่งซ้ำ
// 2. ไม่มี marker ให้ปั๊มหัวข้อความแล้วส่งต่อ โดยไม่คัดด้วยฟิลด์อื่น
// 3. ไม่ตรวจสถานะ, ฟิลด์บังคับ, duplicate ใน batch หรือข้อความว่าง
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

function alreadyFacebookMarked(fbMsg) {
  // ช่องเดียวที่ใช้สกัดรายการ: marker ส่งแล้วในข้อความ Facebook เท่านั้น
  return normalizeMessage(fbMsg).includes(MARKER);
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

const output = [];
let markerSkippedCount = 0;

for (const item of $input.all()) {
  const row = item.json ?? {};

  const fbMsg = normalizeMessage(row.facebook_tracking_message);
  const dsMsg = normalizeMessage(row.drakside_tracking_message);

  const tracking = normalizeTracking(row.tracking_number);
  const pageId = text(row.page_id);
  const recipientId = text(row.recipient_id || row.recipient_psid || row.customer_id);
  const messageId = text(row.message_id);

  const sourceKey = buildSourceKey(row);
  const lockKey = buildLockKey(row);

  // ตัวกรองเพียงข้อเดียว: ถ้าฟิลด์ facebook_tracking_message มี 📌📣 อยู่แล้ว ให้กันส่งซ้ำ
  if (alreadyFacebookMarked(fbMsg)) {
    markerSkippedCount += 1;
    continue;
  }

  // ไม่มี required-field checks, status checks, batch dedupe หรือ empty-message filter
  // ------------------------------------------------------------
  // 4. เติมหัว 📌📣 แบบ idempotent
  // ------------------------------------------------------------
  const preparedFbMsg = addMarker(fbMsg);
  const preparedDsMsg = addMarker(dsMsg);

  const sendText = preparedFbMsg || preparedDsMsg;

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
      pre_send_filtered_count: markerSkippedCount,
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
    pre_send_filtered_count: markerSkippedCount,
  },
}));
