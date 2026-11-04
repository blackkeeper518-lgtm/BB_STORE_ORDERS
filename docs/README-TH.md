# DK DRAKSIDE — PARCEL MAPPING / SPACE VAULT

แพ็กนี้เป็นหน้าห้องเลขพัสดุธีมอวกาศ พร้อม queue จากสาย `SHADOW → ROGUE → VOID` และตัวอย่างข้อความลูกค้า

## ไฟล์

- `01-server/routers.ts` — endpoint `parcels.mappingQueue` และการส่งที่มีอยู่เดิม
- `01-server/supabase.ts` — helper ดึงคิวจาก view เดิม
- `02-client/ParcelMapping.tsx` — หน้า command center ธีม Space Vault
- `02-client/index.css` — ชั้นภาพดาว วงโคจร HUD และเอฟเฟกต์นีออนที่หน้าใช้
- `03-patch/PARCEL-MAPPING.patch` — diff รวม frontend/backend

## ติดตั้ง

1. คัดลอก `02-client/ParcelMapping.tsx` ทับไฟล์หน้าเดิม
2. คัดลอกกฎใน `02-client/index.css` เข้า `client/src/index.css` หรือใช้ไฟล์นี้แทนฉบับเดิม โดยรักษา CSS ธีมอื่นไว้
3. คัดลอก `01-server/routers.ts` และ `01-server/supabase.ts` ตามแพตช์
4. ตรวจ environment ฝั่ง server ตามเดิม แล้ว build/deploy

หน้านี้เป็น preview และ queue console เท่านั้น ไม่เปิดเผย Page Access Token และไม่ยิง Messenger ซ้ำจากหน้าเว็บ
