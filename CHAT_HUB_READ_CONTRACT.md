# ChatHub Read Contract — Protocol Lock v3

เอกสารนี้ล็อกเส้นทางอ่านของ ChatHub: อ่านจาก `public."🌠BINARY_xXx_MATRIX"` เพียงวิวเดียว ซึ่งรวมแถวจาก `public."Cust_Chat⭐BINARY_xXx_STAR"` และ `public."Pg_Chat⭐BINARY_xXx_STAR"` ด้วย `UNION ALL`. สองตารางต้นทางยังคงแยกกันสำหรับ workflow และการจัดเก็บ แต่ไม่ใช่เส้นอ่านหลักของหน้า ChatHub.

## กติกาที่ห้ามเปลี่ยนเอง

1. ChatHub อ่าน `🌠BINARY_xXx_MATRIX` ด้วย explicit column list ใน `server/supabase.ts`; ห้ามใช้ `select(*)` และห้ามยิง query แยกไปสองตารางจาก ChatHub.
2. ใช้ `page_id` + `thread_id` กรองห้อง และใช้ `chat_link_key` เป็นคีย์เชื่อมบริบทห้อง; `upsert_key` เป็นข้อมูลประกอบของออเดอร์ ไม่ใช่ตัวแทน `chat_link_key`.
3. `source_side` ระบุแถว `customer` หรือ `page`; mapper ใช้แยกฝั่งข้อความและคง source table identity สำหรับ UI.
4. `message_text` คือแหล่งเดียวของข้อความรายข้อความที่ใช้ทำ bubble/preview; ห้ามอ่าน `message_raw` หรือใช้ฟิลด์สรุปข้อความล่าสุดแทน.
5. `customer_latest_message` และ `page_latest_message` เป็นข้อมูลสรุปล่าสุดคนละฝั่ง ต้องเก็บ/แสดงแยกกัน ห้ามรวมเป็น field เดียวหรือใช้แทน `message_text`.
6. ใช้ `occurred_at` เพื่อเรียงเวลาและตัดช่วงข้อมูล; เวลาอ่านง่ายของแชทใช้ `time_th` หรือ `message_time_display` ตามที่มี และเวลา summary ของลูกค้า/เพจใช้คอลัมน์เวลาแยกของตน.
7. อ่านผ่าน protected server tRPC ด้วย Chat Supabase service-role เท่านั้น; URL/key ที่กรอกใน ROOM 02 เก็บใน localStorage ของ browser เครื่องนี้และส่งผ่าน HTTPS เฉพาะ Chat procedures ให้ server เป็นผู้เรียก Supabase.
8. ถ้า browser นี้ไม่มี Chat URL/key ครบ ห้ามเรียก Chat route หรือ Supabase; แสดงทางไปตั้งค่า ROOM 02 แทน ห้าม fallback ไป server env, Main, Tracking หรือ Parcel.
9. Meta page token อ่านจาก `🌈MILKY_WAY_xXx_TOKEN _PAGE` โดยกรอง `page_id` และเลือก `access_token` เท่านั้น; token vault ใช้ Chat credentials ชุดเดียวกัน ห้าม fallback ไปโปรเจกต์/ตาราง/คอลัมน์อื่น.
10. ปิด Supabase Realtime สำหรับ ChatHub; คง polling เดิม 15 วินาที (รายชื่อห้อง) และ 5 วินาที (ข้อความของห้องที่เลือก).
11. แผงข้อมูลจากตาราง Chat เป็น read-only; ห้ามเปลี่ยนการคำนวณ COD, การเชื่อม Order DNA, workflow/n8n, หรือขั้นตอนส่งข้อความโดยอาศัยการเปลี่ยนแปลงส่วนอ่านนี้.

## คอลัมน์ Matrix ที่ ChatHub อ่าน

`source_side`, `id`, `chat_link_key`, `page_id`, `page_name`, `portal_key`, `assigned_agent`, `assigned_hashtag`, `conversation_id`, `thread_id`, `customer_id`, `customer_name`, `recipient_id`, `recipient_name`, `message_id`, `speaker`, `is_sent`, `time`, `time_th`, `message_time_display`, `created_at`, `has_attachment`, `attachment_type`, `attachment_url`, `attachment_urls`, `attachments_raw`, `sticker_url`, `shares_link`, `chat_age_hours`, `is_within_24h`, `can_send_standard`, `is_24h_window_valid`, `messaging_tag_required`, `dedupe_key`, `sync_status`, `customer_chat_age_hours`, `send_facebook_route`, `occurred_at`, `message_text`, `drakside_tracking_message`, `tracking_number`, `parcel_status_emoji`, `facebook_tracking_message`, `upsert_key`, `order_number`, `order_number_display`, `order_time_display`, `customer_latest_message`, `customer_message_time_th`, `page_latest_message`, `page_message_time_th`, `order_time`, `cod_amount`, `phone`, `pager_message_time_th`, `manus_for_packer`, `facebook_name`, `shipping_carrier`.

## Protocol change

การเพิ่ม/ลบคอลัมน์หรือเปลี่ยนความหมายของ field ต้องได้รับคำยืนยันจากผู้ใช้ก่อน แล้วปรับ SQL view, constants, mapper, UI และ regression test พร้อมกัน และเพิ่มเลข protocol version เมื่อเป็นการเปลี่ยนสัญญา ไม่ให้การปรับ styling หรือแก้ logic ของ Order/COD แฝงมากับงานนี้.
