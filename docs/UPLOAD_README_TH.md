# แพ็กเกจอัปเดตเว็บ BB_STORE_ORDERS → HERMES_ARCHIVE

แพ็กเกจนี้เป็น **ไฟล์ source สำหรับนำไปวางทับใน repository เดิม** ไม่ใช่เว็บ static ที่อัปโหลดเข้า file manager แล้วเปิดใช้ได้ทันที

## ใช้งาน

1. สำรอง repository ปัจจุบันก่อน
2. แตก ZIP ที่ root ของ repository เดิม โดยคงโครงสร้างโฟลเดอร์และอนุญาตให้เขียนทับไฟล์
3. รัน `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`
4. นำการเปลี่ยนแปลงเข้า Git และ deploy ด้วยระบบเดิมของโปรเจกต์
5. ตรวจนโยบาย Supabase RLS/สิทธิ์สำหรับ role ที่เว็บใช้
6. หากต้องการเปลี่ยน alert/Telegram views ให้รัน `sql/BLACKBOX_ROOM.sql` ใน Supabase SQL Editor ก่อนเปิดใช้หน้าที่อ่าน views

## ไฟล์ที่รวม

- `client/src/lib/canonical.ts` — อ่านจาก `🗝️HERMES_ARCHIVE`, เลือก projection, จำกัด 1,000 รายการ และอัปเดตด้วย `upsert_key`
- `client/src/lib/telegramDelivery.ts` — เลือกข้อความบิลที่มาจาก node
- `client/src/pages/OrderControl.tsx` — ให้ปุ่มรีเฟรชถามยืนยัน; search/date filters ทำงานในข้อมูลที่โหลดแล้ว ไม่ดึงใหม่อัตโนมัติ
- `client/src/pages/TelegramDeliveryRoom.tsx` — ใช้ source และฟิลด์ที่มีใน schema ปัจจุบัน
- `sql/BLACKBOX_ROOM.sql` — ปรับ read-only views ให้ใช้ `🗝️HERMES_ARCHIVE`

## หมายเหตุการ deploy

ใน repository มี `VERCEL_DEPLOY.md` ระบุว่าแอปนี้มี Express server แบบ long-running และยังไม่ใช่ Vercel serverless entrypoint ที่พร้อม deploy ตรง ๆ ดังนั้น **อย่านำ `dist/public` อย่างเดียวไปแทนเว็บไซต์เต็ม** เพราะ API เช่น `/api/trpc` อาจใช้งานไม่ได้ ให้นำ source files ไปยัง repo และ deploy ผ่าน hosting/server pipeline เดิม หรือแยกทำ Vercel API adapter ก่อน

แพ็กเกจนี้ไม่มี `.env`, API keys หรือ secrets และการเปลี่ยน SQL ยังไม่ได้ถูกรันกับฐานข้อมูลจริง
