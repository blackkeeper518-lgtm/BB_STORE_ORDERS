BB_STORE_ORDERS — ระบบตอบแชท, ธีมม่วง และ Order Control traceability

ฐานที่ใช้
Repository: blackkeeper518-lgtm/BB_STORE_ORDERS
Commit ฐาน: 548782c0c3a8380f28163d2eba8054ef20083b1f

รายการแก้ไข
- ปรับ Meta reply token lookup ให้ใช้ page_id และ portal_key ตามข้อมูลของเพจ พร้อมส่ง metadata ที่จำเป็นไปกับ reply
- ทำ optimistic reply และบันทึกข้อความขาออกเป็น best-effort หลัง Meta รับข้อความ เพื่อไม่ให้การเขียน log กลับล้มเหลวมาทำให้ reply ที่ส่งสำเร็จแสดงเป็นส่งไม่สำเร็จ
- บันทึกข้อความขาออกด้วย insert ปกติ ไม่ใช้ ON CONFLICT/dedupe_key ที่ฐานไม่มี unique constraint รองรับ
- เพิ่มการค้น Telegram queue และ sent archive ใน universal search ของ Order Control ให้เทียบกับ HERMES, Chat และ Parcel แสดง upsert_key, กลุ่มเป้าหมายจาก telegram_body.chat_id, queue/SENT status, เวลา SENT และลิงก์ไปหน้ารายการ Telegram
- ตัด balloonnotice ที่ไม่มี/ชื่อไม่ตรงใน Telegram views และ telegram_message_web/telegram_change_alert_web ที่ไม่มีใน GENESIS query ออก เพื่อให้ query queue/history ไม่ล้มจากคอลัมน์ที่ไม่มี
- คงธีมม่วง ป้าย neon และไฟ/ป้ายห้องแชท พร้อมรักษา behavior หลักของ repo เก่าไว้

ข้อจำกัดของ Telegram status
Order Control แสดงสถานะที่บันทึกอยู่ใน PIONEER queue และ GENESIS archive เท่านั้น ไม่ได้อ่านประวัติข้อความในกลุ่ม Telegram แบบสด หากต้องการหลักฐานระดับ Bot API จริง ควรให้ n8n คืนค่า Telegram `ok: true`/`message_id` หลังส่งสำเร็จและบันทึก receipt นั้นในข้อมูลที่เว็บอ่านได้; แพตช์นี้ไม่เปลี่ยน schema หรือ n8n workflow

ไฟล์ที่เปลี่ยน
- client/src/index.css
- client/src/lib/canonical.ts
- client/src/pages/ChatHub.tsx
- client/src/pages/OrderControl.tsx
- server/meta.ts
- server/routers.ts
- server/supabase.ts

การตรวจสอบ
- `pnpm build` ผ่านหลังการแก้ไข
- ตรวจแล้วว่าคอลัมน์ใน Telegram SELECT มีอยู่ใน PIONEER และ GENESIS ตาม SQL ใน repository
- `git diff --check` ผ่าน และตรวจ `git apply --check` กับ commit ฐานได้
- `pnpm test` ยังล้ม 3 เคสใน `src/lib/orderWarnings.test.ts` (province/high-risk warnings); ไม่เกี่ยวกับไฟล์ที่แก้ในแพตช์นี้
- `pnpm check` เดิมเรียก `tsc --noEmit` แต่ repository ไม่มี tsconfig.json จึงไม่สามารถใช้คำสั่งนั้นตรวจ type ได้

วิธีใช้
1. Checkout commit ฐานด้านบนหรือเปิด working copy ของ repository นี้
2. ใช้ `git apply BB_STORE_ORDERS-chat-reply-purple-theme.patch`
3. รัน `pnpm install --frozen-lockfile && pnpm build`
4. สำหรับ Render ใช้ Build Command: `pnpm install --frozen-lockfile && pnpm build`

ยังไม่ได้ push ขึ้น GitHub หรือ deploy และไม่มีการแก้ Supabase schema, n8n workflow หรือ credentials/environment variables.
