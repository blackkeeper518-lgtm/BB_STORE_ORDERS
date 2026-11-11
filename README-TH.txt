BB_STORE_ORDERS · V3 OVERLAY

ZIP นี้รวมไฟล์ที่แก้ใน repo BB_STORE_ORDERS: UI หน้า Order Control/Telegram และ address cascade node ตามที่คุยกัน

วางไฟล์
1. แตก ZIP ที่โฟลเดอร์รากของ repo BB_STORE_ORDERS
2. เลือก Replace/Overwrite
3. รัน `corepack pnpm build` (production build ผ่านใน Sandbox แล้ว)

อัปเดต n8n
1. เปิด Code node `👑MASTER ADDRESS CASCADE 3 SYSTEMS`
2. วางโค้ดทั้งก้อนจาก `n8n-live/👑BB_ORDER_SYSTEMS/👑BB_ORDER_04.js`
3. Save แล้วทดสอบออเดอร์ตัวอย่าง

ไฟล์ `👑BB_ORDER_SYSTEMS_FULL.json` เป็น source snapshot ที่ซิงก์กับ JS แล้ว ไม่ได้แนะนำให้นำ workflow ทั้งก้อนไป Import ทับ n8n ที่กำลังใช้งาน เพราะอาจกระทบ connection/credential

สิ่งที่รวมใน V3
- การ์ด `02 / ก้อนออเดอร์แท้` ขอบ/แสงชมพูนีออนชัดขึ้น และ badge SOURCE เปลี่ยนเป็นชมพู
- Order Control และ Telegram อ่านคำเตือนจากข้อมูลต้นทาง ไม่ทำ validation ซ้ำใน UI
- Address cascade อ่าน address candidate จาก `packer_obj`, ผสานบ้านเลขที่เดี่ยวเมื่อ candidate เดิมไม่มีเลขบ้าน, เลือก landmark ที่ใช้ได้เมื่อมีข้อมูลดีกว่า และจำแนก `กรุงเทพ`, `กรุงเทพฯ`, `กทม.`
- ไม่เปลี่ยน route/send gate, ไม่เพิ่ม node เตือนใหม่ และไม่แก้ `BB_ORDER_09`

เรื่องแชท
ผมเทียบ `client/src/pages/ChatHub.tsx`, `server/routers.ts` (sendReply) และ `server/meta.ts` (Meta sender) ระหว่าง `/home/ubuntu/draksidemarketing-system` กับ BB_STORE_ORDERS แล้ว ทั้งสามไฟล์เหมือนกัน จึงไม่มี source code ส่วนต่างให้คัดลอก และ ZIP นี้ไม่ทับไฟล์แชท
เว็บไซต์ Chat ต้องมี `CHAT_SUPABASE_URL` และ `CHAT_SUPABASE_SERVICE_ROLE_KEY` ในฝั่ง server; page token อ่านจาก `🌈MILKY_WAY_xXx_TOKEN _PAGE` ด้วย `page_id` และคอลัมน์ `access_token` เท่านั้น ไม่มี fallback ไป Main/Tracking, ตารางอื่น หรือชื่อคอลัมน์อื่น อย่าใส่ service-role key หรือ page token ใน `VITE_` หรือส่งค่า key มาในแชท

ตรวจแล้ว
- `pnpm build` ผ่าน
- regression test address จำลอง 3 กรณีผ่าน
- diff ไม่มีการเปลี่ยน `send_eligible`, `bb_express_send_route` หรือ Telegram send gate
