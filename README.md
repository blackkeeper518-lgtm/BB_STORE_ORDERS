BB Script Atelier Patch
แพ็กเกจนี้มีเฉพาะไฟล์ที่แก้/เพิ่มสำหรับ Script Atelier และ SQL View สายพัสดุที่รวมจากไฟล์แนบ ไม่ใช่โปรเจกต์เต็ม
ให้แตก ZIP ทับในโฟลเดอร์โปรเจกต์เดิมโดยคงโครงสร้างโฟลเดอร์ไว้
ไฟล์ SQL ใหม่ที่รวมจากไฟล์แนบคือ:
sql/views/parcel_delivery_views_combined.sql
ลำดับ View ในไฟล์คือ SHADOW -> ROGUE -> VOID -> DEAD และคง logic เดิมไว้
รัน SQL ใน Supabase ตามความเหมาะสม:
sql/views/combined_views.sql สำหรับ View ชุดหลักเดิม
sql/views/parcel_delivery_views_combined.sql สำหรับ View สายพัสดุ 4 ตัวจากไฟล์แนบ
sql/20261106_script_atelier.sql สำหรับ Script Atelier
ไฟล์นี้ไม่ใช่โปรเจกต์เดี่ยว และต้องใช้ทับบน source project เดิม