# Patch แก้เส้นทางส่งแชท Meta

Patch นี้จัดทำจาก working copy ของ `BB_STORE_ORDERS` ที่ฐาน commit `548782c0c3a8380f28163d2eba8054ef20083b1f` โดยแก้เฉพาะโค้ดฝั่ง server ที่เกี่ยวกับการส่งข้อความ/บันทึกข้อความขาออก และเพิ่ม regression test ของ token lookup

## สิ่งที่แก้

- ค้น Page Access Token จาก `page_tokens_vault` ด้วย `page_id` และคอลัมน์ที่มีใน SQL schema (`page_id`, `page_name`, `access_token`) โดยไม่อ้าง `portal_key` ซึ่งไม่มีใน DDL ที่ repo ระบุ
- เพิ่ม fallback lane สำหรับ Chat, Main Order, Tracking และ Supabase โดยลองต่อเมื่อ lane ก่อนหน้าไม่มีแถว/ใช้ไม่ได้
- หลัง Meta ตอบรับการส่งแล้ว การบันทึกข้อความลง canonical chat/local audit เป็น best-effort ไม่ทำให้หน้าเว็บแจ้งว่าส่งไม่สำเร็จเพียงเพราะ log เขียนไม่ได้
- เพิ่ม mock test ตรวจ query token และ request `POST /{page_id}/messages` โดยไม่ยิงข้อความจริง

## วิธีใช้ใน PowerShell

เปิด PowerShell ในโฟลเดอร์ repository แล้วรัน:

```powershell
git apply .\BB_STORE_ORDERS-chat-send-reliability.patch
```

จากนั้นตรวจและ build:

```powershell
git status --short
pnpm install --frozen-lockfile
pnpm build
pnpm exec vitest run src/lib/metaSender.test.ts
```

คำสั่งทดสอบเฉพาะ Vitest ด้านบนควรรันจาก `client` folder; หรือรัน `pnpm exec vitest run src/lib/metaSender.test.ts` จาก root ตามการตั้งค่า package ของโปรเจกต์

## ขอบเขตและความปลอดภัย

Patch นี้ไม่ได้แก้ Render environment และไม่ได้ส่งข้อความจริง การส่งจริงยังต้องใช้ Page Access Token ที่ถูกต้องและสิทธิ์ Meta Messaging ที่เหมาะสม ห้ามนำ service-role key ไปใส่ตัวแปร `VITE_*` หรือส่งค่า secret ผ่านแชท หลัง apply แล้วต้อง push/deploy เวอร์ชันที่แก้แล้วเองหรือใช้ช่องทาง GitHub ที่เชื่อมต่อไว้
