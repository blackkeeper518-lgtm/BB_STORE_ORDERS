-- NIGHTOPS canonical order source migration for ST
-- Run this in Supabase SQL Editor to align st_orders with multi-item structure

alter table public.st_orders
  add column if not exists items_json jsonb not null default '[]'::jsonb,
  add column if not exists items_text text,
  add column if not exists items_count integer not null default 0,
  add column if not exists total_quantity numeric not null default 0,
  add column if not exists packer_copy_text text,
  add column if not exists source_system text default 'front_house';

create index if not exists st_orders_canonical_created_idx
  on public.st_orders (created_at desc);
create index if not exists st_orders_canonical_order_number_idx
  on public.st_orders (order_number);
create index if not exists st_orders_canonical_page_thread_idx
  on public.st_orders (page_id, thread_id, created_at desc);

-- Backfill legacy product data into multi-item JSON
update public.st_orders
set items_json = jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'sku', sku,
      'th_name', th_name,
      'label_display', coalesce(display_label, display_for_packer),
      'display_for_packer', display_for_packer,
      'quantity', case when coalesce(telegram_body->>'quantity', '') ~ '^[0-9]+(\.[0-9]+)?$' then (telegram_body->>'quantity')::numeric else 1 end,
      'unit_price', null
    )))
where (items_json = '[]'::jsonb or items_json is null)
  and (sku is not null or th_name is not null or display_label is not null or display_for_packer is not null);

update public.st_orders
set items_count = jsonb_array_length(items_json),
    total_quantity = coalesce((
      select sum(case when coalesce(item->>'quantity', '') ~ '^[0-9]+(\.[0-9]+)?$' then (item->>'quantity')::numeric else 1 end)
      from jsonb_array_elements(items_json) as item
    ), 0),
    items_text = (
      select string_agg(
        coalesce(item->>'label_display', item->>'display_for_packer', item->>'th_name', item->>'sku', 'สินค้า')
        || ' ' || coalesce(item->>'quantity', '1') || ' ชิ้น', E'\n'
      )
      from jsonb_array_elements(items_json) as item
    )
where items_json is not null;
