-- BB ONLY · กู้คืน for_packer_bb_display จากฟิว n8n เดิม
-- ไม่อ่าน product_master และไม่สร้าง/เติมจำนวนเอง
-- รันในฐานข้อมูล BB เท่านั้น

BEGIN;

CREATE TABLE IF NOT EXISTS public.bb_orders_for_packer_recovery_backup_20260922 AS
SELECT id, upsert_key, for_packer_bb_display, now() AS backed_up_at
FROM public.bb_orders
WITH NO DATA;

INSERT INTO public.bb_orders_for_packer_recovery_backup_20260922 (id, upsert_key, for_packer_bb_display, backed_up_at)
SELECT id, upsert_key, for_packer_bb_display, now()
FROM public.bb_orders;

-- ลำดับนี้เลือกเฉพาะค่าที่ n8n เคยสร้างไว้แล้ว
UPDATE public.bb_orders
SET for_packer_bb_display = COALESCE(
  NULLIF(BTRIM(product_display_for_packer), ''),
  NULLIF(BTRIM(final_display_for_packer), ''),
  NULLIF(BTRIM(telegram_final_mapped), ''),
  NULLIF(BTRIM(product_copy_text), ''),
  NULLIF(BTRIM(extracted_product_raw), ''),
  NULLIF(BTRIM(single_cleaned_products), ''),
  NULLIF(BTRIM(raw_product_only), '')
)
WHERE COALESCE(
  NULLIF(BTRIM(product_display_for_packer), ''),
  NULLIF(BTRIM(final_display_for_packer), ''),
  NULLIF(BTRIM(telegram_final_mapped), ''),
  NULLIF(BTRIM(product_copy_text), ''),
  NULLIF(BTRIM(extracted_product_raw), ''),
  NULLIF(BTRIM(single_cleaned_products), ''),
  NULLIF(BTRIM(raw_product_only), '')
) IS NOT NULL;

COMMIT;

-- ตรวจตัวอย่างหลังคืนค่า
SELECT id, upsert_key, for_packer_bb_display
FROM public.bb_orders
WHERE NULLIF(BTRIM(for_packer_bb_display), '') IS NOT NULL
ORDER BY id DESC
LIMIT 20;
