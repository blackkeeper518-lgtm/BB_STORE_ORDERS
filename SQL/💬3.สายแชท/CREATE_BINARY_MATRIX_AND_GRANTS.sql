-- รันใน SQL Editor ของ Supabase โปรเจกต์ Chat
-- สร้าง view รวมข้อความสองตารางก่อน แล้วเปิดอ่านให้ service_role ฝั่ง server เท่านั้น

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

COMMENT ON VIEW public."🌠BINARY_xXx_MATRIX" IS
  'จุดอ่านเดียวของ ChatHub รวมข้อความจาก Cust/Pg; message_text เป็นแหล่งเนื้อหารายข้อความ, source_side ระบุตารางต้นทาง และ speaker ระบุผู้พูด.';

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON TABLE
  public."Cust_Chat⭐BINARY_xXx_STAR",
  public."Pg_Chat⭐BINARY_xXx_STAR",
  public."🌠BINARY_xXx_MATRIX"
TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public."🌠BINARY_xXx_MATRIX"
FROM PUBLIC, anon, authenticated;
