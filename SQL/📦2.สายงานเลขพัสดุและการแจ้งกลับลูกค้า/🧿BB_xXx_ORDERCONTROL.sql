create table public."🧿BB_xXx_ORDERCONTROL" (
  upsert_key text not null,
  page_id text not null,
  "threadId" text null,
  customer_id text null,
  page_name text null,
  facebook_name text null,
  customer_name text null,
  phone text null,
  extracted_phone text null,
  order_number text null,
  order_number_display text null,
  order_date text null,
  order_time timestamp with time zone null,
  order_time_display text null,
  time_th text null,
  cod_amount numeric(12, 2) null,
  shipping_carrier text null,
  address_display_packer text null,
  addressclean text null,
  district text null,
  amphoe text null,
  province text null,
  zipcode text null,
  sku text null,
  manus_for_packer text null,
  telegram_copy_text text null,
  order_status text null,
  delivery_state text null,
  delivery_status text null,
  carton_count smallint null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  assigned_agent text null,
  chat_age_hours numeric(5, 1) null,
  is_within_24h boolean null,
  can_send_standard boolean null,
  messaging_tag_required character varying(50) null,
  facebook_tracking_status text null,
  facebook_tracking_sent_at text null,
  message_id text null,
  target_room text null,
  tracking_check text null,
  recipient_id text null,
  recipient_name text null,
  page_message_time_th text null,
  customer_message_time_th text null,
  customer_latest_message text null,
  page_latest_message text null,
  latest_message text null,
  customer_time_val bigint null default 0,
  page_time_val bigint null default 0,
  bb_express_send_route text null default '⚪'::text,
  is_safety_white boolean null default true,
  order_hour integer null default 0,
  send_facebook_route text null,
  sent_at timestamp without time zone null,
  portal_key text null,
  original text null,
  telegram_message text null,
  assigned_hashtag text null,
  conversation_id text null,
  thread_id text null default ''::text,
  provider_message_id text null,
  message_text text null,
  message_raw text null,
  sniper_x_text_clean text null,
  speaker text null,
  is_sent boolean null default false,
  dedupe_key text null,
  conversation_key text null,
  sync_status text null default 'READY_TO_SAVE'::text,
  "time" timestamp with time zone null,
  occurred_at timestamp with time zone null default now(),
  message_time_display text null,
  has_attachment boolean null default false,
  attachment_type text null,
  attachment_url text null,
  attachment_urls jsonb null default '[]'::jsonb,
  attachments_raw jsonb null default '[]'::jsonb,
  sticker_url text null,
  shares_link text null,
  customer_chat_age_hours numeric null,
  is_24h_window_valid boolean null default true,
  chat_page_messages text null,
  id text null,
  parcel_status_emoji text null,
  facebook_tracking_message text null,
  drakside_tracking_message text null,
  access_token text null,
  bkk_cutoff_route text null,
  "customerMessageTimeTh" text null,
  tracking_number text null,
  chat_link_key text null,
  m text null,
  phone_candidates jsonb null,
  pager_message_time_th text null,
  admin_tracking_number text null,
  admin_tracking_carrier text null,
  admin_tracking_found boolean null,
  admin_tracking_source text null,
  has_tracking_notice boolean null,
  already_sent boolean null,
  "sendFacebookRoute" text null,
  route_source text null,
  signature_status text null,
  constraint "🧿BB_xXx_ORDERCONTROL_pkey" primary key (upsert_key),
  constraint ordercontrol_message_id_key unique (message_id)
) TABLESPACE pg_default;




create view public."🔮SHADOW_xXx_RECALL" as
select
  p.id,
  m.portal_key,
  m.page_name,
  p.pickup_date,
  p.tracking_number,
  p.consignee,
  p.phone_number,
  p.address,
  p.cod_amount,
  p.delivery_status,
  p.sent_at,
  m.parcel_status_emoji,
  m.upsert_key
from
  parcels p
  join lateral (
    select
      ord.portal_key,
      ord.page_name,
      ord.parcel_status_emoji,
      ord.upsert_key
    from
      "🧿BB_xXx_ORDERCONTROL" ord
    where
      NULLIF(btrim(ord.portal_key), ''::text) is not null
      and (
        NULLIF(btrim(p.upsert_key), ''::text) is not null
        and btrim(ord.upsert_key) = btrim(p.upsert_key)
        or NULLIF(btrim(p.order_number), ''::text) is not null
        and NULLIF(btrim(ord.order_number), ''::text) is not null
        and btrim(ord.order_number) = btrim(p.order_number)
        or NULLIF(btrim(p.portal_key), ''::text) is not null
        and btrim(ord.portal_key) = btrim(p.portal_key)
        or regexp_replace(
          COALESCE(p.phone_number, ''::text),
          '[^0-9]'::text,
          ''::text,
          'g'::text
        ) <> ''::text
        and regexp_replace(
          COALESCE(ord.phone, ''::text),
          '[^0-9]'::text,
          ''::text,
          'g'::text
        ) = regexp_replace(
          COALESCE(p.phone_number, ''::text),
          '[^0-9]'::text,
          ''::text,
          'g'::text
        )
      )
    order by
      (
        case
          when NULLIF(btrim(p.upsert_key), ''::text) is not null
          and btrim(ord.upsert_key) = btrim(p.upsert_key) then 0
          when NULLIF(btrim(p.order_number), ''::text) is not null
          and NULLIF(btrim(ord.order_number), ''::text) is not null
          and btrim(ord.order_number) = btrim(p.order_number) then 1
          when NULLIF(btrim(p.portal_key), ''::text) is not null
          and btrim(ord.portal_key) = btrim(p.portal_key) then 2
          else 3
        end
      ),
      (
        case
          when NULLIF(btrim(p.pickup_date), ''::text) is not null
          and ord.order_time is not null then abs(
            EXTRACT(
              epoch
              from
                p.pickup_date::timestamp with time zone - ord.order_time
            )
          )
          else null::numeric
        end
      ),
      ord.order_time desc nulls last,
      ord.updated_at desc nulls last,
      ord.upsert_key
    limit
      1
  ) m on true
where
  p.pickup_date::timestamp without time zone >= (now() - '2 days'::interval)
  and (
    p.delivery_status is null
    or btrim(p.delivery_status) = ''::text
    or upper(btrim(p.delivery_status)) = 'PENDING'::text
  )
  and (
    upper(btrim(COALESCE(p.delivery_status, ''::text))) <> all (
      array[
        'SENT'::text,
        'DELIVERED'::text,
        '🔥SENT'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  );

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
  pcl.sent_at,
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
  ord.dedupe_key
from
  "🔮SHADOW_xXx_RECALL" pcl
  join "🧿BB_xXx_ORDERCONTROL" ord on ord.upsert_key = pcl.upsert_key
where
  NULLIF(btrim(pcl.tracking_number), ''::text) is not null
  and (
    ord.facebook_tracking_status is null
    or (
      upper(btrim(ord.facebook_tracking_status)) <> all (
        array[
          'SENT'::text,
          'DELIVERED'::text,
          '🔥SENT'::text,
          'SENT_TO_TELEGRAM'::text,
          'SUCCESS'::text,
          'COMPLETED'::text
        ]
      )
    )
  )
  and not (
    COALESCE(ord.page_latest_message, ''::text) ~~* '%แจ้งเลขพัสดุจัดส่ง%'::text
    or COALESCE(ord.page_latest_message, ''::text) ~~* '%เลขพัสดุจะเริ่มเช็คสถานะ%'::text
  );


  create view public."⛩️VOID_xXx_GATEWAYz" as
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
        'SENT'::text,
        'SUCCESS'::text,
        'COMPLETED'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  );


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
          'SENT'::text,
          'SUCCESS'::text,
          'COMPLETED'::text,
          'DELIVERED'::text
        ]
      )
    )
  );

  