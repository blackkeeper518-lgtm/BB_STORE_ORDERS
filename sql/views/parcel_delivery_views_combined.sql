-- BB STORE ORDERS · Parcel Delivery Views
-- รวมจากไฟล์แนบ pasted_content_2.txt
-- ลำดับ dependency: SHADOW -> ROGUE -> VOID -> DEAD
-- คง logic ของ SQL เดิม ไม่ได้เพิ่มเงื่อนไขทางธุรกิจ

-- 1. SHADOW · จับคู่พัสดุกับออเดอร์
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

  -- 2. ROGUE · คิวพัสดุรอส่งเลข
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


  -- 3. VOID · ประตูส่งเลขไป Facebook
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


  -- 4. DEAD · ประวัติส่งเลขแล้ว
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
