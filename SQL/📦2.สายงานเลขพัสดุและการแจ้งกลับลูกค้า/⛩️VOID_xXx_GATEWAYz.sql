create or replace view public."⛩️VOID_xXx_GATEWAYz" as
select
  pulse.upsert_key,
  pulse.page_id,
  pulse."threadId",
  pulse.customer_id,
  pulse.page_name,
  pulse.portal_key,
  pulse.facebook_name,
  pulse.customer_name,
  pulse.phone,
  pulse.extracted_phone,
  pulse.order_number,
  pulse.order_number_display,
  pulse.order_date,
  pulse.order_time,
  pulse.order_time_display,
  pulse.time_th,
  pulse.cod_amount,
  pulse.shipping_carrier,
  pulse.address_display_packer,
  pulse.addressclean,
  pulse.district,
  pulse.amphoe,
  pulse.province,
  pulse.zipcode,
  pulse.sku,
  pulse.manus_for_packer,
  pulse.telegram_copy_text,
  pulse.delivery_state,
  pulse.delivery_status,
  pulse.sent_at,
  pulse.order_delivery_status,
  pulse.carton_count,
  pulse.created_at,
  pulse.updated_at,
  pulse.assigned_agent,
  pulse.chat_age_hours,
  pulse.is_within_24h,
  pulse.can_send_standard,
  pulse.messaging_tag_required,
  pulse.facebook_tracking_status,
  pulse.facebook_tracking_sent_at,
  pulse.message_id,
  pulse.target_room,
  pulse.customer_latest_message,
  pulse.customer_message_time_th,
  pulse.page_latest_message,
  pulse.page_message_time_th,
  pulse.parcel_row_id,
  pulse.tracking_number,
  pulse.matched_phone,
  pulse.pickup_date,
  pulse.parcel_address,
  pulse.m,
  pulse.recipient_name,
  pulse.send_facebook_route,
  pulse.parcel_status_emoji,
  pulse.facebook_tracking_message,
  pulse.drakside_tracking_message,
  pulse.chat_link_key,
  page_map.access_token
from
  "🦅ROGUE_xXx_SHIPPINGz" pulse
  left join page_tokens_vault page_map on page_map.page_id = pulse.page_id
where
  NULLIF(btrim(pulse.tracking_number), ''::text) is not null
  and NULLIF(btrim(page_map.access_token), ''::text) is not null
  and (
    upper(
      btrim(
        COALESCE(pulse.facebook_tracking_status, ''::text)
      )
    ) <> all (
      array[
        '🔥SENT'::text,
        '⚡SENT'::text,
        'SENT'::text,
        'SUCCESS'::text,
        'COMPLETED'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  )
  and (
    upper(btrim(COALESCE(pulse.delivery_status, ''::text))) <> all (
      array[
        '🔥SENT'::text,
        '⚡SENT'::text,
        'SENT'::text,
        'SUCCESS'::text,
        'COMPLETED'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  )
  and (
    upper(
      btrim(COALESCE(pulse.parcel_status_emoji, ''::text))
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
  and strpos(
    COALESCE(pulse.facebook_tracking_message, ''::text),
    '📌📣'::text
  ) = 0;