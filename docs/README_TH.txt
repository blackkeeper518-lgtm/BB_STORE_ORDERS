แพ็กเกจปรับปรุงหน้าค้นหา/ส่งเลขพัสดุ — BB_STORE_ORDERS

ในแพ็กเกจมีไฟล์ที่แก้ 4 ไฟล์ พร้อม patch รวมและ SQL สำหรับติดตั้ง

วิธีที่ 1: ใช้ GitHub หน้าเว็บ
1. แตก ZIP ลงเครื่องก่อน (อย่าอัปโหลด ZIP นี้ขึ้น repo เพราะ GitHub จะไม่แตกไฟล์ให้อัตโนมัติ)
2. เปิด repo BB_STORE_ORDERS บน GitHub แล้วเปิดไฟล์เดิมตาม path ต่อไปนี้
   - client/src/pages/ParcelMapping.tsx
   - server/routers.ts
   - server/supabase.ts
3. กด Edit ไฟล์เดิม แล้วแทนที่เนื้อหาทั้งไฟล์ด้วยไฟล์ชื่อเดียวกันจากแพ็กเกจ จากนั้น Commit changes
   ต้องคงโฟลเดอร์เดิมตามรายการข้างบน
4. ไฟล์ PARCEL_QUICK_SEARCH_RPC.sql ไม่ใช่ source code ของหน้าเว็บ ให้นำ SQL ไปรันใน Supabase SQL Editor แยกต่างหาก
5. หลังจากอัปเดตไฟล์และรัน SQL แล้ว ให้รอ deployment ตรวจ build และทดสอบค้น/ส่งจากหน้าเว็บ

วิธีที่ 2: ใช้ Git patch ใน working copy
- ใช้ไฟล์ BB_STORE_ORDERS_PARCEL_QUICK_SEND.patch กับสำเนา repo ที่ตรงกับ commit ต้นทางของ patch
- คำสั่ง: git apply BB_STORE_ORDERS_PARCEL_QUICK_SEND.patch
- จากนั้นตรวจ git diff แล้ว commit/push ตามขั้นตอนปกติ

ฟังก์ชันที่เพิ่ม:
- ค้น parcels ด้วยเบอร์โทร ชื่อผู้รับ เลขพัสดุ หรือที่อยู่
- ค้นและส่งผ่าน server-side admin procedures
- ใช้ Messenger sender เดิม โดย token ไม่ถูกส่งไปหน้า browser
- หยุดส่งถ้าเบอร์ตรงหลายห้อง หรือไม่สามารถยืนยันข้อความขาเข้าภายใน 24 ชั่วโมง

ตรวจใน sandbox แล้ว: TypeScript check ผ่าน, production build ผ่าน, tests ผ่าน 11 รายการ (2 รายการ skipped)
