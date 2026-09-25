-- ============================================
-- FINAL: 6 ห้องเตือน + ล็อคราคากลาง 250*2=500
-- ใช้กับ bb_order_items_fix และ bb_product_alias_memory
-- ============================================

-- 1. ห้องสินค้าหมด / แมพไม่เจอ
DROP VIEW IF EXISTS vw_room_1_out_of_stock;
CREATE VIEW vw_room_1_out_of_stock AS
SELECT * FROM bb_order_items_fix
WHERE audit_status = 'NEEDS_REMAP' OR sku IS NULL OR audit_badge LIKE '%รอตรวจสอบ%';

-- 2. ห้องคอตเพี้ยน (ดึงจำนวนจากเบอร์โทรหรือหมู่บ้าน)
DROP VIEW IF EXISTS vw_room_2_qty_error;
CREATE VIEW vw_room_2_qty_error AS
SELECT 
  *,
  extracted_qty as qty_from_text,
  parsed_quantity as qty_from_parser,
  quantity as qty_final
FROM bb_order_items_fix
WHERE extracted_qty != parsed_quantity
   OR extracted_qty != quantity
   OR quantity != parsed_quantity;

-- 3. ห้องยอดเงินไม่ถูก (COD ไม่ตรงราคากลาง*คอต)
DROP VIEW IF EXISTS vw_room_3_cod_error;
CREATE VIEW vw_room_3_cod_error AS
SELECT 
  *,
  unit_price * quantity as expected_cod_calc,
  cod_amount as cod_from_text
FROM bb_order_items_fix
WHERE expected_cod != cod_amount
  AND audit_status != 'NEEDS_REMAP';

-- 4. ห้องสินค้า 2 อย่างขึ้นไป
DROP VIEW IF EXISTS vw_room_4_multi;
CREATE VIEW vw_room_4_multi AS
SELECT 
  thread_id,
  order_number,
  COUNT(*) as item_count,
  STRING_AGG(COALESCE(alias, display_for_packer, extracted_product_block), ' + ') as products,
  SUM(cod_amount) as total_cod
FROM bb_order_items_fix
GROUP BY thread_id, order_number
HAVING COUNT(*) >= 2;

-- 5. ห้อง 1-2 คอต เช็คง่าย
DROP VIEW IF EXISTS vw_room_5_1_2_cot;
CREATE VIEW vw_room_5_1_2_cot AS
SELECT * FROM bb_order_items_fix
WHERE quantity IN (1,2)
AND is_ready_to_pack = true
AND audit_status = 'READY';

-- 6. ห้อง 3 คอตขึ้นไป เช็คยาก
DROP VIEW IF EXISTS vw_room_6_3_plus;
CREATE VIEW vw_room_6_3_plus AS
SELECT * FROM bb_order_items_fix
WHERE quantity >= 3;

-- ห้องกลาง พร้อมส่งจริง
DROP VIEW IF EXISTS vw_room_central_ready;
CREATE VIEW vw_room_central_ready AS
SELECT * FROM bb_order_items_fix
WHERE is_ready_to_pack = true
AND audit_status = 'READY'
AND quantity = parsed_quantity
AND expected_cod = cod_amount;

-- สรุปยอด 6 ห้อง
SELECT 'ห้อง1 สินค้าหมด/รีแมพ' as room, count(*) as total FROM vw_room_1_out_of_stock
UNION ALL SELECT 'ห้อง2 คอตเพี้ยน', count(*) FROM vw_room_2_qty_error
UNION ALL SELECT 'ห้อง3 ยอดเงินไม่ถูก', count(*) FROM vw_room_3_cod_error
UNION ALL SELECT 'ห้อง4 สินค้า 2 อย่าง', count(*) FROM (SELECT * FROM vw_room_4_multi) t
UNION ALL SELECT 'ห้อง5 1-2คอต', count(*) FROM vw_room_5_1_2_cot
UNION ALL SELECT 'ห้อง6 3+คอต', count(*) FROM vw_room_6_3_plus
UNION ALL SELECT 'ห้องกลาง พร้อมส่ง', count(*) FROM vw_room_central_ready;
