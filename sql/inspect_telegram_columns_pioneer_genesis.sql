-- ใช้ใน SQL Editor ของโปรเจกต์ Main Order (ZEUS)
-- ค้นหาออเดอร์เดียวจาก PIONEER และ GENESIS
-- ผลลัพธ์มีเพียง column_data และ column_name ของคอลัมน์ที่มีคำว่า telegram

with source_rows as (
  select to_jsonb(p) as row_data
  from public."🛰️PIONEER_xXx_CAPSULE" as p

  union all

  select to_jsonb(g) as row_data
  from public."🌟GENESIS_xXx_HISTORY" as g
),
matched_order as (
  select row_data
  from source_rows
  where coalesce(row_data->>'upsert_key', '') = 'BB_01_ORD-031126-095413_0629151972_24110'
     or coalesce(row_data->>'order_number', '') = 'BB_01_ORD-031126-095413_0629151972_24110'
     or coalesce(row_data->>'order_number_display', '') = 'BB_01_ORD-031126-095413_0629151972_24110'
)
select distinct
  field.value as column_data,
  field.key as column_name
from matched_order
cross join lateral jsonb_each(row_data) as field(key, value)
where field.key ilike '%telegram%'
order by column_name;
