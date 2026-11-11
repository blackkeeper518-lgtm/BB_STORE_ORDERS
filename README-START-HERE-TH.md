# BB_STORE_ORDERS — Overlay สำหรับวางทับไฟล์

ZIP นี้เป็นชุดไฟล์ source ที่แก้ล่าสุด ไม่ใช่ Git patch: แตกไฟล์ลงในโฟลเดอร์รากของ repo `BB_STORE_ORDERS` แล้วเลือกเขียนทับไฟล์เดิม

## สิ่งที่รวม

- ChatHub อ่านห้องและข้อความจากตารางผ่าน server, ตอบแบบแสดงข้อความทันที (optimistic UI), จดจำห้อง/ตัวกรองเพจ และมีแถบ COD/SIGNAL neon marquee
- Chat API, การค้นหา page token ตาม `portalKey`, การบันทึกข้อความตอบกลับ/รูปภาพ และการอัปโหลดรูปอยู่ฝั่ง server
- Endpoint ของห้องแชทและอัปโหลดรูปใช้ `adminProcedure` จึงต้องล็อกอินด้วยบัญชีที่มี role `admin`
- ไฟล์หน้า Order Control, Telegram warning display, ตัวอ่านสัญญาณเตือน และ CSS ที่ค้างจากชุดงานก่อนหน้า

ZIP นี้ **ไม่รวมการแก้ n8n Node 04 หรือไฟล์ workflow JSON** เพราะคุณแจ้งว่าเรื่องที่อยู่นั้นเคลียร์แล้ว จึงไม่เขียนทับการตั้งค่าฝั่ง n8n ของคุณ และไม่มีการเปลี่ยน send gate ของ n8n ในชุดนี้

## วิธีวางทับบน Windows

1. ปิด dev server ก่อน และสำรองโฟลเดอร์ repo ไว้หนึ่งชุดก่อน เช่นคัดลอกเป็น `BB_STORE_ORDERS-backup`
2. แตก ZIP ลงในโฟลเดอร์ที่มี `package.json` ของ repo อยู่ เช่น `E:\...\BB_STORE_ORDERS` แล้วอนุญาตให้ Replace/Overwrite ไฟล์เดิม
3. เปิด PowerShell ที่โฟลเดอร์ repo แล้วรัน:

   ```powershell
   corepack pnpm install --frozen-lockfile
   corepack pnpm build
   ```

   ถ้าเครื่องยังไม่รู้จัก `corepack` หรือ `pnpm` ให้ติดตั้ง Node.js รุ่น LTS ก่อน แล้วเปิด PowerShell ใหม่ หากยังไม่พบ pnpm ใช้ `npm install -g pnpm@10.4.1` หนึ่งครั้ง จากนั้นรัน `pnpm install --frozen-lockfile` และ `pnpm build`

4. หาก build ผ่าน ให้ commit และ push ตามวิธี Git ที่ใช้อยู่ เพื่อให้ Render deploy source ชุดใหม่ ตัวอย่างข้อความ commit ตามรูปแบบที่คุณใช้คือ `⭐⭐⭐`

## ตั้งค่า server สำหรับแชท

- ต้องตั้ง `CHAT_SUPABASE_URL` และ `CHAT_SUPABASE_SERVICE_ROLE_KEY` ของโปรเจกต์ Chat ใน environment ฝั่ง server/Render; ไม่มี URL หรือ key fallback ไป Main/Tracking/โปรเจกต์อื่น
- Meta page token จะถูกค้นใน `🌈MILKY_WAY_xXx_TOKEN _PAGE` ด้วย `page_id` และอ่านเฉพาะคอลัมน์ `access_token`; ไม่มี fallback ไปชื่อตารางหรือคอลัมน์อื่น ห้ามใส่ service-role key หรือ page access token ลงในไฟล์ client และอย่าส่ง key มาทางแชท
- ต้องล็อกอินด้วยบัญชีที่ `role` เป็น `admin`; ถ้าเห็น 401/403 ให้ตรวจ session และ role ของบัญชีนั้นก่อน ไม่ใช่แก้กลับไปเปิด endpoint เป็น public

## ตรวจสอบที่ทำแล้ว

- `pnpm build` ผ่านใน Sandbox
- mock integration test ผ่านสำหรับการอ่านห้อง/ข้อความ, การได้ Customer PSID จากแถวแชท, COD signal, การหา page token ตาม `portalKey` และการเขียนข้อความ/รูปตอบกลับกลับเข้าตาราง โดยไม่ได้เรียก Supabase หรือ Meta จริง
- TypeScript no-emit ตรวจเส้นทางแชทที่เพิ่มแล้ว แต่ยังรายงานการเรียก router เดิมที่ไม่มีนิยามอยู่ก่อนแล้วใน ChatHub (`orders.*` และ `chat.metaErrors`) ซึ่งไม่ได้ขยายหรือเปลี่ยนใน overlay นี้
