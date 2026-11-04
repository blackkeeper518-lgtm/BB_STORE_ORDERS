-- BB Alien coverage audit + read-only web view
-- Run this in the BB Supabase project.
-- This script never inserts/updates/deletes product_master or map_reviews.

begin;

-- =========================================================
-- A) COVERAGE CHECK: every review should resolve to Product Master
-- =========================================================
-- Result columns:
--   MATCHED_MASTER  = review/term SKU resolves to master_sku and has display
--   MISSING_MASTER  = no Product Master row for the observed SKU
--   NO_DISPLAY      = Product Master exists but has no prebuilt display
select
  count(*) as total_reviews,
  count(*) filter (where pm.id is not null and nullif(btrim(pm.master_display_for_packer), '') is not null) as matched_master,
  count(*) filter (where pm.id is null) as missing_master,
  count(*) filter (where pm.id is not null and nullif(btrim(pm.master_display_for_packer), '') is null) as master_without_display
from public.product_alien_map_reviews r
join public.product_alien_terms t
  on t.id = r.alien_term_id
left join public.product_master pm
  on lower(btrim(pm.master_sku)) = lower(btrim(coalesce(r.master_sku, r.observed_sku, t.sku)));

-- =========================================================
-- B) DETAILS OF UNMATCHED REVIEWS
-- =========================================================
select
  r.id as review_id,
  r.alien_term_id,
  r.order_number,
  r.mapping_status,
  r.review_reason,
  r.observed_sku,
  t.sku as term_sku,
  coalesce(r.master_sku, r.observed_sku, t.sku) as lookup_sku,
  t.raw_text,
  pm.id as product_master_id,
  pm.master_sku,
  pm.master_display_for_packer
from public.product_alien_map_reviews r
join public.product_alien_terms t
  on t.id = r.alien_term_id
left join public.product_master pm
  on lower(btrim(pm.master_sku)) = lower(btrim(coalesce(r.master_sku, r.observed_sku, t.sku)))
where pm.id is null
   or nullif(btrim(pm.master_display_for_packer), '') is null
order by r.updated_at desc nulls last, r.id desc;

-- =========================================================
-- C) DUPLICATE MASTER SKU CHECK
-- =========================================================
select
  lower(btrim(master_sku)) as normalized_master_sku,
  count(*) as master_rows,
  array_agg(id order by id) as product_master_ids
from public.product_master
where nullif(btrim(master_sku), '') is not null
group by lower(btrim(master_sku))
having count(*) > 1
order by normalized_master_sku;

-- =========================================================
-- D) READ-ONLY WEB VIEW FOR ST
-- =========================================================
-- Raw evidence remains untouched.
-- Master Display comes only from product_master.
-- Live stock comes only from inventory.
-- The combined display is presentation output only.
drop view if exists public.vw_bb_alien_master_center;
create view public.vw_bb_alien_master_center as
select
  t.id as alien_term_id,
  t.upsert_key,
  t.order_number,
  t.facebook_name,
  t.customer_id,
  t.thread_id,
  t.page_id,
  t.page_name,
  t.line_no,
  t.raw_text,
  t.raw_text_full,
  t.alias_text,
  t.alias_norm,
  t.normalized_chat_timeline,
  t.chat_timeline,
  t.product_evidence,
  t.quantity,
  t.qty,
  t.extracted_qty,

  case
    when btrim(coalesce(t.master_quantity::text, '')) ~ '^\\d+(\\.\\d+)?$' then btrim(t.master_quantity::text)::numeric
    when btrim(coalesce(t.quantity, '')) ~ '^\\d+(\\.\\d+)?$' then btrim(t.quantity)::numeric
    when btrim(coalesce(t.qty, '')) ~ '^\\d+(\\.\\d+)?$' then btrim(t.qty)::numeric
    when btrim(coalesce(t.extracted_qty, '')) ~ '^\\d+(\\.\\d+)?$' then btrim(t.extracted_qty)::numeric
    else null
  end as master_quantity,
  coalesce(t.master_quantity_source, 'TRUSTED_EVIDENCE') as master_quantity_source,
  coalesce(t.master_quantity_status, 'DERIVED_FOR_VIEW') as master_quantity_status,
  case
    when t.master_unit is not null and btrim(t.master_unit) <> '' then t.master_unit
    when btrim(coalesce(t.master_quantity::text, '')) ~ '^\\d+(\\.\\d+)?$'
      or btrim(coalesce(t.quantity, '')) ~ '^\\d+(\\.\\d+)?$'
      or btrim(coalesce(t.qty, '')) ~ '^\\d+(\\.\\d+)?$'
      or btrim(coalesce(t.extracted_qty, '')) ~ '^\\d+(\\.\\d+)?$'
    then 'คอต.'
    else null
  end as master_unit,

  pm.id as product_master_id,
  pm.master_sku,
  pm.master_display_for_packer,
  pm.th_name,
  pm.name_standard,
  pm.status as master_status,

  i.id as inventory_id,
  i.stock_qty,
  i.stock_status,

  r.id as review_id,
  coalesce(r.mapping_status, t.mapping_status, 'REVIEW') as mapping_status,
  coalesce(r.review_reason, t.review_reason) as review_reason,
  r.reviewer_note,
  r.reviewed_by,
  r.reviewed_at,

  case
    when nullif(btrim(t.raw_text), '') is null then 'RAW_MISSING'
    when pm.id is null then 'REVIEW'
    when nullif(btrim(pm.master_display_for_packer), '') is null then 'REVIEW'
    when coalesce(r.mapping_status, t.mapping_status, 'REVIEW') in ('MATCHED', 'APPROVED', 'RESOLVED') then 'MATCHED'
    else 'REVIEW'
  end as audit_status,

  case
    when nullif(btrim(pm.master_display_for_packer), '') is null then null
    when btrim(coalesce(t.master_quantity::text, '')) ~ '^\\d+(\\.\\d+)?$'
      then pm.master_display_for_packer || ' ' || btrim(t.master_quantity::text) || ' คอต.'
    when btrim(coalesce(t.quantity, '')) ~ '^\\d+(\\.\\d+)?$'
      then pm.master_display_for_packer || ' ' || btrim(t.quantity) || ' คอต.'
    when btrim(coalesce(t.qty, '')) ~ '^\\d+(\\.\\d+)?$'
      then pm.master_display_for_packer || ' ' || btrim(t.qty) || ' คอต.'
    when btrim(coalesce(t.extracted_qty, '')) ~ '^\\d+(\\.\\d+)?$'
      then pm.master_display_for_packer || ' ' || btrim(t.extracted_qty) || ' คอต.'
    else pm.master_display_for_packer
  end as master_display_with_quantity
from public.product_alien_terms t
left join lateral (
  select r.*
  from public.product_alien_map_reviews r
  where r.alien_term_id = t.id
  order by r.updated_at desc nulls last, r.id desc
  limit 1
) r on true
left join public.product_master pm
  on lower(btrim(pm.master_sku)) = lower(btrim(coalesce(r.master_sku, r.observed_sku, t.sku)))
left join lateral (
  select i.*
  from public.inventory i
  where i.product_id = pm.id
     or lower(btrim(coalesce(i.sku, ''))) = lower(btrim(pm.master_sku))
  order by (i.product_id = pm.id) desc, i.updated_at desc nulls last, i.id desc
  limit 1
) i on true;

comment on view public.vw_bb_alien_master_center is
  'BB Alien read model: raw evidence first, existing Product Master display, inventory stock, quantity plus คอต. for presentation only.';

commit;

-- =========================================================
-- E) FINAL CHECK AFTER VIEW CREATION
-- =========================================================
-- select order_number, raw_text, master_sku, master_display_for_packer,
--        master_quantity, master_unit, master_display_with_quantity,
--        stock_qty, stock_status, audit_status
-- from public.vw_bb_alien_master_center
-- order by order_number, line_no;
