# BB_STORE_ORDERS · ChatHub Package

- เวลาในข้อความใช้รูปแบบ `02/11/69 09:40`
- ข้อความฝั่งลูกค้าใช้ชื่อลูกค้าจริง ไม่แสดงคำว่า `ลูกค้า`
- ข้อความฝั่งเพจใช้ชื่อเพจจริง ไม่แสดงคำว่า `เพจ / แอดมิน`
- แถบบนสุดเหลือ `SYNC OK · รอบล่าสุด: เวลา`
- แชทกลางเลื่อนเฉพาะข้อความ
- แผงเครื่องมือขวาเป็น drawer ของห้องที่เลือกและหุบได้
- Tracking Card แสดงเฉพาะห้องที่มีออเดอร์จับคู่จริง
- ปุ่มเสียบข้อความใส่ composer เท่านั้น ยังไม่ส่ง Messenger

ไฟล์ที่ต้องวางทับตาม path:

- `client/src/lib/canonical.ts`
- `client/src/pages/ChatHub.tsx`
- `client/src/pages/ParcelMapping.tsx`
- `client/src/pages/OrderHistory.tsx`
- `server/routers.ts`
- `server/supabase.ts`
