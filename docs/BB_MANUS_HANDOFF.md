# BB STORE ORDERS — Manus Handoff

## วิธีใช้

เปิด Manus ด้วยบัญชีใหม่ แล้วส่งข้อความนี้พร้อมลิงก์ repository:

> ทำงานต่อจาก BB STORE ORDERS โดยอ่าน `docs/BB_MANUS_HANDOFF.md` และ `docs/BB_MOBILE_AND_REALTIME_STOCK_PLAN_2026-11-25.md` ก่อน ห้ามแตะฐานข้อมูล production ระหว่างทดสอบ และห้ามเปลี่ยน ST repository

Repository:

```text
https://github.com/blackkeeper518-lgtm/BB_STORE_ORDERS
```

Clone แล้ว checkout `main` จากนั้นอ่านไฟล์ handoff นี้เป็นลำดับแรก

## สถานะล่าสุด

- Branch: `main`
- Latest commit: `871e727 docs: note optional realtime infrastructure costs`
- Repository เป็น BB ที่ clone ST มาทับทั้ง repository แล้ว
- ST repository เดิมต้องไม่ถูกแก้
- rollback branch เดิมยังต้องรักษาไว้:
  `backup/bb-before-full-st-overwrite-20261125-080237`
- งานเว็บ, n8n source และ exported workflows ถูก commit/push แล้ว
- `dist/` และ `node_modules/` เป็นไฟล์ generated ห้าม commit

## หลักสถาปัตยกรรมที่ต้องรักษา

- Project 1 Order เป็น source-of-truth สำหรับการสกัด Order, COD, customer, address, product และ `packer_obj`
- Project 4 Signal มีหน้าที่อ่าน/ดึงผลและส่งต่อ route/alert ไม่สร้าง COD หรือสถานะ Order ใหม่
- Project 2 Risk ใช้ข้อมูล gate ที่คำนวณแล้วเท่านั้น และห้ามสร้าง normal risk alert จาก `BLACK_REVIEW`
- เว็บมือถือไม่คำนวณสถานะธุรกิจซ้ำ
- ระบบผ่านด่านหลักใช้ emoji route ของ BB เป็นสัญญาณกลาง อย่าให้ node หลังสร้างกฎผ่านซ้อนจนทำให้ emoji เดิมหาย
- ก้อนสรุปออเดอร์แท้ที่มี COD, เบอร์, ที่อยู่, รหัสไปรษณีย์, สินค้า และจำนวน ให้ผ่านได้ แม้ไม่มี emoji signature
- ถ้าฟิวด์สินค้า/ที่อยู่เป็นคำพูดบอท เช่น `สนใจรับเป็นรสไหนดี`, `จะจัดเซ็ต`, `พร้อมส่ง`, `ส่งฟรีถึงหน้าบ้าน`, `แกะเช็คก่อนจ่าย` ให้เป็น `BLACK_REVIEW`
- สินค้าตัดจริงต้องอ่านจาก GENESIS/SENT History ที่ยืนยัน SENT แล้ว
- ยังไม่เปิด auto stock deduction จนกว่าจะล็อก trigger, idempotency key, quantity ต่อ SKU และ inventory source

## ไฟล์สำคัญ

### เว็บ

- `client/src/pages/TelegramSentHistory.tsx`
- `client/src/pages/OrderHistory.tsx`
- `client/src/components/chat/MobileStockPanel.tsx`
- `client/src/pages/StockRoom.tsx`
- `client/src/lib/history-product.ts`
- `client/src/lib/stock-availability.ts`
- `client/src/lib/canonical.ts`

### n8n source

- `n8n-live/PROJECT_1_ST_ORDER/👑BB_ORDER_01.js`
- `n8n-live/PROJECT_1_ST_ORDER/👑BB_ORDER_05.js`
- `n8n-live/PROJECT_4_ST_SIGNAL_TELEGRAM_AUX/SIGNALS/SIGNALS_NODE_01.js`
- `n8n-live/PROJECT_4_ST_SIGNAL_TELEGRAM_AUX/SIGNALS/SIGNALS_NODE_02.js`
- `n8n-live/PROJECT_2_ST_PARCEL_TRACKING_SEND_LINE/EXPRESS/🚨DELIVERY_RISK_PROVINCE_HEADER🚨.js`

### Exported workflows

- `n8n-live/PROJECT_1_ST_ORDER/ST_ORDER_SYSTEMS_FULL.json`
- `n8n-live/PROJECT_1_ST_ORDER/ST_ORDER_SYSTEMS_FULL2.json`
- `n8n-live/PROJECT_4_ST_SIGNAL_TELEGRAM_AUX/SIGNALS/ST_SIGNALS_FULL.json`
- `n8n-live/PASTE_READY/ST_ORDER_SYSTEMS_PASTE.json`
- `n8n-live/PASTE_READY/ST_SIGNALS_PASTE.json`
- `n8n-live/PROJECT_2_ST_PARCEL_TRACKING_SEND_LINE/EXPRESS/👑BB_EXPRESS_FULL2.js`

### Tests / documents

- `n8n-live/tests/risk-destination-black-review.test.cjs`
- `docs/BB_MOBILE_AND_REALTIME_STOCK_PLAN_2026-11-25.md`
- `docs/BB_MOBILE_AND_REALTIME_STOCK_PLAN_2026-11-25.pdf`

## คำสั่งตรวจพื้นฐาน

```bash
pnpm exec vitest run client/src/lib/stock-availability.test.ts client/src/lib/order-deck-product-index.test.ts client/src/lib/order-deck-context.test.ts client/src/lib/metaSender.test.ts client/src/lib/chat-image-upload.test.ts server/meta.test.ts
pnpm build
node n8n-live/tests/risk-destination-black-review.test.cjs
```

n8n Code Node มี top-level `return` จึงต้องรันผ่าน wrapper ไม่ใช่ `node --check` ตรง ๆ

## งานที่ควรทำต่อ

1. รัน workflow จริงแบบไม่เขียน production เพื่อยืนยัน 3 รูปแบบก้อนบิลแท้ผ่านครบ
2. ตรวจว่า emoji route ของ BB ไม่หายระหว่าง Order → Signal → Gatekeeper → Switch
3. ตรวจข้อความบอทที่ถูกใส่ใน product/address ว่าเป็น `BLACK_REVIEW` และไม่เข้า normal risk alert
4. เปิด Supabase Realtime แบบ read-only ก่อน เพื่อให้ Mobile Stock, Desktop Stock Room และ Product Dock เห็นสถานะเดียวกัน
5. ทำ shadow stock movement จาก SENT History ก่อนเปิดตัดจริง
6. ห้ามเริ่ม auto deduction จนมี idempotency และ transaction test ครบ

## หมายเหตุบัญชี Manus ใหม่

บัญชี Manus ใหม่จะไม่ได้มี sandbox, terminal session, secrets หรือ conversation context ของบัญชีเดิมโดยอัตโนมัติ ต้อง:

1. ให้บัญชีใหม่เข้าถึง GitHub repository นี้
2. clone repository ใหม่
3. ตั้งค่า connector/secrets ที่จำเป็นใหม่ตามสิทธิ์ของบัญชีใหม่
4. เปิด task ใหม่แล้วแนบไฟล์ handoff นี้หรือวางข้อความในส่วน “วิธีใช้”
5. ห้ามถือว่าไฟล์ใน sandbox เดิมยังอยู่

GitHub เป็นตัวต่อหลักของ source code ส่วนเอกสาร handoff นี้เป็นตัวต่อบริบทและข้อห้ามสำคัญ
