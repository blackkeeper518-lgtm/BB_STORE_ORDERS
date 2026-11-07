# BB_STORE_ORDERS · แพตช์ ⭐⭐⭐V2 และ ⭐⭐⭐V3

แพตช์ชุดนี้ต่อจาก `66fbf11` (`⭐⭐⭐V1`) ใน `main` ของ `BB_STORE_ORDERS` และรวมสอง commit ไว้ในไฟล์เดียว เพื่อให้ `git am` สร้างประวัติตามลำดับเดิม

## มีอะไรเปลี่ยน

- **⭐⭐⭐V2 — Order Control:** ย้ายตัวกรองวันที่/เพจ รวมถึงปุ่มอัปเดต เอ็กซ์พอร์ต และล้าง ไปไว้ในลิ้นชักด้านขวา ช่องค้นหาเบอร์และช่องค้นหาเดิมยังอยู่บนหน้า ส่วนผลค้นหาพัสดุ/แชทยังใช้แผงเดิม
- **⭐⭐⭐V3 — System Manual:** ปรับผังเป็น 3 โปรเจกต์และ 5 workflow lanes ระบุ `chat_link_key` เป็นคีย์กลาง และระบุชัดว่า API-only / ไม่มี webhooks พร้อมเอารายละเอียด pipeline ออเดอร์/พัสดุชุดเก่าที่ไม่ตรงกับผังใหม่นี้ออก โดยคงรายละเอียดสายแชทไว้

ไม่มีการแก้ API token, ฐานข้อมูล หรือ logic การโหลดแชท และยังไม่ได้ push ไป GitHub

## วิธีใช้ใน PowerShell / VS Code Terminal

1. ดาวน์โหลด `BB_STORE_ORDERS-stars-V2-V3.patch` แล้ววางไว้ที่โฟลเดอร์รากของ repo `BB_STORE_ORDERS` (โฟลเดอร์เดียวกับ `.git`). ถ้าดาวน์โหลดไว้ที่อื่น ให้ copy เข้า repo ก่อน
2. เปิด PowerShell ที่โฟลเดอร์ repo แล้วตรวจ branch และงานค้าง:

```powershell
git status --short --branch
git log -1 --oneline
```

ควรอยู่บน `main` และ HEAD ควรเป็น `66fbf11` หรือ commit ที่สืบต่อจากมันโดยยังไม่แก้ไฟล์สองส่วนเดียวกัน หากมีการแก้ไฟล์ที่ยังไม่ commit ให้ commit หรือสำรองไว้ก่อน

3. ใช้คำสั่งนี้เพียงคำสั่งเดียวเพื่อรับทั้ง V2 และ V3:

```powershell
git am --3way .\BB_STORE_ORDERS-stars-V2-V3.patch
```

อย่ารัน `git add` หรือ `git commit` เพื่อใส่ไฟล์ `.patch` — `git am` จะสร้าง commits `⭐⭐⭐V2` และ `⭐⭐⭐V3` ให้เอง

4. ตรวจผล:

```powershell
git log -2 --oneline
git status --short
```

ถ้าต้องการให้ Render deploy หลังตรวจหน้าเว็บแล้ว ค่อย push ตามปกติ:

```powershell
git push origin main
```

ถ้า `git am` แจ้ง conflict ให้หยุดก่อน อย่าพิมพ์ข้อความจากหน้าช่วยเหลือซ้ำ หากต้องยกเลิกชุดที่ค้าง ใช้ `git am --abort` แล้วส่งข้อความ error เต็ม ๆ มาให้ตรวจ
