-- BLACKBOX ROOM · ORDER TRACE / ALERT SQL
-- Run in the BB Supabase project only.
-- Read-only views. They never delete, rewrite, or hide raw order/chat evidence.
-- Telegram room: every bb_orders row is eligible; sent is a visible state only.
-- Alert room: flags possible bot summaries/duplicates and shows customer history.

begin;

-- ============================================================
-- 1) Telegram manual room: no time cutoff and no mapping gate.
-- ============================================================

drop view if exists public.vw_bb_telegram_manual_room_v1;

create view public.vw_bb_telegram_manual_room_v1 as
with source as (
  select to_jsonb(o) as j
  from public.bb_orders o
)
select
  nullif(j->>'id', '') as id,
  nullif(j->>'upsert_key', '') as upsert_key,
  coalesce(nullif(j->>'order_number_display', ''), nullif(j->>'order_number', ''), nullif(j->>'upsert_key', '')) as order_number,
  nullif(j->>'order_number_display', '') as order_number_display,
  nullif(j->>'order_time_display', '') as order_time_display,
  nullif(j->>'order_time', '') as order_time,
  nullif(j->>'created_at', '') as created_at,
  nullif(j->>'updated_at', '') as updated_at,
  nullif(j->>'page_name', '') as page_name,
  nullif(j->>'facebook_name', '') as facebook_name,
  nullif(j->>'customer_name', '') as customer_name,
  nullif(j->>'phone', '') as phone,
  nullif(j->>'extracted_phone', '') as extracted_phone,
  nullif(j->>'cod_amount', '') as cod_amount,
  nullif(j->>'address_display_packer', '') as address_display_packer,
  nullif(j->>'addressclean', '') as addressclean,
  nullif(j->>'full_address', '') as full_address,
  nullif(j->>'province', '') as province,
  nullif(j->>'zipcode', '') as zipcode,
  coalesce(
    nullif(j->>'for_packer_bb_display', ''),
    nullif(j->>'product_display_for_packer', ''),
    nullif(j->>'final_display_for_packer', ''),
    nullif(j->>'master_display_for_packer', ''),
    nullif(j->>'single_cleaned_products', ''),
    nullif(j->>'extracted_product_raw', ''),
    nullif(j->>'sniper_x_text_clean', '')
  ) as for_packer_bb_display,
  nullif(j->>'sniper_x_text_clean', '') as sniper_x_text_clean,
  nullif(j->>'normalized_chat_timeline', '') as normalized_chat_timeline_text,
  nullif(j->>'mapping_status', '') as mapping_status,
  nullif(j->>'stock_notice', '') as stock_notice,
  nullif(j->>'shipping_method', '') as shipping_method,
  nullif(j->>'telegram_sent', '') as telegram_sent,
  nullif(j->>'telegram_status', '') as telegram_status,
  nullif(j->>'delivery_state', '') as delivery_state,
  nullif(j->>'sent_at', '') as sent_at,
  nullif(j->>'recalled_at', '') as recalled_at,
  nullif(j->>'last_delivery_note', '') as last_delivery_note,
  case
    when lower(coalesce(j->>'telegram_sent', '')) in ('true','1','t','sent','delivered','ไปแล้วไปลับ') then true
    when upper(coalesce(j->>'telegram_status', '')) in ('SENT','DELIVERED','SENT_TO_TELEGRAM') then true
    when upper(coalesce(j->>'delivery_state', '')) = 'SENT' then true
    else false
  end as is_sent
from source;

comment on view public.vw_bb_telegram_manual_room_v1 is
  'BB manual Telegram room: all orders remain visible; no time, mapping, warning, or stock gate.';

-- ============================================================
-- 2) Alert room: customer history + possible duplicate/bot signals.
-- ============================================================
-- This view deliberately does not decide which order is real. A bot can
-- also close a COD summary, so "latest non-bot" is not a valid truth rule.
-- It gives the operator the complete evidence set instead.

drop view if exists public.vw_bb_order_alert_room_v1;

create view public.vw_bb_order_alert_room_v1 as
with orders as (
  select
    o.id,
    to_jsonb(o) as j,
    lower(regexp_replace(coalesce(nullif(btrim(o.phone), ''), nullif(btrim(o.extracted_phone), ''), ''), '[^0-9]', '', 'g')) as phone_key,
    lower(regexp_replace(coalesce(nullif(btrim(o.customer_name), ''), nullif(btrim(o.facebook_name), ''), ''), '[[:space:][:punct:]]+', '', 'g')) as customer_key,
    coalesce(nullif(btrim(o.cod_amount::text), ''), '0')::numeric as cod_value,
    lower(coalesce(o.for_packer_bb_display, o.product_display_for_packer, o.final_display_for_packer, o.sniper_x_text_clean, '')) as product_key,
    coalesce(nullif(o.order_time, ''), nullif(o.created_at, ''), '') as event_key
  from public.bb_orders o
), classified as (
  select
    o.*,
    case
      when o.product_key ~ '(หนูส่งต่อให้ทีม|ส่งต่อให้ทีม|ทีมจะดูแลจัดส่ง|รับทราบว่าพี่ขอรับ|ยอดรวม.*ชำระแบบเก็บเงินปลายทาง|จัดส่งชื่อ)' then true
      when lower(coalesce(o.j->>'sniper_x_text_clean', '')) ~ '(order summary|bot summary|สรุปออเดอร์|บอทสรุป)' then true
      else false
    end as is_bot_summary,
    coalesce(nullif(o.phone_key, ''), nullif(o.customer_key, ''), nullif(o.j->>'thread_id', '')) as person_key
  from orders o
), enriched as (
  select
    c.*,
    count(*) over (partition by c.person_key) as customer_bill_count,
    sum(c.cod_value) over (partition by c.person_key) as customer_cod_total,
    count(*) over (
      partition by c.person_key, c.cod_value, c.product_key
    ) as duplicate_signature_count,
    coalesce(chat.chat_message_count, 0) as chat_message_count,
    chat.last_chat_at,
    chat.last_chat_text
  from classified c
  left join lateral (
    select
      count(*)::integer as chat_message_count,
      max(cm.occurred_at) as last_chat_at,
      (array_agg(cm.message_text order by cm.occurred_at desc nulls last, cm.id desc))[1] as last_chat_text
    from public.chat_customer_messages cm
    where (
      nullif(btrim(cm.thread_id), '') is not null
      and nullif(btrim(cm.thread_id), '') = nullif(btrim(c.j->>'thread_id'), '')
    )
    or (
      nullif(regexp_replace(coalesce(cm.customer_name, ''), '[^0-9]', '', 'g'), '') is not null
      and nullif(regexp_replace(coalesce(cm.customer_name, ''), '[^0-9]', '', 'g'), '') = nullif(c.phone_key, '')
    )
    or (
      nullif(lower(regexp_replace(coalesce(cm.customer_name, ''), '[[:space:][:punct:]]+', '', 'g')), '') = nullif(c.customer_key, '')
    )
  ) chat on true
)
select
  id,
  nullif(j->>'upsert_key', '') as upsert_key,
  coalesce(nullif(j->>'order_number', ''), nullif(j->>'upsert_key', '')) as order_number,
  nullif(j->>'order_time_display', '') as order_time_display,
  nullif(j->>'page_name', '') as page_name,
  nullif(j->>'facebook_name', '') as facebook_name,
  nullif(j->>'customer_name', '') as customer_name,
  nullif(j->>'phone', '') as phone,
  cod_value,
  nullif(j->>'for_packer_bb_display', '') as for_packer_bb_display,
  -- Optional n8n change-trace keys; old rows remain compatible.
  nullif(j->>'changed_from', '') as changed_from,
  nullif(j->>'changed_to', '') as changed_to,
  nullif(j->>'product_before', '') as product_before,
  nullif(j->>'product_after', '') as product_after,
  nullif(j->>'change_decision_minutes', '') as change_decision_minutes,
  nullif(j->>'sniper_x_text_clean', '') as sniper_x_text_clean,
  nullif(j->>'thread_id', '') as thread_id,
  person_key,
  customer_bill_count,
  customer_cod_total,
  chat_message_count,
  last_chat_at,
  last_chat_text,
  is_bot_summary,
  duplicate_signature_count,
  case
    when is_bot_summary then 'SUMMARY_SIGNAL_REVIEW'
    when duplicate_signature_count > 1 then 'POSSIBLE_DUPLICATE_REVIEW'
    else 'HISTORY_COMPARE'
  end as alert_status
from enriched;

comment on view public.vw_bb_order_alert_room_v1 is
  'BB alert room: complete customer bill/chat/COD evidence and review signals; never declares a latest row to be the real order.';

commit;

-- Checks:
-- select alert_status, count(*) from public.vw_bb_order_alert_room_v1 group by alert_status;
-- select customer_name, phone, customer_bill_count, customer_cod_total,
--        chat_message_count, is_bot_summary, alert_status
-- from public.vw_bb_order_alert_room_v1
-- order by customer_cod_total desc nulls last;
--
-- No row in this view is the "real order" by automatic rule.
-- Compare the full chat timeline, page/customer speaker, source time,
-- order payload, and COD before deciding.
