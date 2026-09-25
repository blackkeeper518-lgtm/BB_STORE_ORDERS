# BB Telegram Queue / History patch

แพ็กเกจนี้ปรับห้อง BB ให้ปุ่ม **กดส่ง Telegram** คงเดิม และเปลี่ยนปุ่มสถานะเป็น **ย้ายเข้าห้องประวัติ** โดยให้สถานะในฐานข้อมูลและ SQL views เป็นตัวกำหนดว่ารายการอยู่ Queue หรือ History ไม่มีการแก้ workflow ใน n8n

## ไฟล์ในแพ็กเกจ

- `patch/bb_telegram_archive_ui.patch` — แพตช์สองไฟล์ ใช้กับ source ปัจจุบันใน repository
- `client/src/lib/TelegramDeliveryRoom.tsx` — ไฟล์หน้าเว็บฉบับแก้แล้ว
- `client/src/lib/canonical.ts` — ไฟล์อ่าน Queue/History จาก SQL views แยกกัน
- `sql/bb_telegram_manual_sent_queue_fix.sql` — migration สำหรับบันทึกสถานะและแยก SQL views

## วิธีแนะนำ: ใช้ patch กับสำเนา repository

จากโฟลเดอร์หลักของ repository ให้รัน:

```bash
git apply /path/to/bb_telegram_archive_ui.patch
```

จากนั้นตรวจ diff ก่อน commit/push:

```bash
git diff -- client/src/lib/TelegramDeliveryRoom.tsx client/src/lib/canonical.ts
```

หากไม่มี Git/terminal และทำผ่าน GitHub เว็บไซต์ ให้เปิดไฟล์เดิมทีละไฟล์ กดปุ่มแก้ไข (ดินสอ) แล้วแทนเนื้อหาด้วยไฟล์ชื่อเดียวกันในโฟลเดอร์ `client/src/lib/` ของแพ็กเกจ จากนั้น commit การเปลี่ยนแปลง โดย **อย่าอัปโหลด `.patch` เป็นไฟล์ธรรมดา** เพราะ GitHub จะเก็บเป็นเอกสาร แต่ไม่ได้ใช้แพตช์กับโค้ด

## ขั้นตอนฐานข้อมูล

เปิด Supabase **โปรเจกต์ BB เท่านั้น** แล้วรัน `sql/bb_telegram_manual_sent_queue_fix.sql` หลังจากมีตาราง `bb_orders_sent_history` และวิว `vw_bb_telegram_manual_room_v1` แล้ว สคริปต์นี้ไม่ลบออเดอร์ และมี backfill แบบหลีกเลี่ยงประวัติซ้ำสำหรับออเดอร์ที่มีสถานะ SENT อยู่แล้ว

หลังจาก migration สำเร็จ ให้อ่าน schema cache ใหม่ถ้าหน้าเว็บยังไม่เห็นวิว:

```sql
NOTIFY pgrst, 'reload schema';
```

## ผลที่คาดหวัง

เมื่อกด **ย้ายเข้าห้องประวัติ** ระบบตั้ง `telegram_status = 'SENT'`, trigger บันทึกรายการลง `bb_orders_sent_history`, SQL Queue view เอารายการออกจากคิว และ SQL Sent view แสดงรายการในประวัติ การกด **กดส่ง Telegram** เป็นคนละการกระทำ และไม่ถูกเปลี่ยนหรือเรียกอัตโนมัติ

การตรวจใน sandbox: SQL ผ่าน PostgreSQL parser และ Vite production build ผ่าน ส่วน `pnpm check` ยังรายงาน TypeScript errors เดิม 5 จุดใน `DashboardLayout.tsx`, `canonical.ts` (Camp types) และ `ParcelMapping.tsx` ซึ่งไม่เกี่ยวกับการเปลี่ยนปุ่ม/queue นี้

ไฟล์เหล่านี้เป็นชุดเตรียมไว้ ยังไม่ได้ commit/push ไป GitHub หรือ execute SQL ใน Supabase
