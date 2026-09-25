DROP TABLE IF EXISTS master_typo_funnel;

CREATE TABLE master_typo_funnel (
  taigek_word TEXT, -- ห้ามใส่ เขียว แดง บูล เดี่ยวๆ เด็ดขาด
  tiger_th TEXT,    -- ไทยเต็ม
  tiger_en TEXT,    -- อังกฤษเต็ม
  sku_variant TEXT, -- เอาไปทำ SKU_FINAL
  variant_group TEXT,
  funnel_level TEXT
);

INSERT INTO master_typo_funnel VALUES
-- COOL กลุ่มเย็น (ห้ามใช้คำว่า เขียว เฉยๆ เป็นตัวย่อ)
('เขียวขาว','เขียวขาว','GREEN_WHITE','GREEN_WHITE','COOL','BOTTOM'),
('เขียวดำ','เขียวดำ','GREEN_BLACK','GREEN_BLACK','COOL','BOTTOM'),
('เขียวสลิม','เขียวสลิม','GREEN_SLIMS','GREEN_SLIMS','COOL','BOTTOM'),
('มินต์คูล','มินต์คูล','MINT_COOL','MINT_COOL','COOL','BOTTOM'),
('มินต์เมนทอล','มินต์เมนทอล','MINT_MENTHOL','MINT_MENTHOL','COOL','BOTTOM'),
('เมนทอล','เมนทอล','MENTHOL','MENTHOL','COOL','BOTTOM'),
('มินต์','มินต์','MINT','MINT','COOL','BOTTOM'),
('ฟ้า','ฟ้า','BLUE','BLUE','COOL','BOTTOM'),
('เขียวเมนทอล','เขียวเมนทอล','GREEN_MENTHOL','GREEN_MENTHOL','COOL','BOTTOM'),
('เขียวล้วน','เขียวล้วน','FULL_GREEN','FULL_GREEN','COOL','BOTTOM'),

-- FRUIT กลุ่มผลไม้ (ตัวที่ขาดอยู่)
('บลูเบอร์รี่','บลูเบอร์รี่','BLUEBERRY','BLUEBERRY','FRUIT','BOTTOM'),
('มะม่วง','มะม่วง','MANGO','MANGO','FRUIT','BOTTOM'),
('มะม่วง2เม็ด','มะม่วง2เม็ด','MANGO_2CAPS','MANGO_2CAPS','FRUIT','BOTTOM'),
('สตอเบอร์รี่','สตรอเบอร์รี่','STRAWBERRY','STRAWBERRY','FRUIT','BOTTOM'),
('สตอร์','สตรอเบอร์รี่','STRAWBERRY','STRAWBERRY','FRUIT','TOP'),
('สตรอ2เม็ด','สตรอ2เม็ด','STRAWBERRY_2CAPS','STRAWBERRY_2CAPS','FRUIT','BOTTOM'),
('แตงโม','แตงโม','WATERMELON','WATERMELON','FRUIT','BOTTOM'),
('สับปะรด','สับปะรด','PINEAPPLE','PINEAPPLE','FRUIT','BOTTOM'),
('องุ่น','องุ่น','GRAPE','GRAPE','FRUIT','BOTTOM'),
('องุ่น2เม็ด','องุ่น2เม็ด','GRAPE_2CAPS','GRAPE_2CAPS','FRUIT','BOTTOM'),
('องุ่นสลิม','องุ่นสลิม','GRAPE_SLIMS','GRAPE_SLIMS','FRUIT','BOTTOM'),
('แอปเปิ้ล','แอปเปิ้ล','APPLE','APPLE','FRUIT','BOTTOM'),
('แอปเปิ้ล2เม็ด','แอปเปิ้ล2เม็ด','APPLE_2CAPS','APPLE_2CAPS','FRUIT','BOTTOM'),
('เชอร์รี่','เชอร์รี่','CHERRY','CHERRY','FRUIT','BOTTOM'),
('เรนโบว์','เรนโบว์','RAINBOW','RAINBOW','FRUIT','BOTTOM'),
('เจแปน','เจแปน','JAPAN','JAPAN','FRUIT','BOTTOM'),

-- HOT กลุ่มร้อน
('แดง','แดง','RED','RED','HOT','BOTTOM'),
('แดงขาว','แดงขาว','RED_WHITE','RED_WHITE','HOT','BOTTOM'),
('แดงล้วน','แดงล้วน','FULL_RED','FULL_RED','HOT','BOTTOM'),
('แดงอ่อน','แดงอ่อน','RED_LIGHT','RED_LIGHT','HOT','BOTTOM'),
('แดงพรีเมี่ยม','แดงพรีเมี่ยม','RED_PREMIUM','RED_PREMIUM','HOT','BOTTOM'),
('ดำ','ดำ','BLACK','BLACK','HOT','BOTTOM'),
('ทอง','ทอง','GOLD','GOLD','HOT','BOTTOM'),
('คิง','คิง','KINGS','KINGS','HOT','BOTTOM'),
('สปา','สปา','SPA','SPA','HOT','BOTTOM'),
('ขาว','ขาว','WHITE','WHITE','HOT','BOTTOM'),

-- SWEET กลุ่มหวาน / พิเศษ
('ม่วง','ม่วง','PURPLE','PURPLE','SWEET','BOTTOM'),
('ม่วงแคปซูล','ม่วงแคปซูล','PURPLE_CAPSULE','PURPLE_CAPSULE','SWEET','BOTTOM'),
('บารูซัน','บารูซัน','DEFAULT','DEFAULT','SWEET','BOTTOM'),
('บลูคูล','บลูคูล','BLUE_COOL','BLUE_COOL','SWEET','BOTTOM'),
('บลูมินต์2เม็ด','บลูมินต์2เม็ด','BLUE_MINT_2CAPS','BLUE_MINT_2CAPS','SWEET','BOTTOM'),
('ฟิซซ์','ฟิซซ์','FIZZ','FIZZ','SWEET','BOTTOM'),
('บลู1เม็ด','บลู1เม็ด','BLUE_1CAPS','BLUE_1CAPS','SWEET','BOTTOM'),
('บลู2เม็ด','บลู2เม็ด','BLUE_2CAPS','BLUE_2CAPS','SWEET','BOTTOM'),
('ไอซ์1เม็ด','ไอซ์1เม็ด','ICE_1CAPS','ICE_1CAPS','SWEET','BOTTOM'),
('ไอซ์2เม็ด','ไอซ์2เม็ด','ICE_2CAPS','ICE_2CAPS','SWEET','BOTTOM');

-- เช็คว่าครบไหม
SELECT variant_group, COUNT(*) FROM master_typo_funnel GROUP BY variant_group;
-- ต้องได้ COOL 10 / FRUIT 16 / HOT 10 / SWEET 10 = 46 แถว ล๊อค 10 ปี