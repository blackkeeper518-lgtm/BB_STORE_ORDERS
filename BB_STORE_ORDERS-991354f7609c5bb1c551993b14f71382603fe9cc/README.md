# แพ็กเกจ BB / ST — ห้องกลาง Telegram + ห้องส่ง

ไฟล์นี้รวม SQL ของแต่ละค่ายแยกกัน และ patch สำหรับโค้ดหน้าเว็บ BB ที่แก้หน้าแรก/แหล่งแสดงสินค้า

## ไฟล์ในแพ็กเกจ

- `BB_telegram_rooms.sql` — SQL เต็มของ **BB เท่านั้น**
- `ST_telegram_rooms.sql` — SQL เต็มของ **ST เท่านั้น**
- `BB_STORE_ORDERS_home_orders_lab88.patch` — patch โค้ดเว็บ BB: `/` ไป `/orders` และใช้ `lab_product_candidates[*].master_display_for_packer` เป็นแหล่งแสดงสินค้า

## สำคัญก่อนรัน SQL

1. ไฟล์ BB กับ ST เป็นคนละโปรเจกต์/ฐานข้อมูล **ห้ามรันสลับค่าย**
2. รัน SQL ของค่ายนั้นใน Supabase SQL Editor ของค่ายเดียวกันเท่านั้น
3. SQL ทั้งสองไฟล์อาศัย view ต้นทาง Lab 88 และ Lab 99 ที่มีอยู่แล้ว โดยจะไม่ลบหรือสร้างทับ Lab 88/Lab 99
4. สคริปต์จะสร้าง/แทนที่ห้องกลางและห้องส่ง พร้อมคิวที่ตัดรายการที่ส่งแล้วออกจากห้องส่ง โดยตรวจสถานะในตารางหลักของค่าย (`bb_orders` หรือ `st_orders`)
5. n8n ควรอัปเดตแถวด้วย `upsert_key` หลัง Telegram ส่งสำเร็จ แล้วตั้ง `telegram_status = 'SENT'` และ/หรือ `telegram_sent = true` เท่านั้น อย่าตั้ง SENT ก่อนส่งสำเร็จ
6. ST มีเงื่อนไขเวลาตั้งแต่ 22:00 ของเมื่อวานตามเวลา Bangkok และเรียงจากเก่าไปใหม่ ส่วน BB ใช้เงื่อนไขตาม SQL BB

## การอัปโหลดขึ้น GitHub

หน้า GitHub `/upload/main` รับไฟล์ที่เลือก/ลากวาง แต่การอัปโหลด ZIP **ไม่แตกไฟล์ให้อัตโนมัติ** และการอัปโหลดไฟล์ `.patch` จะเก็บ patch ไว้เฉย ๆ ไม่ได้แก้ source code ให้อัตโนมัติ

- หากต้องการเก็บไฟล์ SQL ใน repository ให้แตก ZIP ในเครื่องก่อน แล้วอัปโหลด `BB_telegram_rooms.sql`, `ST_telegram_rooms.sql` และ `README.md` เข้าไป
- หากต้องการใช้ patch เปลี่ยน source code เว็บ BB ให้ตรวจและ apply patch กับ clone ของ repository ด้วย `git apply BB_STORE_ORDERS_home_orders_lab88.patch` จากนั้นค่อย commit/push ตามขั้นตอนของคุณ หรือแก้/อัปโหลด source files ที่เปลี่ยนโดยตรง
- การเก็บ SQL ไว้ใน GitHub ไม่ได้รัน SQL และไม่ได้ deploy เว็บไซต์โดยอัตโนมัติ

## ขอบเขตการตรวจสอบ

เว็บแพตช์ผ่าน TypeScript check, production build และ unit tests ใน working copy ก่อนแพ็ก แต่ SQL ยังไม่ได้รันกับฐานข้อมูลจริง จึงควรตรวจชื่อ view ต้นทางและดูจำนวนแถวหลังติดตั้งด้วย read-only checks ที่ท้ายไฟล์ก่อนนำไปใช้จริง
