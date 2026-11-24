-- VAGABOND · CHAT DISMISS / RETURN / CLOSE CASE VIEW
-- ================================================================================
-- ใช้ source tables จริงของ Chat โดยตรง
--   Cust_Chat⭐BINARY_xXx_STAR -> customer_message_text
--   Pg_Chat⭐BINARY_xXx_STAR   -> page_message_text
--
-- ห้อง Chat ใช้ page_id + thread_id
-- คีย์สำหรับส่งต่อให้ Order/Parcel Gateway: chat_link_key, upsert_key,
-- order_number, order_number_display, tracking_number
-- เลขพัสดุที่พบในแถว: tracking_number
--
-- ไม่สร้าง source_side และไม่อ้าง chat_page_messages / BINARY_MATRIX
-- Chat เป็นผู้ส่งสัญญาณเคส; ไม่ join ข้อมูล Order/Parcel ข้ามโปรเจกต์ด้วย SQL ตรง
-- การดึงรายละเอียด Order/Parcel ให้ server/n8n เปิดประตูมิติผ่าน
-- 🌍GALACTIC_GATEWAY_TOKEN ซึ่งเป็น server-only
-- ================================================================================

-- Projection เปลี่ยนจากวิวรุ่นเก่า จึง drop เฉพาะ view ก่อนสร้างใหม่
-- ไม่แตะข้อมูลใน Cust/Pg และไม่ใช้ CASCADE เพื่อไม่ลบ object อื่นโดยอ้อม
DROP VIEW IF EXISTS public."🌓VAGABOND_xXx_DISMISS";

CREATE VIEW public."🌓VAGABOND_xXx_DISMISS"
WITH (security_invoker = true) AS
WITH source_rows AS (
  SELECT
    'Cust_Chat⭐BINARY_xXx_STAR'::text AS source_table,
    m.id::text AS physical_id,
    NULLIF(m.message_row_id::text, '') AS message_row_id,
    m.chat_link_key,
    m.page_id,
    m.page_name,
    m.thread_id,
    m."threadId" AS thread_id_legacy,
    m.customer_id,
    m.customer_name,
    m.recipient_id,
    m.recipient_name,
    COALESCE(NULLIF(lower(trim(m.speaker)), ''), 'customer'::text) AS speaker_type,
    m.message_id,
    m.dedupe_key,
    m.occurred_at,
    m."time" AS message_time,
    m.created_at,
    m.customer_message_text,
    NULL::text AS page_message_text,
    m.facebook_tracking_message,
    m.drakside_tracking_message,
    NULL::text AS fb_tracking_message_for_web,
    NULL::text AS ds_tracking_message_for_web,
    m.tracking_number,
    m.order_number,
    m.order_number_display,
    m.upsert_key,
    m.phone,
    m.shipping_carrier,
    NULL::text AS branch,
    NULL::text AS carrier_employee,
    NULL::text AS area
  FROM public."Cust_Chat⭐BINARY_xXx_STAR" AS m

  UNION ALL

  SELECT
    'Pg_Chat⭐BINARY_xXx_STAR'::text AS source_table,
    m.id::text AS physical_id,
    NULLIF(m.message_row_id::text, '') AS message_row_id,
    m.chat_link_key,
    m.page_id,
    m.page_name,
    m.thread_id,
    m."threadId" AS thread_id_legacy,
    m.customer_id,
    m.customer_name,
    m.recipient_id,
    m.recipient_name,
    COALESCE(NULLIF(lower(trim(m.speaker)), ''), 'page'::text) AS speaker_type,
    m.message_id,
    m.dedupe_key,
    m.occurred_at,
    m."time" AS message_time,
    m.created_at,
    NULL::text AS customer_message_text,
    m.page_message_text,
    m.facebook_tracking_message,
    m.drakside_tracking_message,
    NULL::text AS fb_tracking_message_for_web,
    NULL::text AS ds_tracking_message_for_web,
    m.tracking_number,
    m.order_number,
    m.order_number_display,
    m.upsert_key,
    m.phone,
    m.shipping_carrier,
    NULL::text AS branch,
    NULL::text AS carrier_employee,
    NULL::text AS area
  FROM public."Pg_Chat⭐BINARY_xXx_STAR" AS m
), normalized AS (
  SELECT
    source_rows.*,
    COALESCE(
      NULLIF(source_rows.customer_message_text, ''),
      NULLIF(source_rows.page_message_text, ''),
      ''
    ) AS message_text,
    regexp_replace(
      COALESCE(
        NULLIF(source_rows.customer_message_text, ''),
        NULLIF(source_rows.page_message_text, ''),
        ''
      ),
      '[[:space:]]+',
      '',
      'g'
    ) AS normalized_message,
    COALESCE(
      source_rows.occurred_at,
      source_rows.message_time,
      source_rows.created_at
    ) AS event_time,
    COALESCE(
      NULLIF(source_rows.message_row_id, ''),
      NULLIF(source_rows.message_id, ''),
      NULLIF(source_rows.dedupe_key, ''),
      NULLIF(source_rows.physical_id, ''),
      md5(
        concat_ws(
          '|',
          source_rows.page_id,
          source_rows.thread_id,
          COALESCE(
            NULLIF(source_rows.customer_message_text, ''),
            NULLIF(source_rows.page_message_text, ''),
            ''
          )
        )
      )
    ) AS source_message_key
  FROM source_rows
), cases AS (
  SELECT
    md5(
      concat_ws(
        '|',
        normalized.source_table,
        normalized.source_message_key,
        normalized.page_id,
        normalized.thread_id,
        normalized.event_time::text,
        normalized.message_text
      )
    ) AS case_id,
    normalized.*
  FROM normalized
  WHERE normalized.normalized_message ~~* '%สินค้าหมด%'
     OR normalized.normalized_message ~~* '%ของหมด%'
     OR normalized.normalized_message ~~* '%หมดสต๊อก%'
     OR normalized.normalized_message ~~* '%ไม่มีสินค้า%'
     OR normalized.normalized_message ~~* '%สินค้าไม่พอ%'
     OR normalized.normalized_message ~~* '%หมดค่ะ%'
     OR normalized.normalized_message ~~* '%หมดคะ%'
     OR normalized.normalized_message ~~* '%หมดครับ%'
     OR normalized.normalized_message ~~* '%หมดจ้า%'
     OR normalized.normalized_message ~~* '%หมดแล้ว%'
     OR normalized.normalized_message ~~* '%outofstock%'
     OR normalized.normalized_message ~~* '%ปิดงาน%'
     OR normalized.normalized_message ~~* '%ยกเลิก%'
     OR normalized.normalized_message ~~* '%ไม่เอาแล้ว%'
     OR normalized.normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ'
)
SELECT
  cases.case_id AS id,
  cases.case_id,
  cases.source_table,
  cases.source_message_key,
  cases.message_row_id,
  cases.message_id,
  cases.dedupe_key,
  cases.chat_link_key,
  cases.page_id,
  cases.page_name,
  cases.thread_id,
  cases.thread_id AS conversation_key,
  cases.thread_id_legacy,
  cases.customer_id,
  cases.customer_name,
  cases.recipient_id,
  cases.recipient_name,
  cases.speaker_type,
  cases.event_time AS occurred_at,
  cases.customer_message_text,
  cases.page_message_text,
  cases.facebook_tracking_message,
  cases.drakside_tracking_message,
  cases.fb_tracking_message_for_web,
  cases.ds_tracking_message_for_web,
  cases.message_text,
  cases.tracking_number,
  cases.order_number,
  cases.order_number_display,
  cases.upsert_key,
  cases.phone,
  cases.shipping_carrier,
  cases.area,
  cases.branch,
  cases.carrier_employee,
  CASE
    WHEN cases.normalized_message ~~* '%สินค้าหมด%'
      OR cases.normalized_message ~~* '%ของหมด%'
      OR cases.normalized_message ~~* '%หมดสต๊อก%'
      OR cases.normalized_message ~~* '%ไม่มีสินค้า%'
      OR cases.normalized_message ~~* '%สินค้าไม่พอ%'
      OR cases.normalized_message ~~* '%หมดค่ะ%'
      OR cases.normalized_message ~~* '%หมดคะ%'
      OR cases.normalized_message ~~* '%หมดครับ%'
      OR cases.normalized_message ~~* '%หมดจ้า%'
      OR cases.normalized_message ~~* '%หมดแล้ว%'
      OR cases.normalized_message ~~* '%outofstock%' THEN 'สินค้าหมด / สต๊อกไม่พอ'
    WHEN cases.normalized_message ~~* '%ปิดงาน%' THEN 'ปิดงาน'
    WHEN cases.normalized_message ~~* '%ยกเลิก%'
      OR cases.normalized_message ~~* '%ไม่เอาแล้ว%' THEN 'ยกเลิก / ไม่เอาแล้ว'
    WHEN cases.normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ' THEN 'สั่งแล้วไม่รับ'
    ELSE NULL::text
  END AS case_type
FROM cases
;

COMMENT ON VIEW public."🌓VAGABOND_xXx_DISMISS" IS
'Chat case view: reads Cust/Pg source tables directly, uses customer_message_text/page_message_text, and exposes linkage keys for server-only Order/Parcel Gateway resolution without source_side.';
