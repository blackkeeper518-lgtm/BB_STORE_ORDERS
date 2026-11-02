# BB_STORE_ORDERS · Secret Gallery Parcel Package

แพ็กเกจล่าสุดนี้ทำให้ห้อง Parcel และ Tracking Capsule ใช้ Supabase connection ที่บันทึกจาก `/secret-gallery/connect` โดยตรง

ค่าจาก Secret Gallery มีสิทธิ์เหนือ `VITE_SUPABASE_URL` ของ deployment ดังนั้นโปรเจกต์จะไม่ถูกฟิกจากค่า deployment เมื่อจารย์เลือก connection ใหม่ใน Secret Gallery

## ไฟล์ที่ต้องวางทับตาม path

- `client/src/lib/canonical.ts`
- `client/src/pages/ChatHub.tsx`
- `client/src/pages/ParcelMapping.tsx`
- `client/src/pages/OrderHistory.tsx`
- `server/routers.ts`
- `server/supabase.ts`

## วิธีใช้งาน

1. แตก ZIP
2. อัปโหลดไฟล์แต่ละไฟล์เข้า path เดิมใน GitHub ไม่ใช่อัปโหลด ZIP เข้า root อย่างเดียว
3. เปิด `/secret-gallery/connect`
4. ใส่ URL และ Anon/Publishable Key ของโปรเจกต์ที่ต้องการใช้
5. กดเชื่อมต่อให้ขึ้นว่าเชื่อมต่อแล้ว
6. กลับเข้าห้อง Parcel หรือหน้าแชท แล้วกดรีเฟรช

ห้อง Parcel อ่านตรงจาก `🔮 SHADOW_xXx_RECALL` และ `📓 DEAD_xXx_NOTE` โดยใช้ข้อมูลจาก n8n ตรง ๆ: `parcel_status_emoji`, `facebook_tracking_message`, `drakside_tracking_message`

ไม่สร้างข้อความใหม่ ไม่คำนวณสถานะใหม่ และไม่เปลี่ยนสาย n8n
