# BB_STORE_ORDERS · Parcel Room Package

แพ็กเกจนี้มีไฟล์ที่แก้แล้ว 4 ไฟล์ ให้คัดลอกทับไฟล์เดิมใน repository โดยรักษาโครงสร้าง path ตามนี้:

- `client/src/pages/OrderHistory.tsx`
- `client/src/pages/ParcelMapping.tsx`
- `server/routers.ts`
- `server/supabase.ts`

## วิธีใช้กับ GitHub

1. แตกไฟล์ ZIP ก่อน
2. เข้า repository `BB_STORE_ORDERS`
3. อัปโหลดไฟล์แต่ละไฟล์ไปยัง path เดิมตามรายการด้านบน ไม่ใช่อัปโหลด ZIP เข้า root อย่างเดียว
4. กด Commit changes
5. Deploy ตาม workflow เดิม

แพ็กเกจนี้ไม่แก้สาย n8n และไม่สร้างข้อความ tracking ใหม่ หน้าเว็บอ่าน `parcel_status_emoji`, `facebook_tracking_message` และ `drakside_tracking_message` จาก view ที่ n8n เตรียมไว้แล้ว
