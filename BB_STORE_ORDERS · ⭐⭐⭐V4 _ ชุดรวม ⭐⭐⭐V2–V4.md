# BB_STORE_ORDERS · ⭐⭐⭐V4 / ชุดรวม ⭐⭐⭐V2–V4

V4 เพิ่มแถบ `LOOKUP STATUS` ไว้ใต้ช่องค้นหาและก่อนรายการออเดอร์ แสดงผลแยก 3 แหล่ง: HERMES/ออเดอร์, Chat และ Parcels โดยแยกสถานะรอค้น/กำลังค้น/พบ/ไม่พบ/อ่านต้นทางไม่ได้ออกจากกัน เมื่อพบพัสดุจะแสดงเลขและสถานะส่ง; ถ้าเจอออเดอร์แต่ไม่พบรายการพัสดุที่จับคู่ จะแจ้งให้เห็นแยกต่างหาก ไม่เปลี่ยนเงื่อนไขค้นหา phone, `chat_link_key`, logic แชท หรือฐานข้อมูล

## เลือกใช้แพตช์เพียงแบบเดียว

- **ยังไม่ได้ใช้ V2/V3:** ใช้ `BB_STORE_ORDERS-stars-V2-V4.patch` ซึ่งรวม commit V2, V3 และ V4 ต่อจาก `66fbf11` (`⭐⭐⭐V1`)
- **ใช้ V2/V3 ไปแล้ว:** ใช้เฉพาะ `BB_STORE_ORDERS-stars-V4.patch` ซึ่งเพิ่ม V4 ต่อจากชุดเดิม

ห้ามใช้ทั้งสองไฟล์ เพราะชุดรวมมี V2/V3 อยู่แล้ว

## วิธีใช้ใน PowerShell / VS Code Terminal

1. ดาวน์โหลดไฟล์แพตช์ที่เลือกไว้ที่โฟลเดอร์หลักของ repo `BB_STORE_ORDERS` (โฟลเดอร์เดียวกับ `.git`)
2. เปิด PowerShell ที่โฟลเดอร์ repo แล้วตรวจงานค้าง/branch:

```powershell
git status --short --branch
git log -3 --oneline
```

ถ้ามีการแก้ไฟล์ที่ยังไม่ commit ให้สำรองหรือ commit ก่อน อย่าเริ่ม `git am` ขณะมีการแก้ไขค้าง

3. ถ้ายังไม่ได้ใช้ V2/V3 ให้รัน:

```powershell
git am --3way .\BB_STORE_ORDERS-stars-V2-V4.patch
```

แต่ถ้าใช้ V2/V3 ไปแล้ว ให้รันเฉพาะ:

```powershell
git am --3way .\BB_STORE_ORDERS-stars-V4.patch
```

`git am` จะสร้าง commit ตาม subject `⭐⭐⭐V2`, `⭐⭐⭐V3`, `⭐⭐⭐V4` (หรือเฉพาะ V4) ให้เอง ไม่ต้อง `git add` หรือ `git commit` ไฟล์ `.patch`

4. ตรวจผล:

```powershell
git log -3 --oneline
git status --short
```

ตรวจหน้าเว็บก่อน แล้วจึง push ตามปกติหากต้องการให้ Render deploy:

```powershell
git push origin main
```

ถ้า `git am` แจ้ง conflict ให้หยุดและส่งข้อความ error เต็ม ๆ มาให้ตรวจ หากต้องยกเลิกชุดที่ค้าง ใช้ `git am --abort`

## ผลตรวจ

Production build ผ่านใน sandbox ของงานนี้ ส่วนคำสั่ง `pnpm check` ใน repo ปัจจุบันเรียก `tsc --noEmit` แต่ไม่มี `tsconfig.json` ทั้งที่ root และ `client/` จึงแสดงหน้าช่วยเหลือของ TypeScript และไม่สามารถใช้เป็น typecheck ได้
