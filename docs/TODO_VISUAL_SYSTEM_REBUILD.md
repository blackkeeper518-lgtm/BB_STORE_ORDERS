# TODO · Central Visual System Rebuild

> เป้าหมาย: แทนที่ Visual/Appearance layer เดิมด้วย Central Visual System ชุดเดียวทั้งเว็บ โดยไม่แตะ business logic, source-of-truth, database workflow หรือ Mobile Inbox ที่ใช้งานดีอยู่แล้ว
>
> สถานะเริ่มต้น: **PLAN ONLY — ยังไม่เริ่มรื้อโค้ด**

## หลักการล็อกตายตัว

- [ ] Business logic เดิมต้องคงเดิม: order, chat, stock, bill, tracking, parcel และ workflow ที่เกี่ยวข้อง
- [ ] ไม่แตะ Mobile Inbox / แอปมือถือรวมแชท ทั้ง logic และ visual โดยพลการ
- [ ] ไม่เปลี่ยน source-of-truth หรือย้าย business tables
- [ ] Appearance data แยกจาก business data อย่างชัดเจน
- [ ] ระบบใหม่ต้องเป็น Draft → Preview → Apply → Reset/Rollback
- [ ] ระบบใหม่ต้องคุมจากค่ากลางจริง ไม่ใช่เพิ่ม CSS override ทับของเก่า
- [ ] ก่อนลบระบบเก่าต้องพิสูจน์ว่าทุกห้องที่อยู่ในขอบเขตย้ายมาใช้ระบบใหม่แล้ว
- [ ] ทุกระยะต้อง build, diff check และตรวจ visual ก่อนเดินต่อ

## ขอบเขตห้อง

### In scope — ต้องใช้ Central Visual System

- [ ] Dashboard shell / sidebar / top utility strip
- [ ] Order Control
- [ ] Warp Drive
- [ ] Secret Gallery
- [ ] Order History / Sent Archive
- [ ] Telegram / delivery rooms
- [ ] Stock / product rooms
- [ ] Alert / Blackbox / operational rooms
- [ ] ห้องอื่นที่ใช้ Dashboard shell เดียวกัน

### Protected / Exclusion

- [ ] Mobile Inbox และ mobile chat UI: ไม่ให้ CSS กลางทับโดยไม่ได้ตรวจเฉพาะทาง
- [ ] Chat sending / Meta / LINE / message persistence
- [ ] Order calculation / stock deduction / parcel lookup / tracking
- [ ] Supabase business tables และ deterministic workflows

# Phase 0 · Baseline และแผน rollback

- [ ] สร้าง branch สำหรับ Visual System rebuild แยกจาก branch production/current fix
- [ ] สร้าง baseline commit ก่อนรื้อ
- [ ] บันทึกรายชื่อ route และห้องทั้งหมด
- [ ] บันทึก screenshot baseline ของ Desktop และ Mobile ที่สำคัญ
- [ ] บันทึก CSS/runtime entry points ที่มีอยู่ในปัจจุบัน
- [ ] ยืนยันว่า rollback กลับ baseline ได้ด้วย Git โดยไม่ต้องเก็บระบบเก่าสองชุดใน runtime
- [ ] ตั้ง acceptance checklist สำหรับแต่ละห้อง

**จุดหยุดตรวจ:** ถ้า baseline, route list หรือ rollback ยังไม่ชัด ห้ามเริ่ม Phase 1

# Phase 1 · กำหนด Central Visual Contract

- [ ] กำหนด `Dark Base System` เป็นฐานกลาง
- [ ] กำหนด Canvas / global background
- [ ] กำหนด gutter / ช่องว่างระหว่าง panel เป็นดำหรือ background กลาง
- [ ] กำหนด room surface
- [ ] กำหนด card surface แบบ dark translucent
- [ ] กำหนด panel shell
- [ ] กำหนด border / accent / glow
- [ ] กำหนด typography hierarchy
- [ ] กำหนด spacing scale
- [ ] กำหนด radius scale
- [ ] กำหนด shadow / blur / opacity
- [ ] กำหนด button / input / badge / table / state styles
- [ ] กำหนด hover / focus / selected / disabled states
- [ ] กำหนด motion และ reduced-motion behavior

## Token กลางขั้นต่ำ

```text
--app-canvas
--app-background
--app-gutter
--room-surface
--room-surface-muted
--card-surface
--card-surface-raised
--card-border
--card-border-strong
--card-accent
--card-shadow
--card-radius
--card-opacity
--card-blur
--text-primary
--text-secondary
--text-muted
--state-success
--state-warning
--state-danger
--state-info
--control-surface
--control-border
--control-focus
```

**จุดหยุดตรวจ:** Token ต้องแยกหน้าที่ชัดเจนระหว่าง base, accent, background, card material และ state color

# Phase 2 · แยกความรับผิดชอบของ Visual System

- [ ] `Style` = โครงสร้าง Visual System ทั้งชุด
- [ ] `Theme/Accent` = สี identity และ accent เท่านั้น
- [ ] `Background` = พื้นหลัง/บรรยากาศชั้นหลังสุด
- [ ] `Card Style` = วัสดุของ card shell เช่น opacity, blur, radius, shadow, density
- [ ] `Frame` = ขอบ/กรอบ ไม่เปลี่ยนข้อมูลและ layout
- [ ] `Motion` = การเคลื่อนไหวของ background/visual layer
- [ ] ทุกค่าต้องถูกแปลงเป็น token กลางชุดเดียว
- [ ] Preview ต้องใช้ renderer/card shell เดียวกับของจริง

# Phase 3 · สร้าง Runtime กลางชุดใหม่

- [ ] สร้าง central visual profile contract
- [ ] สร้าง default Dark Base System
- [ ] สร้าง accent profiles ชุดแรก: Crimson, Amber, Moss, Violet, Cyan
- [ ] สร้าง background profiles ที่ไม่ทับ card/content
- [ ] สร้าง card material profiles: Balanced, Glass, Dense Ops, Solid
- [ ] สร้าง frame profiles
- [ ] รองรับ fallback: Room → Global → Default
- [ ] รองรับ Draft local state
- [ ] รองรับ Applied persistence เฉพาะ appearance table
- [ ] รองรับ Preview / Apply / Reset / Restore / Rollback
- [ ] เพิ่มสถานะ error แยก Read / Upsert / Delete ให้ตรวจสอบได้
- [ ] ไม่สร้าง API หรือ write path ไปยัง business tables

# Phase 4 · สร้าง Central Shell และ Components

- [ ] สร้าง Global Canvas wrapper
- [ ] สร้าง Room wrapper
- [ ] สร้าง Card Shell กลาง
- [ ] สร้าง Panel Shell กลาง
- [ ] สร้าง Section Header กลาง
- [ ] สร้าง Button / Input / Select / Badge กลาง
- [ ] สร้าง Data Table / List / Detail surface กลาง
- [ ] รองรับ `data-visual-surface` หรือ class contract ที่ชัดเจน
- [ ] หลีกเลี่ยง selector กว้างที่ทับ Mobile Inbox
- [ ] หลีกเลี่ยง `!important` bridge ใหม่ถ้าไม่จำเป็น

# Phase 5 · ย้าย Global Shell ก่อน

- [ ] Dashboard background ใช้ token กลาง
- [ ] Sidebar ใช้ token กลาง
- [ ] Top utility strip ใช้ token กลาง
- [ ] Page wrapper ใช้ gutter และ spacing กลาง
- [ ] Header / nav / active state ใช้ accent กลาง
- [ ] ตรวจว่าเปลี่ยน Accent แล้ว shell ทั้งระบบเปลี่ยนตรงกัน
- [ ] ตรวจว่า Background ไม่ถูก card หรือ shell ทึบทับจนหาย

**จุดหยุดตรวจ:** ถ้า shell ยังมีสี hard-coded ที่ขัดกับ token ห้ามย้ายห้องถัดไป

# Phase 6 · ย้ายห้องทีละห้อง

ทำตามลำดับนี้ และจบ checklist ของห้องหนึ่งก่อนเริ่มห้องถัดไป:

1. [ ] Order Control
2. [ ] Warp Drive
3. [ ] Secret Gallery
4. [ ] Order History / Sent Archive
5. [ ] Telegram / delivery
6. [ ] Stock / product
7. [ ] Alert / Blackbox
8. [ ] ห้อง operational อื่น ๆ

สำหรับแต่ละห้อง:

- [ ] ระบุ root wrapper ของห้อง
- [ ] ระบุ card/panel/list/detail ที่ต้องย้าย
- [ ] เปลี่ยน visual wrapper โดยไม่เปลี่ยน query หรือ action
- [ ] ลบสีพื้น hard-coded ที่ขัดกับ contract เฉพาะจุด
- [ ] ย้าย border/shadow/radius/spacing เข้า token
- [ ] ตรวจ empty/loading/error/selected/hover states
- [ ] ตรวจข้อมูลจำนวนมากและการ scroll
- [ ] ตรวจ Desktop
- [ ] ตรวจ Mobile/responsive โดยไม่ทับ Mobile Inbox
- [ ] ทดสอบ Apply / Reset / Restore ของ room
- [ ] ถ่าย screenshot หลังย้าย

# Phase 7 · Secret Gallery เป็นห้องตรวจจริง

- [ ] ใช้ Card Shell กลางเดียวกับ operational rooms
- [ ] เปลี่ยน Preview ให้เป็นการ์ดจริง ไม่ใช่ mock ที่คนละระบบ
- [ ] Theme เปลี่ยน accent ไม่ย้อมพื้นทั้งใบ
- [ ] Background ยังมองเห็นผ่าน card material
- [ ] Card Style เปลี่ยนวัสดุจริง
- [ ] Frame เปลี่ยนเฉพาะขอบจริง
- [ ] ทุกการ์ดในหน้าใช้ contract กลาง
- [ ] มี Current Room, Apply Room, Apply Global, Restore Room, Restore Global, Restore All
- [ ] Copy Style คัดลอกเป็น Draft และปลายทาง Apply เอง
- [ ] ตรวจว่า Applied กับ Draft แสดงตรงกัน

# Phase 8 · ตรวจและลบระบบเก่า

ห้ามลบก่อนผ่านรายการนี้:

- [ ] ทุกห้องใน scope ใช้ central tokens/components แล้ว
- [ ] ไม่มีห้องใดพึ่ง legacy runtime เพื่อทำงานปกติ
- [ ] ไม่มี CSS bridge เก่าที่ทำหน้าที่ซ้ำกับระบบใหม่
- [ ] ไม่มี selector เก่าที่เปลี่ยนพื้น card เป็น gradient Theme โดยไม่ตั้งใจ
- [ ] ไม่มี room-specific background ที่ขัดกับ global contract
- [ ] ไม่มี hard-coded card surface ที่ทำให้ style เปลี่ยนไม่ครบ
- [ ] ไม่มี duplicate token names ที่ความหมายซ้ำกัน
- [ ] Mobile Inbox ผ่าน exclusion test
- [ ] ทุก appearance action ผ่าน appearance table เท่านั้น

จากนั้นจึง:

- [ ] ลบ legacy theme bridge
- [ ] ลบ legacy card bridge
- [ ] ลบ legacy room overrides ที่หมดหน้าที่
- [ ] ลบ token เก่าที่ไม่มี consumer
- [ ] ลบ mapping/adapter เก่าที่ไม่มี caller
- [ ] รัน `rg` ตรวจชื่อ legacy ที่เหลือ
- [ ] รัน build และ visual smoke test ใหม่ทั้งระบบ

# Phase 9 · Acceptance Test ก่อนถือว่าเสร็จ

- [ ] เปลี่ยน Accent จาก Crimson → Amber แล้วทุกห้องเปลี่ยนตาม
- [ ] เปลี่ยน Accent จาก Amber → Moss แล้วพื้นฐานยังเป็นระบบเดิม
- [ ] เปลี่ยน Background แล้วช่องว่างทั้งระบบเปลี่ยนตาม
- [ ] Card ไม่ย้อมพื้นจนกลบ Background
- [ ] เปลี่ยน Card Style แล้ว card จริงทุกห้องเปลี่ยน
- [ ] Frame เปลี่ยนเฉพาะขอบ
- [ ] Preview กับของจริงตรงกันหลัง Apply
- [ ] Draft ยังไม่เปลี่ยนระบบจริง
- [ ] Reset Room คืนค่า fallback ได้
- [ ] Restore Global คืนค่า baseline ได้
- [ ] Restore All ไม่แตะ business data
- [ ] Order/chat/stock/tracking ทำงานเหมือนเดิม
- [ ] Mobile Inbox ไม่ถูก visual layer ใหม่ทับ
- [ ] ไม่มี console error สำคัญ
- [ ] `git diff --check` ผ่าน
- [ ] production build ผ่าน
- [ ] workspace ไม่มี `dist/` หรือ `node_modules/` artifact ที่ไม่ได้ตั้งใจ commit

# Definition of Done

ระบบถือว่าเสร็จเมื่อ:

```text
Business Logic เดิม
+
Central Visual System ใหม่เพียงชุดเดียว
+
ทุกห้องใช้ค่ากลางจริง
+
Preview = ของจริงหลัง Apply
+
Reset/Rollback ทำงาน
+
Mobile Inbox และ business workflow ไม่เปลี่ยน
+
Legacy Visual System ถูกลบออกจาก runtime และ source ที่หมดหน้าที่
```

## บันทึกการตัดสินใจ

- Reference visual หลัก: Dark Base + Accent Theme แบบภาพ Command Deck
- Reference card หลัก: การ์ดโปร่ง/มืดที่ไม่ทับพื้นหลังแบบ Room 04 และ Mobile
- ช่องว่างกลางระบบ: สีดำสนิทหรือ Background Space กลาง
- Style ต้องคุมทั้งระบบ ไม่ใช่เปลี่ยนเฉพาะสี
- การปรับความสวยละเอียดจะทำหลัง central control ทำงานครบ
