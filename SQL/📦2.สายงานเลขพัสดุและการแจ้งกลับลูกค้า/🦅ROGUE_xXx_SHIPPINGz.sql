create view public."🦅ROGUE_xXx_SHIPPINGz" as
select
  pcl.tracking_number,
  pcl.phone_number as matched_phone,
  COALESCE(
    NULLIF(btrim(ord.customer_name), ''::text),
    NULLIF(btrim(ord.facebook_name), ''::text)
  ) as recipient_name,
  pcl.address as parcel_address,
  ord.sku,
  ord.cod_amount,
  ord.upsert_key,
  ord.page_id,
  ord."threadId",
  ord.customer_id,
  ord.recipient_id,
  ord.message_id,
  jsonb_build_object('id', ord.message_id) as m,
  ord.shipping_carrier,
  ord.facebook_tracking_status,
  ord.order_number,
  ord.order_number_display,
  ord.order_time_display,
  pcl.id as parcel_row_id,
  pcl.pickup_date,
  pcl.delivery_status,
  pcl.delivery_status as parcel_delivery_status,
  pcl.sent_at,
  pcl.sent_at as parcel_sent_at,
  ord.page_name,
  ord.portal_key,
  ord.facebook_name,
  ord.customer_name,
  ord.phone,
  ord.extracted_phone,
  ord.order_date,
  ord.order_time,
  ord.time_th,
  ord.address_display_packer,
  ord.addressclean,
  ord.district,
  ord.amphoe,
  ord.province,
  ord.zipcode,
  ord.manus_for_packer,
  ord.telegram_copy_text,
  ord.delivery_state,
  ord.delivery_status as order_delivery_status,
  ord.carton_count,
  ord.created_at,
  ord.updated_at,
  ord.assigned_agent,
  ord.facebook_tracking_sent_at,
  ord.target_room,
  ord.chat_age_hours,
  ord.is_within_24h,
  ord.can_send_standard,
  ord.messaging_tag_required,
  ord.customer_latest_message,
  ord.customer_message_time_th,
  ord.page_latest_message,
  ord.page_message_time_th,
  ord.send_facebook_route,
  ord.parcel_status_emoji,
  ord.facebook_tracking_message,
  ord.drakside_tracking_message,
  ord.chat_link_key
from
  "🔮SHADOW_xXx_RECALL" pcl
  join "🧿BB_xXx_ORDERCONTROL" ord on ord.upsert_key = pcl.upsert_key
where
  NULLIF(btrim(pcl.tracking_number), ''::text) is not null
  and (
    upper(
      btrim(COALESCE(ord.facebook_tracking_status, ''::text))
    ) <> all (
      array[
        'SENT'::text,
        'DELIVERED'::text,
        '🔥SENT'::text,
        '⚡SENT'::text,
        'SENT_TO_TELEGRAM'::text,
        'SUCCESS'::text,
        'COMPLETED'::text
      ]
    )
  )
  and (
    upper(
      btrim(COALESCE(ord.parcel_status_emoji, ''::text))
    ) <> all (
      array[
        'SENT'::text,
        'DELIVERED'::text,
        '🔥SENT'::text,
        '⚡SENT'::text,
        'SENT_TO_TELEGRAM'::text,
        'SUCCESS'::text,
        'COMPLETED'::text
      ]
    )
  )
  and (
    upper(btrim(COALESCE(ord.delivery_status, ''::text))) <> all (
      array[
        'SENT'::text,
        'DELIVERED'::text,
        '🔥SENT'::text,
        '⚡SENT'::text,
        'SENT_TO_TELEGRAM'::text,
        'SUCCESS'::text,
        'COMPLETED'::text
      ]
    )
  )
  and not (
    COALESCE(ord.page_latest_message, ''::text) ~~* '%แจ้งเลขพัสดุจัดส่ง%'::text
    or COALESCE(ord.page_latest_message, ''::text) ~~* '%เลขพัสดุจะเริ่มเช็คสถานะ%'::text
  );