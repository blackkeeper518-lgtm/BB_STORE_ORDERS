-- BB ONLY · PRODUCT MASTER → BB ORDERS
-- ความสัมพันธ์หลัก: bb_orders.sku = product_master.master_sku
-- จุดประทับสินค้า: product_master.for_packer_bb_display → bb_orders.for_packer_bb_display
-- รันในฐานข้อมูล BB เท่านั้น

BEGIN;

ALTER TABLE public.product_master
  ADD COLUMN IF NOT EXISTS for_packer_bb_display TEXT;

ALTER TABLE public.bb_orders
  ADD COLUMN IF NOT EXISTS for_packer_bb_display TEXT;

-- เติมค่าจากโต๊ะสินค้าเดิมให้เป็นค่ากลางของ BB
UPDATE public.product_master
SET for_packer_bb_display = COALESCE(
  NULLIF(BTRIM(for_packer_bb_display), ''),
  NULLIF(BTRIM(master_display_for_packer), ''),
  NULLIF(BTRIM(display_for_packer), ''),
  NULLIF(BTRIM(name_standard), ''),
  NULLIF(BTRIM(th_name), ''),
  master_sku
)
WHERE NULLIF(BTRIM(for_packer_bb_display), '') IS NULL;

-- ประทับสินค้าเดิมลงทุกแถว BB ที่ SKU ตรงกัน
UPDATE public.bb_orders o
SET for_packer_bb_display = p.for_packer_bb_display
FROM public.product_master p
WHERE LOWER(BTRIM(o.sku)) = LOWER(BTRIM(p.master_sku))
  AND NULLIF(BTRIM(o.for_packer_bb_display), '') IS NULL
  AND NULLIF(BTRIM(p.for_packer_bb_display), '') IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_stamp_bb_product_display()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.bb_orders
  SET for_packer_bb_display = NEW.for_packer_bb_display
  WHERE LOWER(BTRIM(sku)) = LOWER(BTRIM(NEW.master_sku))
    AND NULLIF(BTRIM(for_packer_bb_display), '') IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stamp_bb_product_display ON public.product_master;
CREATE TRIGGER trg_stamp_bb_product_display
AFTER INSERT OR UPDATE OF master_sku, for_packer_bb_display, master_display_for_packer, display_for_packer, name_standard, th_name
ON public.product_master
FOR EACH ROW
EXECUTE FUNCTION public.fn_stamp_bb_product_display();

CREATE OR REPLACE FUNCTION public.fn_stamp_bb_order_product_display()
RETURNS TRIGGER AS $$
BEGIN
  IF NULLIF(BTRIM(NEW.sku), '') IS NOT NULL THEN
    IF NULLIF(BTRIM(NEW.for_packer_bb_display), '') IS NULL THEN
      SELECT p.for_packer_bb_display
      INTO NEW.for_packer_bb_display
      FROM public.product_master p
      WHERE LOWER(BTRIM(p.master_sku)) = LOWER(BTRIM(NEW.sku))
      LIMIT 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stamp_bb_order_product_display ON public.bb_orders;
CREATE TRIGGER trg_stamp_bb_order_product_display
BEFORE INSERT OR UPDATE OF sku ON public.bb_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_stamp_bb_order_product_display();

COMMIT;
