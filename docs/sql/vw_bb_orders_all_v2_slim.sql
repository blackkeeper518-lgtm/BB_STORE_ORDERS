-- BB ONLY · SLIM ORDER SOURCE · COMPATIBLE EDITION
-- Keeps the existing view name for BB compatibility.
-- No ST references. No writes. No raw evidence is changed or deleted.
-- Optional/legacy fields are read through one JSON object so a missing
-- optional column does not make the view fail to compile.

begin;

drop view if exists public.vw_bb_orders_all_v2;

create view public.vw_bb_orders_all_v2 as
with source as (
  select to_jsonb(o) as j
  from public.bb_orders o
)
select
  -- Stable identity and authoritative order time.
  nullif(j->>'id', '') as id,
  nullif(j->>'upsert_key', '') as upsert_key,
  nullif(j->>'order_number', '') as order_number,
  coalesce(nullif(j->>'order_number_display', ''), nullif(j->>'order_number', '')) as order_number_display,
  nullif(j->>'order_time_display', '') as order_time_display,
  nullif(j->>'order_time', '') as order_time,
  nullif(j->>'page_name', '') as page_name,
  nullif(j->>'page_id', '') as page_id,
  nullif(j->>'facebook_name', '') as facebook_name,
  nullif(j->>'customer_name', '') as customer_name,
  nullif(j->>'phone', '') as phone,
  nullif(j->>'extracted_phone', '') as extracted_phone,
  nullif(j->>'cod_amount', '') as cod_amount,

  -- Address fields used by the bill.
  nullif(j->>'address_display_packer', '') as address_display_packer,
  nullif(j->>'addressclean', '') as addressclean,
  nullif(j->>'short_address', '') as short_address,
  nullif(j->>'district', '') as district,
  nullif(j->>'amphoe', '') as amphoe,
  nullif(j->>'province', '') as province,
  nullif(j->>'zipcode', '') as zipcode,
  nullif(j->>'full_address', '') as full_address,
  nullif(j->>'final_address_for_bill', '') as final_address_for_bill,

  -- Product/Lab evidence used by the delivery room.
  coalesce(
    nullif(j->>'for_packer_bb_display', ''),
    nullif(j->>'product_display_for_packer', ''),
    nullif(j->>'final_display_for_packer', ''),
    nullif(j->>'master_display_for_packer', ''),
    nullif(j->>'single_cleaned_products', ''),
    nullif(j->>'single_cleaned_block', '')
  ) as for_packer_bb_display,
  nullif(j->>'final_display_for_packer', '') as final_display_for_packer,
  nullif(j->>'product_display_for_packer', '') as product_display_for_packer,
  nullif(j->>'master_display_for_packer', '') as master_display_for_packer,
  nullif(j->>'single_cleaned_products', '') as single_cleaned_products,
  nullif(j->>'single_cleaned_block', '') as single_cleaned_block,
  nullif(j->>'product_lines', '') as product_lines,
  nullif(j->>'product_copy_text', '') as product_copy_text,
  nullif(j->>'extracted_product_raw', '') as extracted_product_raw,
  nullif(j->>'extracted_sku', '') as extracted_sku,
  nullif(j->>'sku', '') as sku,
  nullif(j->>'product_name', '') as product_name,
  nullif(j->>'th_name', '') as th_name,
  nullif(j->>'quantity', '') as quantity,
  nullif(j->>'qty', '') as qty,
  nullif(j->>'extracted_qty', '') as extracted_qty,
  nullif(j->>'unit', '') as unit,
  nullif(j->>'display_for_packer', '') as display_for_packer,
  nullif(j->>'telegram_final_mapped', '') as telegram_final_mapped,
  nullif(j->>'product_source', '') as product_source,
  nullif(j->>'mapping_status', '') as mapping_status,

  -- Delivery-room state.
  nullif(j->>'telegram_sent', '') as telegram_sent,
  nullif(j->>'telegram_status', '') as telegram_status,
  nullif(j->>'telegram_message', '') as telegram_message,
  nullif(j->>'telegram_copy_text', '') as telegram_copy_text,
  j->'telegram_body' as telegram_body,
  nullif(j->>'stock_notice', '') as stock_notice,
  nullif(j->>'shipping_method', '') as shipping_method,
  nullif(j->>'order_status', '') as order_status,
  nullif(j->>'lock_status', '') as lock_status,

  -- Lightweight warning fields only; no raw payloads.
  nullif(j->>'alert_level', '') as alert_level,
  nullif(j->>'alert_title', '') as alert_title,
  nullif(j->>'alert_text', '') as alert_text,
  nullif(j->>'warn_text', '') as warn_text,
  nullif(j->>'should_alert', '') as should_alert,

  -- Timestamps used for sorting and edit refresh.
  nullif(j->>'created_at', '') as created_at,
  nullif(j->>'updated_at', '') as updated_at
from source;

comment on view public.vw_bb_orders_all_v2 is
  'BB-only slim read view: delivery fields, product evidence, and status only; optional legacy fields are JSON-safe.';

-- Optional grants, only if required by the BB Supabase project:
-- grant select on public.vw_bb_orders_all_v2 to anon, authenticated;

commit;

-- Verify after running:
-- select count(*) from public.vw_bb_orders_all_v2;
-- select upsert_key, order_number, order_time_display,
--        for_packer_bb_display, telegram_sent, telegram_status
-- from public.vw_bb_orders_all_v2
-- order by updated_at desc nulls last
-- limit 20;
