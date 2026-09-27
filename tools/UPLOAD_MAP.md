# BLACKBOX upload map

นำไฟล์ในแพ็กนี้ไปวางทับในรีโป `BB_STORE_ORDERS` ตามโครงสร้างเดิม:

- `client/src/index.css` → ทับไฟล์เดิม
- `client/src/pages/AlertRoom.tsx` → ทับไฟล์เดิม
- `client/src/pages/OrderControl.tsx` → ทับไฟล์เดิม
- `sql/BLACKBOX_ROOM.sql` → ไฟล์ SQL ชื่อใหม่ของ BLACKBOX ROOM
- `sql/BLACKBOX_ALERT_CENTER.sql` → ตาราง/วิวศูนย์ป้ายเตือน + 4 ห้อง
- `README_BLACKBOX_ALERT_CENTER.md` → คู่มือโครงสร้างห้องเตือน

## ต้องลบ/เปลี่ยนชื่อใน GitHub เพิ่ม 1 รายการ

ลบไฟล์เก่า:

```text
sql/bb_manual_delivery_and_alert_room_v1.sql
```

เพราะถูกเปลี่ยนชื่อเป็น:

```text
sql/BLACKBOX_ROOM.sql
```

อย่าอัปโหลดไฟล์ `UPLOAD_MAP.md` เข้าโปรเจกต์ก็ได้ ไฟล์นี้มีไว้ช่วยวางไฟล์เท่านั้น

## หลังอัปโหลด

1. ตรวจว่าไฟล์อยู่ตรง path ตามรายการด้านบน
2. รัน SQL `sql/BLACKBOX_ALERT_CENTER.sql` ใน Supabase
3. ตรวจหน้า `/orders` และ `/alert-room`
4. รัน `pnpm build`
