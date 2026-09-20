-- BB ONLY
-- Check order counts by Facebook/page name.
-- Facebook time is the primary time source.
-- Current operational window: yesterday 14:00 through today 14:00, Asia/Bangkok.

with source as (
  select
    to_jsonb(o) as j
  from public.bb_orders o
), normalized as (
  select
    coalesce(nullif(btrim(j->>'page_name'), ''), nullif(btrim(j->>'fb_page_name'), ''), nullif(btrim(j->>'facebook_page_name'), ''), nullif(btrim(j->>'store_name'), ''), 'ไม่ระบุเพจ') as page_name_raw,
    coalesce(nullif(btrim(j->>'order_number'), ''), nullif(btrim(j->>'upsert_key'), ''), j->>'id') as order_key,
    (coalesce(j->>'order_message_created_at', j->>'facebook_message_created_at', j->>'facebook_created_at', j->>'fb_created_at', j->>'order_time', j->>'order_close_time_from_chat', j->>'occurred_at', j->>'created_at'))::timestamptz as facebook_time
  from source
), labeled as (
  select
    *,
    case
      when lower(regexp_replace(page_name_raw, '[[:space:]_.,()🅱🅱]+', '', 'g')) ~ '(เจ๊b|เจ๊บี|bbสโตร์|เจ๊บีbb)' then 'เจ๊ B / เจ๊บี 🅱🅱'
      else page_name_raw
    end as page_group
  from normalized
)
select
  page_group,
  count(distinct order_key) as all_orders,
  count(distinct order_key) filter (
    where facebook_time >= (((now() at time zone 'Asia/Bangkok')::date - 1) + time '14:00:00') at time zone 'Asia/Bangkok'
      and facebook_time < (((now() at time zone 'Asia/Bangkok')::date) + time '14:00:00') at time zone 'Asia/Bangkok'
  ) as orders_from_yesterday_14_to_today_14,
  min(facebook_time at time zone 'Asia/Bangkok') as first_facebook_order_bkk,
  max(facebook_time at time zone 'Asia/Bangkok') as last_facebook_order_bkk
from labeled
group by page_group
order by page_group;

-- Exact raw page names, useful for checking whether the two labels are actually separate.
with source as (
  select to_jsonb(o) as j
  from public.bb_orders o
), rows as (
  select
    coalesce(nullif(btrim(j->>'page_name'), ''), nullif(btrim(j->>'fb_page_name'), ''), nullif(btrim(j->>'facebook_page_name'), ''), nullif(btrim(j->>'store_name'), ''), 'ไม่ระบุเพจ') as page_name_raw,
    coalesce(nullif(btrim(j->>'order_number'), ''), nullif(btrim(j->>'upsert_key'), ''), j->>'id') as order_key,
    (coalesce(j->>'order_message_created_at', j->>'facebook_message_created_at', j->>'facebook_created_at', j->>'fb_created_at', j->>'order_time', j->>'order_close_time_from_chat', j->>'occurred_at', j->>'created_at'))::timestamptz as facebook_time
  from source
)
select
  page_name_raw,
  count(distinct order_key) as all_orders,
  count(distinct order_key) filter (
    where facebook_time >= (((now() at time zone 'Asia/Bangkok')::date - 1) + time '14:00:00') at time zone 'Asia/Bangkok'
      and facebook_time < (((now() at time zone 'Asia/Bangkok')::date) + time '14:00:00') at time zone 'Asia/Bangkok'
  ) as orders_from_yesterday_14_to_today_14
from rows
group by page_name_raw
order by all_orders desc, page_name_raw;
