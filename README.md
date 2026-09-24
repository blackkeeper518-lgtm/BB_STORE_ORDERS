# BB Telegram Delivery Room Package

แพ็กเกจนี้สำหรับโปรเจกต์ BB เท่านั้น ห้ามนำ SQL ไปใช้ในฐานข้อมูล ST

## หน้าเว็บ

วางไฟล์ตามโครงสร้างเดิม:

```text
client/src/pages/TelegramDeliveryRoom.tsx
client/src/lib/canonical.ts
client/src/lib/telegramDelivery.ts
```

Route เดิมยังใช้:

```text
/telegram-delivery
```

หน้า BB รองรับการติ๊กเลือกออเดอร์หลายรายการ, เปิด/ปิดเลือกทั้งหมด, ปล่อยรันเฉพาะรายการที่เลือก, คัดลอกบิล, แก้ไข, ส่งจากเว็บ, ส่งจากภายนอก และกด `ติ๊ก SENT` ภายหลังได้ โดยการปล่อยรันไม่เปลี่ยน SENT อัตโนมัติ

## SQL ที่ให้มา

รันใน Supabase BB เท่านั้น:

1. `vw_bb_orders_all_v2.sql` หรือ `vw_bb_orders_all_v2_slim.sql` ตาม View ที่หน้าเว็บใช้อยู่
2. `vw_bb_product_extraction_lab88_fixed.sql`
3. `vw_bb_product_extraction_lab88_candidates_lines.sql`
4. `bb_stamp_telegram_header_by_product_lane.sql`
5. `bb_manual_delivery_and_alert_room_v1.sql`

`vw_bb_product_extraction_lab88_fixed.sql` ใช้ `CREATE OR REPLACE VIEW` ไม่ใช้ `DROP VIEW` เพื่อไม่ทำลาย View เว็บที่พึ่งพา Lab 88

`vw_bb_product_extraction_lab88_candidates_lines.sql` แตก `lab_product_candidates` เป็น 1 สินค้า = 1 แถว โดยรักษา:

```text
raw_text
view_th_name_clean
master_sku
master_th_name
bb_pack
cot_quantity
line_mapping_status
```

## กฎข้อมูล

- BB ใช้ `vw_bb_product_extraction_lab88` เป็นก้อน Lab หลัก
- ใช้ `vw_bb_product_extraction_lab88_candidates_lines` สำหรับอ่านรายสินค้า
- `bb_pack` ใช้สำหรับคนแพ็ก เช่น `🟥 CAVALLO_RED(คาวาโร่แดง)`
- ถ้าแมปไม่ได้ ให้เก็บ raw evidence และขึ้นป้ายตรวจ ห้ามเดา SKU
- หัวบิลใช้ค่าจากฐานข้อมูลเมื่อมีค่า
- ส่งจากเว็บหรือส่งจากภายนอกได้ แล้วกลับมากด `ติ๊ก SENT`
- ห้ามรัน SQL ชุดนี้ใน ST
