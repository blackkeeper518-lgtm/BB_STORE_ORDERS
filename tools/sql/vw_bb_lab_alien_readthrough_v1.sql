-- BB ONLY · LAB → ALIEN MASTER CENTER · READ-THROUGH + FALLBACK
-- Read-only views. No order is deleted, blocked, moved, or rewritten.
-- Source path:
--   vw_bb_product_extraction_lab
--     -> vw_bb_alien_master_center (best mapped result)
--     -> Lab candidate (fallback)
--     -> raw_text (last-resort evidence)
--
-- Run in the BB Supabase project only.

begin;

-- ============================================================
-- 1) One row per Lab product candidate, enriched from Alien.
-- ============================================================
-- The lookup path is Lab -> product_map_master -> Alien -> raw evidence.
-- product_map_master is the main alias/SKU map; Alien is enrichment only.
-- No MATCHED/REVIEW filter is used.

drop view if exists public.vw_bb_lab_alien_product_lines_v1;

create view public.vw_bb_lab_alien_product_lines_v1 as
with lab_lines as (
  select
    l.upsert_key,
    l.order_number,
    l.order_time_display,
    item->>'source_line_no' as source_line_no_text,
    nullif(item->>'source_line_no', '')::integer as source_line_no,
    nullif(btrim(item->>'raw_text'), '') as lab_raw_text,
    nullif(btrim(item->>'master_sku'), '') as lab_master_sku,
    nullif(btrim(item->>'th_name'), '') as lab_th_name,
    nullif(btrim(item->>'master_display'), '') as lab_master_display,
    case
      when nullif(btrim(item->>'cot_quantity'), '') ~ '^\d+(\.\d+)?$'
        then (item->>'cot_quantity')::numeric
      else null
    end as lab_cot_quantity,
    nullif(btrim(item->>'line_mapping_status'), '') as lab_line_mapping_status
  from public.vw_bb_product_extraction_lab l
  cross join lateral jsonb_array_elements(
    coalesce(l.lab_product_candidates, '[]'::jsonb)
  ) as item
), resolved as (
  select
    x.*,
    m.master_sku as map_master_sku,
    m.sku as map_sku,
    m.th_name as map_th_name,
    coalesce(nullif(btrim(m.display_for_packer), ''), nullif(btrim(m.display_name), '')) as map_display,
    m.alias_text as map_alias_text,
    a.alien_term_id,
    a.raw_text as alien_raw_text,
    a.alias_text as alien_alias_text,
    a.ac_json->>'master_sku' as alien_master_sku,
    case when a.ac_json->>'master_quantity' ~ '^\\d+(\\.\\d+)?$' then (a.ac_json->>'master_quantity')::numeric end as alien_master_quantity,
    a.ac_json->>'master_unit' as alien_master_unit,
    a.ac_json->>'master_display_for_packer' as alien_master_display,
    a.ac_json->>'master_display_with_quantity' as alien_display_with_quantity,
    a.ac_json->>'th_name' as alien_th_name,
    a.ac_json->>'mapping_status' as alien_mapping_status,
    a.ac_json->>'audit_status' as alien_audit_status,
    a.ac_json->>'review_reason' as alien_review_reason,
    case when a.ac_json->>'stock_qty' ~ '^\\d+(\\.\\d+)?$' then (a.ac_json->>'stock_qty')::numeric end as alien_stock_qty,
    a.ac_json->>'stock_status' as alien_stock_status
  from lab_lines x
  left join lateral (
    select m.*
    from public.product_map_master m
    where (
      nullif(btrim(coalesce(m.master_sku, m.sku)), '') = nullif(btrim(x.lab_master_sku), '')
      and nullif(btrim(x.lab_master_sku), '') is not null
    )
    or (
      nullif(btrim(m.alias_text), '') is not null
      and lower(coalesce(x.lab_raw_text, '')) like '%' || lower(btrim(m.alias_text)) || '%'
    )
    order by
      case when lower(btrim(coalesce(m.master_sku, m.sku, ''))) = lower(btrim(coalesce(x.lab_master_sku, ''))) then 0 else 1 end,
      length(btrim(coalesce(m.alias_text, ''))) desc nulls last,
      m.created_at desc nulls last
    limit 1
  ) m on true
  left join lateral (
    select ac.*, to_jsonb(ac) as ac_json
    from public.vw_bb_alien_master_center ac
    where (
      nullif(btrim(x.upsert_key), '') is not null
      and nullif(btrim(ac.upsert_key), '') = nullif(btrim(x.upsert_key), '')
      and (
        lower(btrim(coalesce(ac.raw_text, ''))) = lower(btrim(coalesce(x.lab_raw_text, '')))
        or lower(btrim(coalesce(to_jsonb(ac)->>'master_sku', ''))) = lower(btrim(coalesce(m.master_sku, m.sku, x.lab_master_sku, '')))
      )
    )
    or (
      nullif(btrim(x.upsert_key), '') is null
      and nullif(btrim(x.order_number), '') is not null
      and nullif(btrim(ac.order_number), '') = nullif(btrim(x.order_number), '')
      and (
        lower(btrim(coalesce(ac.raw_text, ''))) = lower(btrim(coalesce(x.lab_raw_text, '')))
        or lower(btrim(coalesce(to_jsonb(ac)->>'master_sku', ''))) = lower(btrim(coalesce(m.master_sku, m.sku, x.lab_master_sku, '')))
      )
    )
    order by
      case when nullif(btrim(ac.upsert_key), '') = nullif(btrim(x.upsert_key), '') then 0 else 1 end,
      case when lower(btrim(coalesce(ac.raw_text, ''))) = lower(btrim(coalesce(x.lab_raw_text, ''))) then 0 else 1 end,
      ac.audit_status nulls last,
      ac.alien_term_id desc nulls last
    limit 1
  ) a on true
)
select
  r.upsert_key,
  r.order_number,
  r.order_time_display,
  r.source_line_no,

  -- Immutable evidence and the source actually used.
  coalesce(r.alien_raw_text, r.lab_raw_text, '[ไม่มีข้อความสินค้า]') as raw_text,
  r.lab_raw_text,
  r.alien_raw_text,
  r.alien_alias_text,

  -- product_map_master is the main mapping result; Alien enriches it.
  coalesce(r.map_master_sku, r.map_sku, r.alien_master_sku, r.lab_master_sku) as master_sku,
  coalesce(r.map_th_name, r.alien_th_name, r.lab_th_name) as th_name,
  coalesce(r.alien_display_with_quantity, r.alien_master_display, r.map_display, r.lab_master_display, r.lab_raw_text, r.alien_raw_text, '[ตรวจสอบสินค้า]') as product_display,

  -- Lab's already-extracted คอต wins. Alien quantity is fallback only.
  coalesce(r.lab_cot_quantity, r.alien_master_quantity) as cot_quantity,
  coalesce(r.alien_master_unit, case when r.lab_cot_quantity is not null then 'คอต.' end) as unit,
  coalesce(r.alien_mapping_status, r.lab_line_mapping_status, 'REVIEW') as mapping_status,
  coalesce(r.alien_audit_status, r.lab_line_mapping_status, 'REVIEW') as audit_status,
  r.alien_review_reason,

  -- Evidence of which path supplied the final display.
  case
    when r.alien_display_with_quantity is not null then 'ALIEN_MASTER_DISPLAY'
    when r.alien_master_display is not null then 'ALIEN_MASTER_DISPLAY'
    when r.map_display is not null then 'PRODUCT_MAP_MASTER'
    when r.lab_master_display is not null then 'LAB_MASTER_DISPLAY'
    when r.lab_raw_text is not null then 'LAB_RAW_TEXT'
    when r.alien_raw_text is not null then 'ALIEN_RAW_TEXT'
    else 'NO_PRODUCT_EVIDENCE'
  end as display_source,

  -- Live product notice is read-only enrichment. It never blocks delivery.
  pm.stock_notice,
  coalesce(r.alien_stock_qty, pm.stock_qty) as stock_qty,
  coalesce(r.alien_stock_status, pm.stock_status) as stock_status,

  r.alien_term_id
from resolved r
left join public.product_master pm
  on lower(btrim(pm.master_sku)) = lower(btrim(coalesce(r.map_master_sku, r.map_sku, r.alien_master_sku, r.lab_master_sku)));

comment on view public.vw_bb_lab_alien_product_lines_v1 is
  'BB read-through product lines: Lab -> product_map_master -> Alien enrichment -> raw evidence; never blocks an order.';

-- ============================================================
-- 2) One compact JSON payload per order for the Telegram room.
-- ============================================================
-- This is the lightweight replacement input for the Telegram room.
-- It reads product results from the previous view and does not use
-- vw_bb_orders_all_v2.

drop view if exists public.vw_bb_telegram_lab_alien_products_v1;

create view public.vw_bb_telegram_lab_alien_products_v1 as
select
  p.upsert_key,
  p.order_number,
  max(p.order_time_display) as order_time_display,
  case
    when count(*) = 0 then 'ALIEN_NO_PRODUCT_LINES'
    when bool_or(p.mapping_status in ('REVIEW', 'REVIEW_NOT_MATCHED') or p.audit_status in ('REVIEW', 'RAW_MISSING')) then 'REVIEW'
    else 'PASS'
  end as lab_status,
  count(*)::integer as lab_product_line_count,
  coalesce(sum(p.cot_quantity), 0) as lab_total_cot,
  count(*) filter (where p.mapping_status in ('MATCHED', 'APPROVED', 'RESOLVED') or p.audit_status = 'MATCHED')::integer as lab_matched_line_count,
  jsonb_agg(
    jsonb_build_object(
      'line_no', p.source_line_no,
      'raw_text', p.raw_text,
      'master_sku', p.master_sku,
      'th_name', p.th_name,
      'product_display', p.product_display,
      'cot_quantity', p.cot_quantity,
      'unit', p.unit,
      'stock_notice', p.stock_notice,
      'mapping_status', p.mapping_status,
      'audit_status', p.audit_status,
      'display_source', p.display_source,
      'review_reason', p.alien_review_reason
    ) order by p.source_line_no
  ) filter (where p.source_line_no is not null) as product_lines,
  string_agg(p.product_display, E'\n' order by p.source_line_no) as product_display_text,
  string_agg(nullif(p.stock_notice, ''), E'\n' order by p.source_line_no) as stock_notice_text,
  bool_or(p.mapping_status in ('REVIEW', 'REVIEW_NOT_MATCHED') or p.audit_status in ('REVIEW', 'RAW_MISSING')) as needs_review
from public.vw_bb_lab_alien_product_lines_v1 p
group by p.upsert_key, p.order_number;

comment on view public.vw_bb_telegram_lab_alien_products_v1 is
  'BB compact Telegram product payload sourced from Lab plus Alien read-through; all orders remain eligible for delivery.';

commit;

-- ============================================================
-- 3) Verification queries (read-only; run after creating the views).
-- ============================================================
-- select order_number, source_line_no, raw_text, master_sku,
--        cot_quantity, product_display, stock_notice,
--        mapping_status, display_source
-- from public.vw_bb_lab_alien_product_lines_v1
-- order by order_time_display desc nulls last, order_number, source_line_no;
--
-- select order_number, product_display_text, stock_notice_text,
--        needs_review, product_lines
-- from public.vw_bb_telegram_lab_alien_products_v1
-- order by order_time_display desc nulls last
-- limit 100;
--
-- Example expected line:
-- raw_text      = 🟥 CAVALLO_RED (คาวาโร่แดง) x 4 คอต
-- master_sku    = CAVALLO_RED
-- cot_quantity  = 4
-- display_source= ALIEN_MASTER_DISPLAY (when Alien has a display)
--
-- IMPORTANT:
-- No WHERE mapping_status = 'MATCHED'
-- No WHERE lab_status = 'PASS'
-- No order is discarded when Alien has no row.
-- The source evidence remains in Lab and the original order table.
