create view public."📓DEAD_xXx_NOTE" as
select
  parcel.id as parcel_row_id,
  parcel.tracking_number,
  parcel.consignee as flash_consignee,
  parcel.phone_number as matched_phone,
  parcel.pickup_date,
  parcel.cod_amount as parcel_cod_amount,
  parcel.address as parcel_address,
  parcel.delivery_status,
  parcel.sent_at,
  ord.upsert_key,
  ord.page_id,
  ord."threadId",
  ord.customer_id,
  ord.page_name,
  ord.portal_key,
  ord.facebook_name,
  ord.customer_name,
  ord.phone,
  ord.extracted_phone,
  ord.order_number,
  ord.order_number_display,
  ord.order_date,
  ord.order_time,
  ord.order_time_display,
  ord.time_th,
  ord.cod_amount,
  ord.shipping_carrier,
  ord.address_display_packer,
  ord.addressclean,
  ord.district,
  ord.amphoe,
  ord.province,
  ord.zipcode,
  ord.sku,
  ord.manus_for_packer,
  ord.telegram_copy_text,
  ord.carton_count,
  ord.created_at,
  ord.updated_at,
  ord.assigned_agent,
  ord.chat_age_hours,
  ord.is_within_24h,
  ord.can_send_standard,
  ord.messaging_tag_required,
  ord.facebook_tracking_status,
  ord.facebook_tracking_sent_at,
  ord.delivery_state,
  ord.delivery_status as order_delivery_status,
  ord.message_id,
  ord.send_facebook_route,
  ord.target_room,
  ord.parcel_status_emoji,
  ord.facebook_tracking_message
from
  parcels parcel
  left join "🧿BB_xXx_ORDERCONTROL" ord on regexp_replace(
    COALESCE(ord.phone, ''::text),
    '[^0-9]'::text,
    ''::text,
    'g'::text
  ) = regexp_replace(
    COALESCE(parcel.phone_number, ''::text),
    '[^0-9]'::text,
    ''::text,
    'g'::text
  )
where
  NULLIF(btrim(parcel.tracking_number), ''::text) is not null
  and (
    (
      upper(btrim(COALESCE(parcel.delivery_status, ''::text))) = any (
        array[
          '🔥SENT'::text,
          '⚡SENT'::text,
          'SENT'::text,
          'SUCCESS'::text,
          'COMPLETED'::text,
          'DELIVERED'::text
        ]
      )
    )
    or (
      upper(
        btrim(COALESCE(ord.facebook_tracking_status, ''::text))
      ) = any (
        array[
          '🔥SENT'::text,
          '⚡SENT'::text,
          'SENT'::text,
          'SUCCESS'::text,
          'COMPLETED'::text,
          'DELIVERED'::text
        ]
      )
    )
    or (
      upper(
        btrim(COALESCE(ord.parcel_status_emoji, ''::text))
      ) = any (
        array[
          '🔥SENT'::text,
          '⚡SENT'::text,
          'SENT'::text,
          'SUCCESS'::text,
          'COMPLETED'::text,
          'DELIVERED'::text
        ]
      )
    )
  );