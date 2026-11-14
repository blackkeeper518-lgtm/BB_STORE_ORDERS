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
from
  parcels p
  join lateral (
    select
      o.portal_key,
      o.page_name,
      o.parcel_status_emoji,
      o.upsert_key,
      o.order_time,
      o.updated_at
    from
      "🧿BB_xXx_ORDERCONTROL" o
    where
      regexp_replace(
        COALESCE(o.phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(p.phone_number, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(o.phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) = regexp_replace(
        COALESCE(p.phone_number, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      )
      or regexp_replace(
        COALESCE(o.extracted_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(p.phone_number, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(o.extracted_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) = regexp_replace(
        COALESCE(p.phone_number, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      )
      or regexp_replace(
        COALESCE(o.phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(p.order_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(o.phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) = regexp_replace(
        COALESCE(p.order_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      )
      or regexp_replace(
        COALESCE(o.extracted_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(p.order_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) <> ''::text
      and regexp_replace(
        COALESCE(o.extracted_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      ) = regexp_replace(
        COALESCE(p.order_phone, ''::text),
        '[^0-9]'::text,
        ''::text,
        'g'::text
      )
    order by
      o.order_time desc nulls last,
      o.updated_at desc nulls last,
      o.upsert_key
    limit
      1
  ) ord on true
where
  NULLIF(btrim(p.tracking_number), ''::text) is not null
  and (
    NULLIF(btrim(p.phone_number), ''::text) is not null
    or NULLIF(btrim(p.order_phone), ''::text) is not null
  );