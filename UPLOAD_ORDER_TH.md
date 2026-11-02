# BB_STORE_ORDERS · ChatHub Layout Package

ปรับห้องแชทเป็นโครงสร้างสามคอลัมน์แบบ Meta:

- ซ้าย 300px: รายชื่อห้องแชท เลื่อนเฉพาะรายการ
- กลาง: กล่องแชท ล็อกพื้นที่ เลื่อนเฉพาะข้อความ และ composer อยู่ด้านล่าง
- ขวา 320px: เครื่องมือของห้องที่เลือก เลื่อนเฉพาะแผง และหุบได้

Tracking Card อยู่แผงขวาเพียงที่เดียวตามห้องที่เลือก ไม่มีการ์ดซ้ำกลางแชท มีปุ่ม `เสียบ Facebook ลงกล่อง` และ `เสียบ Drakside ลงกล่อง` การกดจะใส่ข้อความใน composer เท่านั้น ยังไม่ส่ง Messenger

Parcel Mapping ยังคงอ่านคิวจาก `🦅ROGUE_xXx_SHIPPINGz` ห้องเดียว และไม่รวม HUNTER / ไม่คำนวณสถานะเอง

ใช้ connection จาก `/secret-gallery/connect` โดยตรง

ไฟล์ที่ต้องวางทับตาม path:

- `client/src/lib/canonical.ts`
- `client/src/pages/ChatHub.tsx`
- `client/src/pages/ParcelMapping.tsx`
- `client/src/pages/OrderHistory.tsx`
- `server/routers.ts`
- `server/supabase.ts`
