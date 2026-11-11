-- รันใน SQL Editor ของ Supabase โปรเจกต์ Chat หลังสร้างตารางชื่อใหม่แล้ว
-- สร้าง Matrix/VAGABOND และคำอธิบาย schema โดยจำกัดสิทธิ์ให้อ่านผ่านฝั่ง server
CREATE OR REPLACE VIEW public."🌠BINARY_xXx_MATRIX"
WITH (security_invoker = true) AS
WITH source_rows AS (
  SELECT 'customer'::text AS source_side, to_jsonb(m.*) AS row_data
  FROM public."Cust_Chat⭐BINARY_xXx_STAR" AS m
  UNION ALL
  SELECT 'page'::text AS source_side, to_jsonb(m.*) AS row_data
  FROM public."Pg_Chat⭐BINARY_xXx_STAR" AS m
)
SELECT
  source_side,
  NULLIF(row_data ->> 'id', '')::bigint AS id,
  row_data ->> 'chat_link_key' AS chat_link_key,
  row_data ->> 'page_id' AS page_id,
  row_data ->> 'page_name' AS page_name,
  row_data ->> 'portal_key' AS portal_key,
  row_data ->> 'assigned_agent' AS assigned_agent,
  row_data ->> 'assigned_hashtag' AS assigned_hashtag,
  row_data ->> 'conversation_id' AS conversation_id,
  COALESCE(row_data ->> 'thread_id', row_data ->> 'threadId') AS thread_id,
  row_data ->> 'customer_id' AS customer_id,
  row_data ->> 'customer_name' AS customer_name,
  row_data ->> 'recipient_id' AS recipient_id,
  row_data ->> 'recipient_name' AS recipient_name,
  row_data ->> 'message_id' AS message_id,
  COALESCE(row_data ->> 'speaker', row_data ->> 'speaker_type', source_side) AS speaker,
  NULLIF(row_data ->> 'is_sent', '')::boolean AS is_sent,
  NULLIF(row_data ->> 'time', '')::timestamptz AS time,
  row_data ->> 'time_th' AS time_th,
  row_data ->> 'message_time_display' AS message_time_display,
  NULLIF(row_data ->> 'created_at', '')::timestamptz AS created_at,
  NULLIF(row_data ->> 'has_attachment', '')::boolean AS has_attachment,
  row_data ->> 'attachment_type' AS attachment_type,
  row_data ->> 'attachment_url' AS attachment_url,
  row_data -> 'attachment_urls' AS attachment_urls,
  row_data -> 'attachments_raw' AS attachments_raw,
  row_data ->> 'sticker_url' AS sticker_url,
  row_data ->> 'shares_link' AS shares_link,
  NULLIF(row_data ->> 'chat_age_hours', '')::numeric AS chat_age_hours,
  NULLIF(row_data ->> 'is_within_24h', '')::boolean AS is_within_24h,
  NULLIF(row_data ->> 'can_send_standard', '')::boolean AS can_send_standard,
  NULLIF(row_data ->> 'is_24h_window_valid', '')::boolean AS is_24h_window_valid,
  row_data ->> 'messaging_tag_required' AS messaging_tag_required,
  row_data ->> 'dedupe_key' AS dedupe_key,
  row_data ->> 'sync_status' AS sync_status,
  row_data ->> 'customer_chat_age_hours' AS customer_chat_age_hours,
  row_data ->> 'send_facebook_route' AS send_facebook_route,
  COALESCE(
    NULLIF(row_data ->> 'occurred_at', ''),
    NULLIF(row_data ->> 'time', ''),
    NULLIF(row_data ->> 'created_at', ''),
    NULLIF(row_data ->> 'synced_at', '')
  )::timestamptz AS occurred_at,
  row_data ->> 'message_text' AS message_text,
  row_data ->> 'drakside_tracking_message' AS drakside_tracking_message,
  row_data ->> 'tracking_number' AS tracking_number,
  row_data ->> 'parcel_status_emoji' AS parcel_status_emoji,
  row_data ->> 'facebook_tracking_message' AS facebook_tracking_message,
  row_data ->> 'upsert_key' AS upsert_key,
  row_data ->> 'order_number' AS order_number,
  row_data ->> 'order_number_display' AS order_number_display,
  row_data ->> 'order_time_display' AS order_time_display,
  row_data ->> 'customer_latest_message' AS customer_latest_message,
  row_data ->> 'customer_message_time_th' AS customer_message_time_th,
  row_data ->> 'page_latest_message' AS page_latest_message,
  row_data ->> 'page_message_time_th' AS page_message_time_th,
  row_data ->> 'order_time' AS order_time,
  NULLIF(row_data ->> 'cod_amount', '')::numeric(12, 2) AS cod_amount,
  row_data ->> 'phone' AS phone,
  row_data ->> 'pager_message_time_th' AS pager_message_time_th,
  row_data ->> 'manus_for_packer' AS manus_for_packer,
  row_data ->> 'facebook_name' AS facebook_name,
  row_data ->> 'shipping_carrier' AS shipping_carrier
FROM source_rows;

CREATE OR REPLACE VIEW public."🌓VAGABOND_xXx_DISMISS"
with
  (security_invoker = true) as
with
  source_rows as (
    select
      'customer'::text as source_side,
      to_jsonb(m.*) as row_data
    from
      public."Cust_Chat⭐BINARY_xXx_STAR" AS m
    union all
    select
      'page'::text as source_side,
      to_jsonb(m.*) as row_data
    from
      public."Pg_Chat⭐BINARY_xXx_STAR" AS m
  ),
  normalized as (
    select
      source_rows.source_side,
      COALESCE(
        source_rows.row_data ->> 'id'::text,
        source_rows.row_data ->> 'source_message_id'::text,
        source_rows.row_data ->> 'dedupe_key'::text,
        ''::text
      ) as source_id,
      COALESCE(
        source_rows.row_data ->> 'page_id'::text,
        source_rows.row_data ->> 'pageId'::text,
        ''::text
      ) as page_id,
      COALESCE(
        source_rows.row_data ->> 'page_name'::text,
        source_rows.row_data ->> 'pageName'::text,
        ''::text
      ) as page_name,
      COALESCE(
        source_rows.row_data ->> 'thread_id'::text,
        source_rows.row_data ->> 'conversation_key'::text,
        source_rows.row_data ->> 'conversation_id'::text,
        ''::text
      ) as conversation_key,
      COALESCE(
        source_rows.row_data ->> 'customer_id'::text,
        source_rows.row_data ->> 'sender_id'::text,
        ''::text
      ) as customer_id,
      COALESCE(
        source_rows.row_data ->> 'customer_name'::text,
        source_rows.row_data ->> 'sender_name'::text,
        source_rows.row_data ->> 'facebook_name'::text,
        ''::text
      ) as customer_name,
      case
        when lower(
          COALESCE(
            NULLIF(source_rows.row_data ->> 'speaker'::text, ''::text),
            NULLIF(source_rows.row_data ->> 'speaker_type'::text, ''::text),
            source_rows.source_side
          )
        ) = any (
          array[
            'page'::text,
            'admin'::text,
            'business'::text,
            'outbound'::text
          ]
        ) then 'page'::text
        else 'customer'::text
      end as speaker_type,
      COALESCE(
        source_rows.row_data ->> 'occurred_at'::text,
        source_rows.row_data ->> 'time'::text,
        source_rows.row_data ->> 'created_at'::text,
        source_rows.row_data ->> 'synced_at'::text,
        ''::text
      ) as occurred_at,
      COALESCE(
        source_rows.row_data ->> 'message_text'::text,
        ''::text
      ) as message_text,
      regexp_replace(
        COALESCE(
        source_rows.row_data ->> 'message_text'::text,
        ''::text
      ),
        '[[:space:]]+'::text,
        ''::text,
        'g'::text
      ) as normalized_message,
      COALESCE(
        NULLIF(
          source_rows.row_data ->> 'delivery_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'service_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'shipping_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'route_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'delivery_zone'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'shipping_zone'::text,
          ''::text
        ),
        NULLIF(source_rows.row_data ->> 'route'::text, ''::text),
        NULLIF(source_rows.row_data ->> 'area'::text, ''::text),
        NULLIF(
          concat_ws(
            ' / '::text,
            NULLIF(
              source_rows.row_data ->> 'district'::text,
              ''::text
            ),
            NULLIF(source_rows.row_data ->> 'amphoe'::text, ''::text),
            NULLIF(
              source_rows.row_data ->> 'province'::text,
              ''::text
            )
          ),
          ''::text
        ),
        ''::text
      ) as area,
      COALESCE(
        NULLIF(
          source_rows.row_data ->> 'branch_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'store_branch'::text,
          ''::text
        ),
        NULLIF(source_rows.row_data ->> 'branch'::text, ''::text),
        ''::text
      ) as branch,
      COALESCE(
        NULLIF(
          source_rows.row_data ->> 'carrier_employee'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'delivery_staff_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'driver_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'courier_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'shipping_staff'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'rider_name'::text,
          ''::text
        ),
        ''::text
      ) as carrier_employee,
      COALESCE(
        source_rows.row_data ->> 'tracking_number'::text,
        source_rows.row_data ->> 'parcel_tracking_number'::text,
        ''::text
      ) as tracking_number,
      COALESCE(
        source_rows.row_data ->> 'order_number'::text,
        source_rows.row_data ->> 'order_number_display'::text,
        ''::text
      ) as order_number
    from
      source_rows
  )
select
  md5(
    concat_ws(
      '|'::text,
      source_side,
      source_id,
      page_id,
      conversation_key,
      speaker_type,
      occurred_at,
      message_text
    )
  ) as id,
  page_id,
  page_name,
  conversation_key,
  customer_id,
  customer_name,
  speaker_type,
  occurred_at,
  message_text,
  tracking_number,
  order_number,
  case
    when normalized_message ~~* '%ปิดงาน%'::text then 'ปิดงาน'::text
    when normalized_message ~~* '%ยกเลิก%'::text
    or normalized_message ~~* '%ไม่เอาแล้ว%'::text then 'ยกเลิก / ไม่เอาแล้ว'::text
    when normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ'::text then 'สั่งแล้วไม่รับ'::text
    else null::text
  end as case_type,
  area,
  branch,
  carrier_employee
from
  normalized
where
  normalized_message ~~* '%ปิดงาน%'::text
  or normalized_message ~~* '%ยกเลิก%'::text
  or normalized_message ~~* '%ไม่เอาแล้ว%'::text
  or normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ'::text;

-- คำอธิบายวัตถุของ BINARY Chat; ตั้งใจจำกัดการอ่านไว้ที่ service_role
COMMENT ON TABLE public."Cust_Chat⭐BINARY_xXx_STAR" IS 'ข้อความขาเข้าจากลูกค้า แถวละหนึ่งข้อความ; message_text คือเนื้อหาหลัก, thread_id/chat_link_key ใช้เชื่อมห้อง และ phone ใช้ค้นหา ไม่ใช่คีย์กันซ้ำ.';
COMMENT ON COLUMN public."Cust_Chat⭐BINARY_xXx_STAR".message_text IS 'แหล่งเนื้อหาข้อความเดียวที่หน้า ChatHub และ view ใช้อ่าน.';
COMMENT ON COLUMN public."Cust_Chat⭐BINARY_xXx_STAR".chat_link_key IS 'คีย์เชื่อมข้อความกับห้องสนทนา; อาจซ้ำหลายข้อความในห้องเดียวกัน.';
COMMENT ON COLUMN public."Cust_Chat⭐BINARY_xXx_STAR".phone IS 'เบอร์โทรสำหรับค้นหาข้ามโต๊ะ; ไม่ใช้เป็น unique key.';

COMMENT ON TABLE public."Pg_Chat⭐BINARY_xXx_STAR" IS 'ข้อความขาออกจากเพจ แยกจากข้อความขาเข้าของลูกค้า; message_text คือเนื้อหาหลัก.';
COMMENT ON COLUMN public."Pg_Chat⭐BINARY_xXx_STAR".message_text IS 'แหล่งเนื้อหาข้อความเดียวที่หน้า ChatHub และ view ใช้อ่าน.';
COMMENT ON COLUMN public."Pg_Chat⭐BINARY_xXx_STAR".chat_link_key IS 'คีย์เชื่อมข้อความกับห้องสนทนา; อาจซ้ำหลายข้อความในห้องเดียวกัน.';

COMMENT ON VIEW public."🌠BINARY_xXx_MATRIX" IS 'จุดอ่านเดียวของ ChatHub รวมข้อความจาก Cust/Pg ด้วย UNION ALL; message_text เป็นเนื้อหารายข้อความเพียงแหล่งเดียว, source_side ระบุตารางต้นทาง และ speaker ระบุผู้พูด.';
COMMENT ON VIEW public."🌓VAGABOND_xXx_DISMISS" IS 'วิวอ่าน message_text จาก Cust_Chat⭐BINARY_xXx_STAR และ Pg_Chat⭐BINARY_xXx_STAR เพื่อคัดเคสปิดงาน/ยกเลิก พร้อมข้อมูลพื้นที่และผู้ขนส่งที่มีในแถว.';
COMMENT ON TABLE public."🏴‍☠️SIRIUS_xXx_CRASH" IS 'บันทึก/สถานะที่ดูแลต่อสำหรับเคส; ใช้ case_id เชื่อมกับ id ของแถวใน 🌓VAGABOND_xXx_DISMISS.';
COMMENT ON TABLE public."🌈MILKY_WAY_xXx_TOKEN _PAGE" IS 'คลัง Meta Page Token keyed ด้วย page_id; ให้อ่านเฉพาะฝั่ง server/service_role และห้ามเปิดให้ anon หรือ browser.';
COMMENT ON COLUMN public."🌈MILKY_WAY_xXx_TOKEN _PAGE".access_token IS 'Meta Page Access Token; อ่านด้วย CHAT_SUPABASE_SERVICE_ROLE_KEY เท่านั้น.';

-- ถอนสิทธิ์อ่าน/เขียนจาก browser roles และ PUBLIC; ChatHub อ่านผ่าน server ด้วย service_role เท่านั้น
REVOKE ALL PRIVILEGES ON TABLE
  public."Cust_Chat⭐BINARY_xXx_STAR",
  public."Pg_Chat⭐BINARY_xXx_STAR",
  public."🌠BINARY_xXx_MATRIX",
  public."🌓VAGABOND_xXx_DISMISS",
  public."🏴‍☠️SIRIUS_xXx_CRASH",
  public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE
  public."Cust_Chat⭐BINARY_xXx_STAR_id_seq",
  public."Pg_Chat⭐BINARY_xXx_STAR_id_seq"
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public."Cust_Chat⭐BINARY_xXx_STAR" TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public."Pg_Chat⭐BINARY_xXx_STAR" TO service_role;
GRANT SELECT ON TABLE public."🌠BINARY_xXx_MATRIX" TO service_role;
GRANT SELECT ON TABLE public."🌓VAGABOND_xXx_DISMISS" TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public."🏴‍☠️SIRIUS_xXx_CRASH" TO service_role;
GRANT SELECT ON TABLE public."🌈MILKY_WAY_xXx_TOKEN _PAGE" TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public."Cust_Chat⭐BINARY_xXx_STAR_id_seq" TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public."Pg_Chat⭐BINARY_xXx_STAR_id_seq" TO service_role;
