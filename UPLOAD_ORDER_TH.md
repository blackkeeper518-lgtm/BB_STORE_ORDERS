# BB_STORE_ORDERS · Secret Gallery Parcel Package

แพ็กเกจนี้ทำให้ห้อง Parcel และ Tracking Capsule ใช้ Supabase connection ที่บันทึกจาก `/secret-gallery/connect` โดยตรง ค่าจาก Secret Gallery มีสิทธิ์เหนือ deployment config

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
4. ใส่ URL และ Anon/Publishable Key ของโปรเจกต์ที่ต้องการใช้ แล้วกดเชื่อมต่อ
5. กลับเข้าห้อง Parcel หรือหน้าแชท แล้วกดรีเฟรช

## แหล่งข้อมูล

คิวปกติดึงจาก `🦅ROGUE_xXx_SHIPPINGz` เพียงห้องเดียว เพราะ ROGUE ประกอบเลขพัสดุกับข้อมูลบิลจากสองฝั่งไว้แล้ว ไม่ดึง SHADOW มาซ้อน

โหมดประวัติ `sent` เท่านั้นจึงอ่าน `📓DEAD_xXx_NOTE`

ข้อมูลสถานะและข้อความอ่านจาก n8n ตรง ๆ:

- `parcel_status_emoji`
- `facebook_tracking_message`
- `drakside_tracking_message`

ไม่สร้างข้อความใหม่ ไม่คำนวณสถานะใหม่ และไม่เปลี่ยนสาย n8n
