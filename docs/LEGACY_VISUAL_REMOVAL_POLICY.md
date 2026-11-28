# Legacy Visual Removal Policy

สถานะ: approved direction for rebuild  
วันที่: 2026-11-28

## ปัญหาที่ล็อกไว้

ถ้า Central Visual System ใหม่ทำงานพร้อมกับ `index.css`, legacy neon bridge, room-specific overrides, frame CSS และ hard-coded Tailwind surfaces ของเดิม เราจะเห็น visual ที่ผสมกัน บางห้องจะยังมีภาษาการ์ด/พื้นหลัง/กรอบแบบเก่า ทำให้ไม่สามารถตัดสิน Central Visual System ใหม่จากภาพจริงได้

## กติกา Single Visual Owner

เมื่อห้องใด migrate เข้า Central Visual System แล้ว:

```text
Central Visual System = visual owner เดียวของ room นั้น
Legacy visual selectors ของ room นั้น = ต้องถูกปิดหรือลบ
```

ห้ามคง legacy override ที่ทำหน้าที่ซ้ำเพื่อหวังว่าเป็น fallback เพราะจะทำให้ token กลางถูกทับแบบคาดเดาไม่ได้

## วิธี migrate ที่ปลอดภัย

1. สร้าง replacement component/marker ของห้องนั้นด้วย central token ก่อน
2. ระบุ legacy selectors ที่เป็น owner ของ room นั้นแบบเจาะจง
3. ย้าย visual consumer ของ room ทีละ surface: canvas → room → panel → card → control → state
4. เปิด Central Visual System ให้ room นั้น
5. ปิด legacy selectors ของ room นั้นทันทีใน commit เดียวกัน
6. ตรวจ screenshot, hover/focus/selected/empty/loading/error และ responsive
7. ตรวจ business behavior ว่า query/action/output ไม่เปลี่ยน
8. ถ้าไม่ผ่าน ให้ rollback commit ของ room ทั้งชุด ไม่เปิด legacy + new ค้างพร้อมกัน

## สิ่งที่ห้ามทำ

- ห้ามเพิ่ม CSS override ใหม่เพื่อแก้ CSS override เก่า
- ห้ามใช้ `!important` เป็นวิธีหลักในการบังคับ Central Visual System
- ห้ามเปิด selector กลางกว้าง ๆ เพื่อทับ Mobile Inbox
- ห้ามลบ legacy file ทั้งไฟล์ก่อนรู้ว่า room ใดเป็น consumer
- ห้ามลบ business logic หรือ source-of-truth เพื่อแก้ visual

## ลำดับการถอด legacy

1. Global Canvas / Dashboard shell
2. Order Control
3. Warp Drive / Room 04
4. Secret Gallery
5. Order History / Telegram delivery
6. Stock / product rooms
7. Alert / Blackbox / operational rooms
8. Remaining shell routes
9. ลบไฟล์ legacy ที่ไม่มี consumer เหลืออยู่

## Acceptance gate ของแต่ละ room

ห้องจะถือว่า migrated ต่อเมื่อ:

- [ ] ทุก surface ใช้ central markers/tokens
- [ ] ไม่มี legacy selector ของ room ที่ทำหน้าที่ซ้ำ
- [ ] Theme เปลี่ยนเฉพาะ accent/identity
- [ ] Background เห็นผ่าน canvas/gutter/card material
- [ ] Card material เปลี่ยนจริงทั้ง room
- [ ] Frame เปลี่ยนเฉพาะกรอบ
- [ ] state colors ยังมีความหมายเดิม
- [ ] Preview กับ room จริงใช้ renderer เดียวกัน
- [ ] Mobile Inbox ไม่ได้รับผลกระทบ
- [ ] build/test/diff check ผ่าน
- [ ] screenshot หลัง migrate ถูกเก็บเป็น checkpoint

## Rollback

Rollback ต้องย้อนกลับเป็น commit ก่อน migrate ห้องนั้นทั้งชุด ไม่ควรแก้ด้วยการเติม legacy override กลับเข้าไปแบบชั่วคราว เพราะจะทำให้ owner ของ visual ไม่ชัดเจนอีกครั้ง
