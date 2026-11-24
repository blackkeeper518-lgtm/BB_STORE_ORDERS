# ST_CHAT SQL · ชุดใช้งานปัจจุบัน

ชุดนี้เป็น SQL หลักของ ST Chat และยึดโครงสร้าง append-only แบบ BB Chat
ไม่มีไฟล์ซ้ำระดับ root และไม่มี `CHAT_SUPPORT/` อีกชุด

## A. สร้าง Supabase โปรเจกต์ใหม่

รันตามลำดับนี้:

1. `Cust_Chat⭐BINARY_xXx_STAR.sql`
2. `Pg_Chat⭐BINARY_xXx_STAR.sql`
3. `CHAT_PER_MESSAGE_FIELDS.sql`
4. `CHAT APPEND-ONLY HISTORY.sql`
5. `CHAT_MESSAGE_ID_DEDUPE.sql` หลังตรวจ duplicate `message_id`
6. `INDEX.sql`
7. `GRANT USAGE ON SCHEMA.sql`
8. `🌓VAGABOND_xXx_DISMISS.sql`
9. `🏴_☠️SIRIUS_xXx_CRASH.sql`
10. `🌈MILKY_WAY_xXx_TOKEN _PAGE.sql`

## B. ย้ายเข้าฐานข้อมูลเดิมที่มีตารางอยู่แล้ว

- ถ้ายังไม่มี `customer_message_text/page_message_text` ให้รัน `CHAT_PER_MESSAGE_FIELDS.sql`
- ถ้า `chat_link_key` ยังเป็น primary key ให้รัน `CHAT APPEND-ONLY HISTORY.sql`
- ตรวจ duplicate และสร้าง unique guard ด้วย `CHAT_MESSAGE_ID_DEDUPE.sql`
- รัน `INDEX.sql` และ `GRANT USAGE ON SCHEMA.sql`
- รัน `🌓VAGABOND_xXx_DISMISS.sql` เพื่อสร้าง/อัปเดต view ที่ใช้งานจริง

## Contract ปัจจุบัน

- `Cust_Chat⭐BINARY_xXx_STAR` เก็บ `customer_message_text`
- `Pg_Chat⭐BINARY_xXx_STAR` เก็บ `page_message_text`
- `message_row_id` เป็น primary key รายข้อความ
- `message_id` เป็น unique key กันข้อความ Meta ซ้ำ
- `chat_link_key` ใช้รวม/ค้นหาห้องและซ้ำได้
- รูปภาพอยู่ใน `attachment_url`, `attachment_urls`, `attachments_raw`
- n8n ใช้ `on_conflict=message_id`
- ห้ามใช้ `on_conflict=chat_link_key`

## ไฟล์ที่ไม่อยู่ในชุดนี้โดยตั้งใจ

- `BINARY_CHAT_OBJECTS.sql` และ `CREATE_BINARY_MATRIX_AND_GRANTS.sql` ซ้ำกับ Matrix/View ชุดปัจจุบัน
- `CHAT_NOTIFICATION_POLL_INDEX.sql` ซ้ำกับ index ใน append-only migration
- `REMOVE_PG_MESSAGE_ID_UNIQUE.sql` เป็น workaround เก่า ไม่ตรงกับ contract ปัจจุบัน
- `FIX_BINARY_CHAT_DEDUPE_KEY.sql` เป็น contract เก่าที่ใช้ `dedupe_key`
- `🌠BINARY_xXx_MATRIX` และ `BINARY_MATRIX_time_slot_label.sql` ไม่ใช่ object ที่ ST ใช้งานปัจจุบัน จึงไม่รวมในชุดนี้
