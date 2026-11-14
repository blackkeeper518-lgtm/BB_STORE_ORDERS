-- BB STORE ORDERS · Parcel Delivery Views · PHONE ONLY
-- ตรงกับ schema public.parcels จริง
-- parcels ใช้จับคู่ด้วยเบอร์เท่านั้น:
-- parcels.phone_number / parcels.order_phone
-- เทียบกับ ORDERCONTROL.phone / ORDERCONTROL.extracted_phone
-- ลำดับ dependency: SHADOW -> ROGUE -> VOID -> DEAD

-- 1. SHADOW · จับคู่พัสดุกับออเดอร์ด้วยเบอร์โทรเท่านั้น
create or replace view public."🔮SHADOW_xXx_RECALL" as
select
  p.id,
  ord.portal_key,
  ord.page_name,
  p.pickup_date,
  p.tracking_number,
  p.consignee,
  p.phone_number,
  p.address,
  p.cod_amount,
  null::text as delivery_status,
  null::text as sent_at,
  ord.parcel_status_emoji,
  ord.upsert_key
from public.parcels p
join lateral (
  select
    o.portal_key,
    o.page_name,
    o.parcel_status_emoji,
    o.upsert_key,
    o.order_time,
    o.updated_at
  from public."🧿ST_xXx_ORDERCONTROL" o
  where (
    regexp_replace(coalesce(o.phone, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(p.phone_number, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(o.phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p.phone_number, ''), '[^0-9]', '', 'g')
  )
  or (
    regexp_replace(coalesce(o.extracted_phone, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(p.phone_number, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(o.extracted_phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p.phone_number, ''), '[^0-9]', '', 'g')
  )
  or (
    regexp_replace(coalesce(o.phone, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(p.order_phone, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(o.phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p.order_phone, ''), '[^0-9]', '', 'g')
  )
  or (
    regexp_replace(coalesce(o.extracted_phone, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(p.order_phone, ''), '[^0-9]', '', 'g') <> ''
    and regexp_replace(coalesce(o.extracted_phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p.order_phone, ''), '[^0-9]', '', 'g')
  )
  order by o.order_time desc nulls last, o.updated_at desc nulls last, o.upsert_key
  limit 1
) ord on true
where nullif(btrim(p.tracking_number), '') is not null
  and (
    nullif(btrim(p.phone_number), '') is not null
    or nullif(btrim(p.order_phone), '') is not null
  );
  

-- 2. ROGUE · คิวพัสดุรอส่งเลข
create or replace view public."🦅ROGUE_xXx_SHIPPINGz" as
select
  pcl.tracking_number,
  pcl.phone_number as matched_phone,
  coalesce(nullif(btrim(ord.customer_name), ''), nullif(btrim(ord.facebook_name), '')) as recipient_name,
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
from public."🔮SHADOW_xXx_RECALL" pcl
join public."🧿BB_xXx_ORDERCONTROL" ord on ord.upsert_key = pcl.upsert_key
where nullif(btrim(pcl.tracking_number), '') is not null
  and upper(btrim(coalesce(ord.facebook_tracking_status, ''))) not in ('SENT', 'DELIVERED', '🔥SENT', '⚡SENT', 'SENT_TO_TELEGRAM', 'SUCCESS', 'COMPLETED')
  and upper(btrim(coalesce(ord.parcel_status_emoji, ''))) not in ('SENT', 'DELIVERED', '🔥SENT', '⚡SENT', 'SENT_TO_TELEGRAM', 'SUCCESS', 'COMPLETED')
  and upper(btrim(coalesce(ord.delivery_status, ''))) not in ('SENT', 'DELIVERED', '🔥SENT', '⚡SENT', 'SENT_TO_TELEGRAM', 'SUCCESS', 'COMPLETED')
  and not (
    coalesce(ord.page_latest_message, '') ilike '%แจ้งเลขพัสดุจัดส่ง%'
    or coalesce(ord.page_latest_message, '') ilike '%เลขพัสดุจะเริ่มเช็คสถานะ%'
  );

-- 3. VOID · ประตูส่งเลขไป Facebook
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
from public."🦅ROGUE_xXx_SHIPPINGz" pulse
left join public.page_tokens_vault page_map on page_map.page_id = pulse.page_id
where nullif(btrim(pulse.tracking_number), '') is not null
  and nullif(btrim(page_map.access_token), '') is not null
  and upper(btrim(coalesce(pulse.facebook_tracking_status, ''))) not in ('🔥SENT', '⚡SENT', 'SENT', 'SUCCESS', 'COMPLETED', 'DELIVERED', 'SENT_TO_TELEGRAM')
  and upper(btrim(coalesce(pulse.delivery_status, ''))) not in ('🔥SENT', '⚡SENT', 'SENT', 'SUCCESS', 'COMPLETED', 'DELIVERED', 'SENT_TO_TELEGRAM')
  and upper(btrim(coalesce(pulse.parcel_status_emoji, ''))) not in ('SENT', 'DELIVERED', '🔥SENT', '⚡SENT', 'SENT_TO_TELEGRAM', 'SUCCESS', 'COMPLETED');

-- 4. DEAD · ประวัติส่งเลขแล้ว
-- parcels ไม่มี delivery_status/sent_at จึงใช้สถานะจาก ORDERCONTROL เป็นตัวตัดสิน
create or replace view public."📓DEAD_xXx_NOTE" as
select
  parcel.id as parcel_row_id,
  parcel.tracking_number,
  parcel.consignee as flash_consignee,
  parcel.phone_number as matched_phone,
  parcel.pickup_date,
  parcel.cod_amount as parcel_cod_amount,
  parcel.address as parcel_address,
  null::text as delivery_status,
  null::text as parcel_delivery_status,
  null::timestamptz as sent_at,
  null::timestamptz as parcel_sent_at,
  ord.upsert_key,
  ord.page_id,
  ord."threadId",
  ord.customer_id,
  ord.recipient_id,
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
  ord.carton_count,a
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
  ord.facebook_tracking_message,
  ord.chat_link_key,
  ord.drakside_tracking_message
from public.parcels parcel
left join public."🧿BB_xXx_ORDERCONTROL" ord
  on regexp_replace(coalesce(ord.phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(parcel.phone_number, ''), '[^0-9]', '', 'g')
  or regexp_replace(coalesce(ord.extracted_phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(parcel.phone_number, ''), '[^0-9]', '', 'g')
  or regexp_replace(coalesce(ord.phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(parcel.order_phone, ''), '[^0-9]', '', 'g')
  or regexp_replace(coalesce(ord.extracted_phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(parcel.order_phone, ''), '[^0-9]', '', 'g')
where nullif(btrim(parcel.tracking_number), '') is not null
  and (
    upper(btrim(coalesce(ord.facebook_tracking_status, ''))) in ('🔥SENT', '⚡SENT', 'SENT', 'SUCCESS', 'COMPLETED', 'DELIVERED')
    or upper(btrim(coalesce(ord.parcel_status_emoji, ''))) in ('🔥SENT', '⚡SENT', 'SENT', 'SUCCESS', 'COMPLETED', 'DELIVERED')
    or upper(btrim(coalesce(ord.delivery_status, ''))) in ('🔥SENT', '⚡SENT', 'SENT', 'SUCCESS', 'COMPLETED', 'DELIVERED')
  );
