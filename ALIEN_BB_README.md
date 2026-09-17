# Alien patch — BB

ชุดนี้คัดลอกจากแพตช์ ST ที่ตรวจ build ผ่าน แล้วเปลี่ยนค่ายเป็น BB

- ตารางออเดอร์: `public.bb_orders`
- ค่ายใน `canonical.ts`: `BB`
- Customer History: `normalized_chat_timeline`
- สินค้าแสดงจาก: `product_master.master_display_for_packer` เท่านั้น
- จับได้จริงเท่านั้นเป็น `MATCHED`; จับไม่ได้เป็น `REVIEW`/`RAW_MISSING` และไม่ทิ้งออเดอร์
