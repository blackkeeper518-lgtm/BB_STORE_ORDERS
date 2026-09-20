-- BB ONLY / PAGE LOSS DIAGNOSTIC
-- Use Facebook order time first. This does not modify any data.

-- 1) Discover every JSON column whose name may contain page/store/source information.
select
  key as possible_page_column,
  count(*) as rows_with_value,
  count(distinct value) as distinct_values
from public.bb_orders o
cross join lateral jsonb_each_text(to_jsonb(o)) as fields(key, value)
where key ilike any (array['%page%', '%store%', '%shop%', '%source%', '%brand%', '%channel%'])
  and nullif(btrim(value), '') is not null
group by key
order by rows_with_value desc, key;

-- 2) Show every distinct page-like value with counts, without forcing names into one group.
select
  fields.key as source_column,
  fields.value as page_value,
  count(distinct coalesce(nullif(btrim(to_jsonb(o)->>'order_number'), ''), nullif(btrim(to_jsonb(o)->>'upsert_key'), ''), to_jsonb(o)->>'id')) as order_count
from public.bb_orders o
cross join lateral jsonb_each_text(to_jsonb(o)) as fields(key, value)
where fields.key ilike any (array['%page%', '%store%', '%shop%', '%source%', '%brand%', '%channel%'])
  and nullif(btrim(fields.value), '') is not null
group by fields.key, fields.value
order by order_count desc, source_column, page_value;

-- 3) Orders where all common page fields are empty: these are the likely missing pages.
with rows as (
  select
    coalesce(nullif(btrim(to_jsonb(o)->>'order_number'), ''), nullif(btrim(to_jsonb(o)->>'upsert_key'), ''), to_jsonb(o)->>'id') as order_key,
    (coalesce(
      to_jsonb(o)->>'order_message_created_at',
      to_jsonb(o)->>'facebook_message_created_at',
      to_jsonb(o)->>'facebook_created_at',
      to_jsonb(o)->>'fb_created_at',
      to_jsonb(o)->>'order_time',
      to_jsonb(o)->>'order_close_time_from_chat',
      to_jsonb(o)->>'occurred_at',
      to_jsonb(o)->>'created_at'
    ))::timestamptz as facebook_time,
    coalesce(
      nullif(btrim(to_jsonb(o)->>'page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'fb_page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'facebook_page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'page_title'), ''),
      nullif(btrim(to_jsonb(o)->>'store_name'), ''),
      nullif(btrim(to_jsonb(o)->>'shop_name'), ''),
      nullif(btrim(to_jsonb(o)->>'source_page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'channel_name'), '')
    ) as detected_page,
    to_jsonb(o)->>'customer_name' as customer_name,
    to_jsonb(o)->>'cod_amount' as cod_amount
  from public.bb_orders o
)
select *
from rows
where detected_page is null
order by facebook_time desc;

-- 4) Count orders by the widest available page field, for the current Facebook window.
with rows as (
  select
    coalesce(nullif(btrim(to_jsonb(o)->>'order_number'), ''), nullif(btrim(to_jsonb(o)->>'upsert_key'), ''), to_jsonb(o)->>'id') as order_key,
    (coalesce(
      to_jsonb(o)->>'order_message_created_at',
      to_jsonb(o)->>'facebook_message_created_at',
      to_jsonb(o)->>'facebook_created_at',
      to_jsonb(o)->>'fb_created_at',
      to_jsonb(o)->>'order_time',
      to_jsonb(o)->>'order_close_time_from_chat',
      to_jsonb(o)->>'occurred_at',
      to_jsonb(o)->>'created_at'
    ))::timestamptz as facebook_time,
    coalesce(
      nullif(btrim(to_jsonb(o)->>'page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'fb_page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'facebook_page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'page_title'), ''),
      nullif(btrim(to_jsonb(o)->>'store_name'), ''),
      nullif(btrim(to_jsonb(o)->>'shop_name'), ''),
      nullif(btrim(to_jsonb(o)->>'source_page_name'), ''),
      nullif(btrim(to_jsonb(o)->>'channel_name'), ''),
      'PAGE_MISSING'
    ) as detected_page
  from public.bb_orders o
)
select
  detected_page,
  count(distinct order_key) as order_count
from rows
where facebook_time >= (((now() at time zone 'Asia/Bangkok')::date - 1) + time '14:00:00') at time zone 'Asia/Bangkok'
  and facebook_time < (((now() at time zone 'Asia/Bangkok')::date) + time '14:00:00') at time zone 'Asia/Bangkok'
group by detected_page
order by order_count desc, detected_page;
