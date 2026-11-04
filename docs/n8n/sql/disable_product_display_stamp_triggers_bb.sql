-- BB ONLY · ปลดตัวเขียนทับสินค้าออก
-- ไม่มี UPDATE / ไม่มีการกู้ข้อมูล / ไม่แก้ค่าในตาราง
-- รันในฐานข้อมูล BB เท่านั้น

DROP TRIGGER IF EXISTS trg_stamp_bb_product_display ON public.product_master;
DROP TRIGGER IF EXISTS trg_stamp_bb_order_product_display ON public.bb_orders;

-- ตั้งใจไม่ DROP คอลัมน์และไม่ DROP ฟังก์ชันเก่า
-- เพื่อให้ปลอดภัยและย้อนกลับได้ภายหลัง
