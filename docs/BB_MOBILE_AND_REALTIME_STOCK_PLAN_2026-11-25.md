# BB STORE ORDERS
## สรุปเว็บมือถือและแผนสต๊อกเรียลไทม์

**วันที่:** 25 พฤศจิกายน 2026  
**สถานะเอกสาร:** Working Plan / ใช้เป็นเอกสารกลางสำหรับพัฒนาต่อ

---

## 1. บทสรุปผู้บริหาร

เว็บ BB ถูกปรับโดยใช้ ST เป็นแม่แบบหลักแล้ว rebrand เป็น BB ทั้ง repository โดยรักษา logic แชทและการส่งภาพที่ใช้งานได้เดิมไว้ จุดสำคัญของงานรอบนี้คือทำให้เว็บมือถือเป็นเครื่องมือทำงานจริงของแอดมิน ไม่ใช่เพียงหน้าเว็บย่อส่วน และแยกความรับผิดชอบระหว่างเว็บ, Order, Signal และระบบสต๊อกให้ชัดเจน

หลักการที่ต้องรักษาต่อไปมี 4 ข้อ:

1. **n8n/Order เป็นผู้ตัดสินสถานะออเดอร์** เว็บไม่คำนวณสถานะซ้ำ
2. **Product Master เป็นศูนย์กลางสินค้าและสถานะสต๊อก** ทุกจุดในเว็บอ่านสถานะจากแหล่งเดียวกัน
3. **สินค้าตัดจริงต้องอ้างอิงรายการในประวัติส่งที่ยืนยัน SENT แล้ว** ไม่อ่านจากข้อความแชทหรือหัวบิล
4. **ยังไม่เปิดการตัดสต๊อกอัตโนมัติ** จนกว่าจะล็อก trigger, idempotency key, จำนวนต่อ SKU และแหล่ง inventory ได้ครบ

---

## 2. สิ่งที่ทำเสร็จแล้วบนเว็บมือถือ

### 2.1 โครงสร้าง Mobile Inbox และ PWA

- เพิ่มเส้นทางเข้าใช้งานมือถือโดยตรงที่ `/mobile-inbox`
- ปรับ viewport, safe-area และขอบเขตหน้าจอให้เหมาะกับมือถือ ไม่ยืดเต็มจอเกินจำเป็น
- ปรับ layout ให้ทำงานในหน้าจอแนวตั้งและหน้าจอแบ่งครึ่ง
- คงธีม Dark / Neon Glassmorphism และระบบ theme color เดิมของแอป
- เพิ่ม favicon, PWA manifest, neon logo และ service-worker cache ให้เป็นแบรนด์ BB
- มี flow ติดตั้งแอปและแจ้งอัปเดต โดยไม่วางปุ่มรบกวนการทำงานค้างไว้ตลอดเวลา
- มี direct route สำหรับแอดมินที่ต้องการเข้าห้องแชททันที โดยไม่บังคับให้ผ่านหน้าสรุปรายวัน

### 2.2 ระบบแชทและการส่งภาพ

- รักษา sender/router แบบเดิมที่ผ่านการใช้งานจริง
- ส่งภาพแบบ **ทีละภาพด้วย single attachment** ตามลำดับเดิม ไม่เปลี่ยนเป็น `message.attachments[]`
- รองรับการส่งภาพพร้อมกันได้สูงสุด 4 ภาพต่อข้อความ
- ใช้ sequential loop เพื่อหลีกเลี่ยง Meta error จากการยิงหลาย attachment พร้อมกัน
- หลังส่งภาพแล้วเคลียร์สถานะในเว็บได้ถูกต้อง และไม่ทำให้ภาพที่เหลือหายจากคิว
- รองรับการดึงภาพจากเซิร์ฟเวอร์ที่ตั้งค่าไว้แล้ว ไม่ต้องอัปโหลดภาพใหม่ทุกครั้ง
- เพิ่มปุ่มเปิดห้องแชทจริงใน Meta Business Suite เพื่อให้แอดมินตรวจสอบต่อได้ทันที

### 2.3 Product Highlight และ Product Dock

- Product Highlight sync ผ่าน server แล้ว ทุกเครื่องเห็นชุดข้อมูลกลางเดียวกัน
- สินค้าที่ถูกเลือกจะแสดงอยู่บนสุดตามลำดับการเลือก
- มีสถานะไฟ/ไฮไลต์ให้รู้ว่าสินค้าใดถูกเลือกอยู่
- Product Dock เรียงตามลำดับจาก server
- หลังส่งภาพแล้ว Product Dock ไม่หาย
- สินค้าที่หมดสต๊อกจะไม่ถูกแสดงหรือเลือกเพื่อดึงภาพ
- สถานะของโต๊ะสินค้าและโต๊ะภาพเชื่อมกันผ่าน Product Master

### 2.4 Product Master และการอ่านสินค้า

- เชื่อม Product Master กับ Product Index, โต๊ะภาพ, Product Dock และ request ภาพ
- รองรับการอ่านข้อมูลสินค้าจาก GENESIS ทั้ง JSON string และ array
- รองรับหลายสินค้าในออเดอร์เดียว
- รองรับ mapped master SKU และ fallback ตามลำดับ:
  - `final_display_for_packer`
  - `final_product`
  - `telegram_product_display`
- แสดงชื่อสินค้าและจำนวนจริงในหน้า history ไม่อ่านจากข้อความแชทอย่างเดียว
- รองรับสถานะสินค้าและจำนวนจริงจากระบบกลาง โดยไม่ให้ Mobile Stock ไปคำนวณหัวบิลหรือ trigger ของ n8n

### 2.5 Mobile Stock และ Desktop Stock Room

- เพิ่ม Mobile Stock สำหรับดูสถานะสินค้าและจำนวนจริง
- เพิ่ม Desktop Stock Room สำหรับตรวจสอบรายละเอียดในจอใหญ่
- แยกสถานะผู้ดูแล เช่น มี/หมด ออกจากจำนวนคงเหลือจริง
- แสดงสถานะและจำนวนโดยไม่ใส่ logic trigger หรือหัวบิลลงในมือถือ
- ยังไม่มีการตัดสต๊อกอัตโนมัติจากการกดปุ่ม มี/หมด

### 2.6 History และสินค้าที่ตัดจริง

- `TelegramSentHistory` และ `OrderHistory` อ่านข้อมูลจาก GENESIS ที่ยืนยัน SENT แล้ว
- แสดงสินค้า/จำนวนจริงจากคอลัมน์ประวัติส่ง
- รองรับกรณีเปลี่ยนสินค้าและแสดงข้อมูลสินค้าที่เปลี่ยน
- ไม่ใช้ข้อความแชทเป็นหลักในการสรุปสินค้าที่ตัดจริง

### 2.7 การตรวจสอบคุณภาพที่ทำแล้ว

- focused frontend/server tests ผ่าน
- production build ผ่าน
- regression test สำหรับ incomplete risk order ผ่าน
- exported n8n JSON ที่เกี่ยวข้อง parse ได้
- แก้ merge conflict markers ใน exported workflows ที่เกี่ยวข้อง
- `dist/` และ `node_modules/` ไม่ถูก commit

---

## 3. สิ่งที่ยังไม่เปิดใช้และต้องระวัง

### 3.1 ยังไม่ตัดสต๊อกอัตโนมัติ

ตอนนี้ระบบยังไม่ควรหักจำนวนสินค้าเพียงเพราะ:

- เปิดแชท
- เลือกสินค้าใน Product Dock
- ส่งภาพสินค้า
- สร้างหัวบิล
- เปลี่ยนสถานะผู้ดูแลเป็น “มี/หมด”
- เห็นออเดอร์ผ่านหน้าเว็บ

เหตุผลคือเหตุการณ์เหล่านี้ยังไม่ใช่หลักฐานเดียวกันว่า “สินค้าถูกแพ็กและส่งสำเร็จแล้ว”

### 3.2 ต้องไม่ใช้ข้อมูลคนละแหล่งปนกัน

- Product Master: ใช้ระบุ SKU, ชื่อ, alias, ราคา และสถานะสินค้า
- GENESIS/SENT History: ใช้เป็นหลักฐานการตัดจริง
- n8n Project 1 Order: ใช้คำนวณออเดอร์และ packer object
- n8n Project 4 Signal: ใช้ดึงผลและจัด route/alert
- Project 2 Risk: ใช้สร้าง risk alert เฉพาะข้อมูลที่ผ่าน gate แล้ว
- เว็บมือถือ: ใช้แสดงผลและทำงานของแอดมิน ไม่สร้างสถานะธุรกิจซ้ำ

---

## 4. แผนสต๊อกเรียลไทม์ที่แนะนำ

### Phase 0 — ล็อกสัญญาข้อมูลก่อนเปิดจริง

กำหนดข้อมูลกลางของแต่ละ SKU ให้ชัดเจน:

| ฟิลด์ | ความหมาย |
|---|---|
| `master_sku` | รหัสสินค้าเดียวที่ใช้ทั้งระบบ |
| `stock_qty` | จำนวนคงเหลือจริง |
| `stock_status` | `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK` |
| `reserved_qty` | จำนวนที่ถูกจอง ถ้าระบบจะรองรับการจอง |
| `available_qty` | จำนวนที่เลือก/จองได้จริง |
| `updated_at` | เวลาที่แก้ไขล่าสุด |
| `updated_by` | ผู้หรือระบบที่แก้ไข |
| `version` | เลขเวอร์ชันสำหรับกันการเขียนทับข้อมูลใหม่ด้วยข้อมูลเก่า |

ช่วงนี้ยังไม่หักสต๊อก แค่ทำให้ทุกหน้าจออ่าน schema เดียวกัน

### Phase 1 — ทำให้การแสดงผลเรียลไทม์ก่อน

ใช้ Supabase Realtime subscribe ที่ตาราง Product Master หรือ inventory projection:

```text
Product Master update
        ↓
Supabase Realtime event
        ↓
Web ทุกเครื่องรับ event
        ↓
อัปเดต Product Dock / Mobile Stock / Desktop Stock Room
        ↓
ซ่อนหรือปิดการเลือกสินค้าที่ OUT_OF_STOCK
```

กติกาใน Phase 1:

- ใช้ server state เป็นหลัก ไม่เชื่อ local state เมื่อมี event ใหม่
- ถ้า event มาถึงช้า ให้แสดง `ข้อมูลกำลัง sync` ไม่เดาสถานะเอง
- ถ้าเปิดหน้าค้างไว้นาน ให้ refetch เพื่อยืนยันข้อมูลอีกครั้ง
- การกดมี/หมดเปลี่ยนได้เฉพาะสถานะผู้ดูแล ไม่แก้ `stock_qty` จริง
- ทุกการเปลี่ยนต้องมี `updated_at` และ `updated_by`

### Phase 2 — เพิ่ม stock movement ledger

ก่อนหักจำนวนจริง ควรมีตารางประวัติการเคลื่อนไหวแยกจากตารางสินค้าหลัก:

| ฟิลด์ | ความหมาย |
|---|---|
| `movement_id` | ID เหตุการณ์ไม่ซ้ำ |
| `idempotency_key` | ป้องกัน event เดิมตัดซ้ำ |
| `master_sku` | SKU ที่เคลื่อนไหว |
| `movement_type` | `IN`, `OUT`, `ADJUST`, `RESERVE`, `RELEASE` |
| `quantity` | จำนวนที่เปลี่ยน ต้องมากกว่า 0 |
| `source_type` | เช่น `SENT_HISTORY`, `MANUAL_ADJUST` |
| `source_id` | ID ต้นทาง เช่น SENT row ID |
| `order_id` | เลขออเดอร์ที่เกี่ยวข้อง |
| `created_at` | เวลาสร้างเหตุการณ์ |
| `created_by` | ผู้หรือระบบที่สร้าง |

หลักสำคัญคือ `stock_qty` ไม่ควรถูกแก้แบบลอย ๆ โดยไม่มี movement record รองรับ

### Phase 3 — เปิดการตัดจริงจาก SENT History เท่านั้น

Trigger ที่แนะนำ:

```text
GENESIS / Sent History ยืนยัน SENT
        ↓
สร้าง stock movement OUT ต่อ master_sku
        ↓
ตรวจ idempotency_key
        ↓
ทำ transaction หัก stock_qty
        ↓
เขียน movement สำเร็จ
        ↓
Supabase Realtime broadcast
        ↓
Mobile Stock / Product Dock / Desktop Stock Room อัปเดต
```

**ห้ามใช้** การส่งภาพ, การเลือกสินค้า หรือการสร้างบิลเป็น trigger ตัดจริง

### Phase 4 — กันการตัดซ้ำและแก้ข้อมูลชนกัน

กำหนด idempotency key ที่ stable เช่น:

```text
SENT:{sent_history_id}:{master_sku}:{line_no}
```

หากมีการเปลี่ยนสินค้า ต้องใช้ line item และ SKU ใหม่อย่างชัดเจน เช่น:

```text
SENT:{sent_history_id}:{replacement_master_sku}:{replacement_line_no}
```

ระบบต้อง reject หรือ no-op เมื่อได้รับ key เดิมซ้ำ และต้องไม่ใช้เลขออเดอร์อย่างเดียว เพราะหนึ่งออเดอร์อาจมีหลาย SKU หรือมีการเปลี่ยนสินค้า

---

## 5. กติกาสถานะสต๊อกที่ควรใช้

| สถานะ | เงื่อนไขตัวอย่าง | การทำงานของเว็บ |
|---|---|---|
| `IN_STOCK` | `available_qty > low_stock_threshold` | แสดงและเลือกได้ |
| `LOW_STOCK` | มากกว่า 0 แต่ต่ำกว่า threshold | แสดงป้ายเตือนและเลือกได้ |
| `OUT_OF_STOCK` | `available_qty <= 0` | ไม่แสดงภาพ/ไม่ให้เลือก |
| `SYNCING` | กำลังรอ event หรือ refetch | ระงับการตัดสินชั่วคราว |
| `CONFLICT` | version หรือยอดไม่ตรงกัน | ห้ามแก้ทับอัตโนมัติ ให้ตรวจสอบ |
| `MANUAL_HOLD` | ผู้ดูแลระงับการขาย | ไม่แสดง/ไม่ให้เลือก แม้มีจำนวน |

`มี/หมด` เป็นสถานะช่วยงานผู้ดูแล ไม่ควรนำไปแทน `stock_qty` จริง

---

## 6. การออกแบบความปลอดภัยและความถูกต้อง

### 6.1 Transaction และ concurrency

การหักสต๊อกต้องทำใน database transaction หรือ RPC เดียวที่ตรวจเงื่อนไขพร้อมกัน:

```text
ตรวจ available_qty >= quantity
→ ตรวจ idempotency_key ยังไม่เคยใช้
→ insert movement
→ update product stock
→ commit
```

ถ้าไม่ผ่านขั้นใดขั้นหนึ่ง ให้ rollback ทั้งชุด

### 6.2 RLS และสิทธิ์

- เว็บมือถือไม่ควรแก้ `stock_qty` โดยตรง
- แอดมินแก้ได้เฉพาะ adjustment ที่มีเหตุผลและ audit log
- service role หรือ server function เป็นผู้สร้าง OUT movement จาก SENT
- ผู้ดูแลทั่วไปอ่าน stock ได้ แต่ไม่ควรเขียนยอดตรง

### 6.3 การกู้คืนและตรวจสอบ

ต้องมี:

- movement ledger ที่ย้อนดูได้
- audit log สำหรับ manual adjustment
- รายงานยอด Product Master เทียบกับผลรวม movement
- แจ้งเตือนเมื่อยอดติดลบ, event ซ้ำ, SKU ไม่พบ หรือ quantity ไม่ถูกต้อง
- ปุ่ม refetch/reconcile สำหรับกรณีเครื่องใดเครื่องหนึ่งค้าง

---

## 7. แผน rollout แบบปลอดภัย

### ระยะ A — Read-only realtime

- เปิด Supabase Realtime
- ทุกหน้าจอเห็นจำนวนและสถานะเดียวกัน
- ยังไม่ตัดยอดจริง
- เก็บ metrics event delay และ stale client

### ระยะ B — Shadow movement

- เมื่อ SENT เกิด ให้สร้าง movement แบบ shadow หรือ audit-only
- ยังไม่แก้ `stock_qty`
- เทียบยอดที่ระบบคำนวณกับยอดจริงของแอดมิน
- ทดสอบการส่ง event ซ้ำและเปลี่ยนสินค้า

### ระยะ C — ตัดจริงเฉพาะ SKU ที่ผ่านการตรวจ

- เปิดทีละกลุ่มสินค้า หรือทีละ workflow
- ใช้ idempotency key บังคับ
- มีปุ่ม rollback/reconcile
- ตรวจยอดทุกวันก่อนขยาย scope

### ระยะ D — เปิดใช้งานเต็มระบบ

เปิดเมื่อผ่านเกณฑ์ทั้งหมด:

- ไม่มี duplicate movement จากการทดสอบซ้ำ
- ไม่มี SKU mapping หลุด
- ไม่มี stock ติดลบจาก transaction
- SENT History มีสินค้าและจำนวนครบทุกบรรทัด
- เปลี่ยนสินค้าแล้วตัดเฉพาะ SKU สุดท้ายที่ยืนยัน
- Mobile Stock และ Desktop Stock แสดงยอดตรงกัน

---

## 8. Checklist ก่อนอนุมัติการตัดสต๊อกจริง

- [ ] ระบุ trigger เดียว: `SENT History confirmed`
- [ ] ระบุ source ของสินค้าและจำนวนต่อ SKU
- [ ] มี `idempotency_key` ที่ unique และทดสอบซ้ำแล้ว
- [ ] มี transaction/RPC ที่กันยอดติดลบ
- [ ] มี movement ledger และ audit log
- [ ] มีระบบจัดการ replacement item
- [ ] มี Supabase Realtime และ refetch fallback
- [ ] มี RLS แยก read/write
- [ ] มี reconciliation report
- [ ] มี rollback/manual adjustment ที่ตรวจสอบได้
- [ ] แอดมินยืนยันผล shadow run แล้ว

---

## 9. ข้อสรุปการตัดสินใจ

เว็บมือถือ BB พร้อมใช้เป็นศูนย์ปฏิบัติงานสำหรับ Inbox, การส่งภาพ, Product Dock, Product Highlight, Product Master และการตรวจสต๊อกแบบดูสถานะได้แล้ว

สิ่งที่ควรทำต่อทันทีคือ **เปิด realtime แบบ read-only ก่อน** เพื่อให้ทุกเครื่องเห็นสถานะเดียวกัน จากนั้นทำ shadow movement จาก SENT History แล้วค่อยเปิดการตัดจริงเมื่อ idempotency, quantity ต่อ SKU, replacement และ transaction ผ่านการทดสอบครบ

ยังไม่ควรให้ปุ่มบนมือถือหรือการส่งภาพเป็นตัวหักสต๊อก เพราะจะทำให้เกิดการตัดซ้ำและยอดไม่ตรงกับสินค้าที่ส่งจริง

> **หลักสุดท้าย:** แสดงผลได้แบบเรียลไทม์ก่อน แต่ตัดสต๊อกจริงต้องเกิดจากหลักฐาน SENT ที่ยืนยันแล้วเท่านั้น
