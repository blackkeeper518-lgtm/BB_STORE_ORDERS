-- ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
-- 🎯 BB ONLY · DROP OLD READ VIEWS
-- ลบเฉพาะ View เก่าที่เว็บ BB ไม่ใช้แล้ว
-- แกนปัจจุบัน: bb_orders
-- สินค้า/หัวบิลปัจจุบัน: vw_bb_product_extraction_lab88_order_center_v2
--
-- กฎ:
-- 1) ไม่ใช้ CASCADE เพื่อไม่ลบวัตถุที่พึ่งพา View โดยไม่ตั้งใจ
-- 2) ไม่แตะ bb_orders
-- 3) ไม่แตะ LAB View
-- 4) ไม่แตะ Product Master
-- 5) ไม่เปลี่ยนหรือลบ Telegram status และหลักฐานออเดอร์
-- ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

BEGIN;

-- View กลางเว็บเก่า
DROP VIEW IF EXISTS public.dk_darksidemarketing_bb;

-- View กลาง Telegram เก่า
DROP VIEW IF EXISTS public.dk_darksidemarketing_telagram_bb;

-- View รวมออเดอร์เก่าที่เคยใช้กับหน้าเว็บรุ่นก่อน
DROP VIEW IF EXISTS public.vw_bb_orders_all_v2;

-- View ห้องส่งเก่าที่สร้างไว้ระหว่างทดลอง
DROP VIEW IF EXISTS public.bb_darksidemarketing_derivery_dk;

COMMIT;

-- ตรวจหลังลบ: ควรเหลือเฉพาะ LAB View สำหรับสินค้า/หัวบิล
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'dk_darksidemarketing_bb',
    'dk_darksidemarketing_telagram_bb',
    'vw_bb_orders_all_v2',
    'bb_darksidemarketing_derivery_dk',
    'vw_bb_product_extraction_lab88_order_center_v2'
  )
ORDER BY viewname;

-- ผลที่คาดหวัง:
-- vw_bb_product_extraction_lab88_order_center_v2 ยังอยู่
-- View เก่า 4 ตัวไม่ควรแสดงในผลตรวจ

-- ถ้า DROP ไม่ผ่านเพราะมีวัตถุอื่นพึ่งพาอยู่ ให้หยุดก่อน
-- อย่าเติม CASCADE ทันที ให้ตรวจ dependency ก่อนด้วยคำสั่งนี้:
--
-- SELECT
--   dependent_ns.nspname AS dependent_schema,
--   dependent_view.relname AS dependent_object,
--   source_ns.nspname AS source_schema,
--   source_view.relname AS source_view
-- FROM pg_depend
-- JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
-- JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid
-- JOIN pg_namespace AS dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
-- JOIN pg_class AS source_view ON pg_depend.refobjid = source_view.oid
-- JOIN pg_namespace AS source_ns ON source_view.relnamespace = source_ns.oid
-- WHERE source_ns.nspname = 'public'
--   AND source_view.relname IN (
--     'dk_darksidemarketing_bb',
--     'dk_darksidemarketing_telagram_bb',
--     'vw_bb_orders_all_v2',
--     'bb_darksidemarketing_derivery_dk'
--   );
