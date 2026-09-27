# BB web routing + NIGHTOPS high-tech control

รวมจาก `bb-web-routing-patch-2026-09-27.zip` และชุดหน้า Control ไฮเทคจาก commit `9f8f5ee`.

ไฟล์หลัก:

- `client/src/App.tsx`
- `client/src/pages/ConnectSupabase.tsx`
- `client/src/lib/canonical.ts`
- `client/src/pages/DailyChatSummary.tsx`
- `client/src/pages/OrderControl.tsx`
- `client/src/pages/TelegramDeliveryRoom.tsx`

เส้นทางข้อมูล BB:

- `dk_darksidemarketing_bb`
- `dk_darksidemarketing_telagram_bb`
- สินค้า: `bb_pack_center` จาก LAB
- หัวบิล: `stock_notice`
- ตัวผูก: `upsert_key`

ไม่รวมไฟล์สำรองหรือไฟล์คนละชุด


กฎเวลา: ใช้ `order_time_display` เท่านั้น ห้ามใช้เวลาอื่นเป็นเวลาออเดอร์
