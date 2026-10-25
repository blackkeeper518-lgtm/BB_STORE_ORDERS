แพ็กเกจ exact lookup พัสดุด้วยเบอร์ — BB_STORE_ORDERS

ไฟล์ในแพ็กเกจ:
- client/src/pages/ParcelMapping.tsx — ช่องกรอกเบอร์และการ์ดผลพัสดุ
- server/routers.ts — admin-only findByPhone และ sendTracking
- server/supabase.ts — lookup แบบ exact ที่คอลัมน์ public.parcels.phone_number
- BB_STORE_ORDERS_PARCEL_QUICK_SEND.patch — patch รวมสำหรับ working copy ของ Git

วิธีทำงาน: กรอกเบอร์ 10 หลักแล้วกด “เปิดแถวจากเบอร์” ระบบ normalize เบอร์ที่กรอก แล้ว query `phone_number` โดยตรง ไม่โหลดรายการทั้งตารางและไม่ค้นจากชื่อ/ที่อยู่/เลขพัสดุ ถ้าเบอร์นั้นมีหลาย parcel จะแสดงแถวที่ match เรียง pickup_date ล่าสุดก่อน

การ์ดแสดง 5 ฟิลด์: pickup_date, consignee, phone_number, cod_amount และ tracking_number โดย tracking_number อยู่ในแผงแยก มีปุ่มคัดลอกเลขพัสดุ ไม่ดึงหรือแสดง address, order_phone หรือ order_number

วิธีใช้ GitHub หน้าเว็บ:
1. แตก ZIP ลงเครื่อง
2. ใน repo เปิดไฟล์ client/src/pages/ParcelMapping.tsx, server/routers.ts และ server/supabase.ts ตาม path เดิม
3. แทนที่เนื้อหาไฟล์เดิมด้วยไฟล์จากแพ็กเกจ แล้ว Commit changes
4. รอ deployment แล้วทดสอบหน้า ParcelMapping ด้วยบัญชี admin

ไม่ต้องรัน SQL เพิ่ม Backend อ่าน Supabase ด้วย service_role ที่เก็บฝั่ง server และ RPC จำกัดด้วย adminProcedure ห้ามใส่ service_role key ใน browser

ถ้าใช้ Git ในเครื่องและ commit ตรงกับฐาน patch ให้รัน: git apply BB_STORE_ORDERS_PARCEL_QUICK_SEND.patch

ตรวจล่าสุด: pnpm check ผ่าน, pnpm test ผ่าน 11 รายการ (2 skipped), pnpm build ผ่าน
