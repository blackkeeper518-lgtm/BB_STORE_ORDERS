# BB Script Atelier Patch

แพ็กเกจนี้มีเฉพาะไฟล์ที่แก้/เพิ่มสำหรับ Script Atelier และ SQL View สายพัสดุ ไม่ใช่โปรเจกต์เต็ม

ฟีเจอร์ล่าสุด:
- SKU เป็น autocomplete: พิมพ์ 1–2 ตัวอักษรแล้วเลือกจากรายการได้
- ไม่เช็ก IN_STOCK/OUT_OF_STOCK และไม่กันการเขียนสคริปต์
- ลากภาพโยนลงกล่องได้โดยตรง หรือเลือกหลายภาพพร้อมกัน
- ภาพถูกอัปโหลดเข้า Supabase Storage ตอนเพิ่มภาพ

ให้แตก ZIP ทับในโฟลเดอร์โปรเจกต์เดิม โดยคงโครงสร้างโฟลเดอร์ไว้
รัน SQL ใน Supabase ตามความเหมาะสม:

1. `sql/views/combined_views.sql`
2. `sql/views/parcel_delivery_views_combined.sql`
3. `sql/20261106_script_atelier.sql`
