# Patch แก้เส้นทางส่งแชท Meta

**เอกสาร/patch นี้เป็นฉบับเก่าและห้ามนำไป apply กับโค้ดปัจจุบัน.** มันอ้างอิง token vault และพฤติกรรม fallback รุ่นก่อน; โค้ดปัจจุบันใช้ `🌈MILKY_WAY_xXx_TOKEN _PAGE` ใน Chat project เท่านั้น

## สิ่งที่แก้

- ค้น Page Access Token จาก `🌈MILKY_WAY_xXx_TOKEN _PAGE` ด้วย `page_id` และใช้เฉพาะคอลัมน์ `access_token`
- ต้องกำหนด `CHAT_SUPABASE_URL` และ `CHAT_SUPABASE_SERVICE_ROLE_KEY`; ไม่มี fallback ไป URL, lane, table, column หรือ environment value อื่น
- หลัง Meta ตอบรับการส่งแล้ว การบันทึกข้อความลง canonical chat/local audit เป็น best-effort ไม่ทำให้หน้าเว็บแจ้งว่าส่งไม่สำเร็จเพียงเพราะ log เขียนไม่ได้
- เพิ่ม mock test ตรวจ query token และ request `POST /{page_id}/messages` โดยไม่ยิงข้อความจริง

## วิธีใช้ใน PowerShell

คำสั่งต่อไปนี้เป็นตัวอย่างเดิมสำหรับ patch รุ่นเก่าเท่านั้น ห้ามรันกับ branch ปัจจุบัน:

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
