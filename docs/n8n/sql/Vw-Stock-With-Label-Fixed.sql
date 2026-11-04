
-- เติมคอลัมน์ที่ขาดทั้ง 2 ตารางก่อนสร้าง View
alter table public.product_master add column if not exists emoji text default '';
alter table public.product_master add column if not exists label_display text default '';
alter table public.product_master add column if not exists display_for_packer text default '';
alter table public.product_master add column if not exists unit_price numeric default 0;
alter table public.product_master add column if not exists status text default 'ACTIVE';
alter table public.product_master add column if not exists name_standard text default '';

alter table public.inventory add column if not exists warehouse_location text default '';
alter table public.inventory add column if not exists checked_at timestamptz;
alter table public.inventory add column if not exists shipped_at timestamptz;
alter table public.inventory add column if not exists stock_qty int default 0;
alter table public.inventory add column if not exists stock_status text default 'OUT_OF_STOCK';
alter table public.inventory add column if not exists updated_at timestamptz default now();

-- ลบ view เก่าก่อน
drop view if exists public.vw_stock_linked cascade;

-- VW กลางลิ้งทุกห้อง รวมลาเบลแล้ว
create view public.vw_stock_linked
with (security_invoker = false) as
select
  pm.id as product_id,
  pm.sku,
  pm.brand,
  pm.category,
  pm.variant,
  pm.th_name,
  pm.emoji,
  pm.label_display,
  pm.display_for_packer,
  pm.unit_price,
  pm.status as product_status,
  coalesce(inv.stock_qty, 0) as stock_qty,
  coalesce(inv.stock_status,
    case when inv.sku is null then 'UNKNOWN'::text when coalesce(inv.stock_qty,0)>0 then 'IN_STOCK'::text else 'OUT_OF_STOCK'::text end
  ) as stock_status,
  coalesce(inv.warehouse_location,'') as warehouse_location,
  inv.checked_at,
  inv.shipped_at,
  inv.updated_at as inventory_updated_at
from public.product_master pm
left join public.inventory inv on inv.sku = pm.sku;

comment on view public.vw_stock_linked is 'Central view + label room. Informational only; must not reject orders. Link to all rooms via sku/product_id';
