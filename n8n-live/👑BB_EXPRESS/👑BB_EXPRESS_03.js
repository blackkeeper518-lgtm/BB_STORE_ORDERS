// n8n Code node
// Mode: Run Once for All Items
// ชื่อแนะนำ: 📣 PRE-SEND LOCK · PARCEL
// วางก่อน 👣 LIMBO JUNCTION1 (Facebook API)
//
// หน้าที่:
// - ไม่คำนวณอายุแชท
// - ไม่แตะ parcel_status_emoji
// - ไม่ใช้ 🔴/🔥SENT เป็นตัวล็อก
// - เตรียมค่า lock 📣 ให้ Supabase node ถัดไปเขียนลง parcels จริง
// - เตรียม marker 📣📌 ซึ่งจะติดไปกับข้อความ Facebook ที่ยิงจริง
//
// ลำดับที่ถูกต้อง:
//   TRACKING_NODE_01
//     → 📣 PRE-SEND LOCK (node นี้)
//     → Supabase UPDATE parcels.facebook_tracking_status = 📣
//     → 👣 LIMBO JUNCTION1 (Facebook API)
//
function clean(value) {
  return String(value ?? '').trim();
}

return $input.all().map((item) => {
  const row = item.json ?? {};
  return {
    json: {
      ...row,
      // สถานะล็อกในฐานข้อมูล: ใช้ตัดคิวรอบถัดไป
      pre_send_lock: '📣',
      pre_send_lock_status: '📣',
      pre_send_lock_at: new Date().toISOString(),
      // marker ที่ต้องอยู่ในข้อความที่ลูกค้าเห็นจริง
      tracking_message_marker: '📣📌',
      tracking_message_marker_text: '📣📌 แจ้งเลขพัสดุจัดส่ง',
      // คงสถานะหน้าต่างแชทเดิมไว้ ห้ามให้ marker ไปทับสี
      parcel_status_emoji: row.parcel_status_emoji,
      parcel_row_id: row.parcel_row_id || row.id || null,
      lock_match_phone: clean(row.phone || row.extracted_phone || row.phone_number),
    },
  };
});
