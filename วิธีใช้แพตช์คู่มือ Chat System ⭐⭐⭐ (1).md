# วิธีใช้แพตช์คู่มือ Chat System ⭐⭐⭐

แพตช์นี้เพิ่มหน้ารายละเอียดสายแชทใต้ System Manual, ทำการ์ด `chat_customer_messages` และ `chat_page_messages` ให้คลิกไปยังรายละเอียดของแต่ละตารางได้, เพิ่มเส้นทาง `close-job-history` ในภาพรวม และแสดงข้อมูล `SIRIUS_xXx_CRASH` กับ `VAGABOND_xXx_DISMISS` ตาม SQL/flow ที่ตรวจจาก repository

## ก่อนเริ่ม

ให้เปิด PowerShell ที่โฟลเดอร์รากของ repo `BB_STORE_ORDERS` และเช็กว่าไม่มีงานค้างที่ยังไม่ได้บันทึก:

```powershell
git status --short
git rev-parse HEAD
```

ฐานของแพตช์คือ commit `d10409ad59bd50abcc2d67de99751824015b0606` ถ้า `git status --short` แสดงไฟล์ที่แก้อยู่ ให้หยุดก่อนและสำรองหรือ commit งานของคุณก่อน หาก HEAD ไม่ตรงฐานนี้ ให้หยุดก่อน อย่าฝืนใช้แพตช์ เพราะ repo อาจมี commit ใหม่กว่า

คัดลอกไฟล์ `BB_STORE_ORDERS-chat-system-manual-stars.patch` ไว้ที่โฟลเดอร์รากของ repo แล้วใช้:

```powershell
git am ".\BB_STORE_ORDERS-chat-system-manual-stars.patch"
```

ใช้ `git am` ไม่ใช่ `git apply` เพราะ patch นี้เป็น commit patch และ `git am` จะเก็บชื่อ commit `⭐⭐⭐` ไว้ให้

## ตรวจหลังใช้

```powershell
git log -1 --oneline
git status --short
```

บรรทัดบนสุดควรแสดง commit `⭐⭐⭐` และ `git status --short` ควรว่าง แพตช์นี้ผ่านการทดสอบ `git am` บน worktree สะอาดที่ฐาน `d10409ad59bd50abcc2d67de99751824015b0606` แล้ว

ถ้า `git am` แจ้ง conflict ให้ยกเลิกชุดที่กำลัง apply ด้วย:

```powershell
git am --abort
```

อย่ารันซ้ำหรือแก้ SQL เพื่อให้แพตช์ผ่านเองโดยยังไม่ตรวจฐาน commit

## หมายเหตุที่พบใน SQL สายแชท

ผมไม่ได้แก้ไฟล์ SQL ในแพตช์นี้ และไม่ได้ใส่รายการคอลัมน์ของสอง message tables เพราะไฟล์ใน repo ที่ฐาน `d10409` ยังไม่ตรงกัน: `SQL/💬3.สายแชท/chat_customer_messages.sql` มีคำสั่ง `CREATE TABLE public.chat_page_messages` ส่วน `SQL/💬3.สายแชท/chat_page_messages.sql` ว่าง 0 ไบต์ จึงยังไม่มี DDL ที่ยืนยัน schema ของ `chat_customer_messages` อย่างถูกต้อง

SQL ปัจจุบันระบุว่า `🏴‍☠️SIRIUS_xXx_CRASH` เป็น table สำหรับข้อมูลประกอบเคส ส่วน `🌓VAGABOND_xXx_DISMISS` เป็น view ที่รวมข้อมูลจากสอง message tables และคัดเคสจากข้อความ “ปิดงาน”, “ยกเลิก”, “ไม่เอาแล้ว” และรูปแบบ “สั่ง…แล้วไม่รับ” ตัว SQL ของ view ไม่ได้ตรวจคำเกี่ยวกับการขโมยโดยตรง คู่มือจึงแยกคำอธิบายตามการจัดกลุ่มงานที่คุณให้ ออกจากเงื่อนไขจริงใน SQL

ไฟล์นี้สร้าง local commit ใน sandbox เท่านั้น ยังไม่ได้ push ขึ้น GitHub
