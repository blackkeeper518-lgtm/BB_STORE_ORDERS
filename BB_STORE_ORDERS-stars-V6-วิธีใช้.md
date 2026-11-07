# ⭐⭐⭐V6 — คำเตือนออเดอร์ + Script Atelier

แพตช์นี้ทำจากฐาน `origin/main` ที่ commit `9f6f5ba` และสร้าง commit ชื่อ `⭐⭐⭐V6` แล้ว ตัวแพตช์เป็น Git mbox patch หนึ่ง commit ใช้ `git am` ได้ (ทดสอบ apply บน worktree สะอาดแล้ว)

## มีอะไรในแพตช์

- หน้า **Order Control** แสดง Order Safety Radar ด้านบน, ป้ายเตือนในการ์ดแต่ละออเดอร์ และรายละเอียดคำเตือนของออเดอร์ที่เลือก
- หน้า **Telegram** ใช้กฎเตือนชุดเดียวกับหน้า Order Control แยก `งดส่ง` กับ `ตรวจเพิ่ม`; รายการ `BLOCK` จะหยุดทั้งการส่งเดี่ยวและการส่งเป็นชุด ส่วนรายการ `REVIEW` จะแสดงคำเตือนและขอให้ยืนยันก่อนส่ง
- กฎตรวจ DATA MISS, เบอร์โทร, ที่อยู่สั้น/รหัสไปรษณีย์, ข้อความบอทให้ทวนบิล, พื้นที่เสี่ยง, ออเดอร์/สินค้ายกเลิก รวมถึง COD, สินค้า/ชื่อผู้รับ และสถานะซ้ำ/แก้ไขที่มีฟิลด์รองรับ
- ใช้ชื่อจังหวัด/รหัสไปรษณีย์ 20 จังหวัดตามรายการที่ให้มา โดยเทียบ prefix สองหลักจากรหัสตัวอย่าง เช่น `30xxx` = นครราชสีมา และ `49xxx` = มุกดาหาร
- **ไม่เพิ่ม webhook, ไม่เพิ่ม API call สำหรับคำนวณคำเตือน, ไม่แก้ฐานข้อมูลหรือเขียน flag กลับ** — warning คำนวณจากข้อมูลที่ห้องอ่านอยู่แล้ว
- Script Atelier ไม่มีช่อง/เงื่อนไขให้ผู้ใช้กรอก SKU; เมื่อเลือกรูปจะเห็นภาพตัวอย่างทันทีในหน้าต่างแก้ไข จากนั้นอัปโหลดและบันทึกผูกกับสคริปต์ ภายในโค้ดยังส่ง `sku` ว่างให้เฉพาะเพื่อความเข้ากันได้กับคอลัมน์ legacy ที่ฐานข้อมูลเดิมบังคับไว้ ไม่ได้บังคับผู้ใช้กรอก SKU

## ขั้นที่ 1 — เตรียม repo ใน VS Code

ดาวน์โหลดไฟล์ patch แล้ววางไว้ที่โฟลเดอร์หลักของ repo `BB_STORE_ORDERS` จากนั้นเปิด Terminal → PowerShell ที่โฟลเดอร์ repo

คัดลอกเฉพาะคำสั่งในกรอบนี้ลง Terminal:

```powershell
git status
git branch --show-current
git log -1 --oneline
```

ก่อนทำต่อ ให้แน่ใจว่าอยู่ branch `main` และไม่มีงานของตัวเองค้างใน `git status` หากมีบรรทัด `M`, `A`, `D` หรือ `??` ให้หยุดก่อนและสำรอง/commit งานของตัวเอง อย่าลบหรือ reset ไฟล์เพื่อบังคับให้สะอาด

ถ้า Terminal แจ้งว่าอยู่ระหว่าง `git am` ให้ยกเลิกรอบที่ค้างก่อนเท่านั้น:

```powershell
git am --abort
git status
```

อย่าพิมพ์ข้อความ help ของ Git หรือข้อความอธิบายลง Terminal ให้พิมพ์เฉพาะคำสั่งในกรอบโค้ด

## ขั้นที่ 2 — อัปเดต main และ apply patch

เมื่อ working tree สะอาดและอยู่บน `main` แล้ว ให้อัปเดตจาก GitHub:

```powershell
git fetch origin
git pull --ff-only origin main
```

ถ้าคำสั่งนี้ขึ้นว่า branch มีประวัติแยกกัน ให้หยุดและส่งผล `git status` กับ `git log -5 --oneline --decorate` มาให้ดูก่อน **อย่าใช้ `reset --hard`**

ถ้าวาง patch ไว้ที่ root ของ repo ให้ apply ด้วย:

```powershell
git am --3way ".\BB_STORE_ORDERS-stars-V6.patch"
```

ถ้าเก็บไฟล์ไว้ใน Downloads ให้ใช้ path จริง เช่น:

```powershell
git am --3way "$env:USERPROFILE\Downloads\BB_STORE_ORDERS-stars-V6.patch"
```

ไม่ต้องสั่ง `git commit` ซ้ำ เพราะ `git am` สร้าง commit `⭐⭐⭐V6` ให้แล้ว

## ขั้นที่ 3 — ตรวจและ deploy

ตรวจว่า commit เข้าแล้ว:

```powershell
git log -1 --oneline
git status --short
```

ควรเห็น subject `⭐⭐⭐V6` และไม่มีไฟล์เปลี่ยนค้าง จากนั้นส่งขึ้น GitHub เพื่อให้ Render build/deploy ตามการตั้งค่าของ repo:

```powershell
git push origin main
```

รอ Render deploy เสร็จ แล้วเปิด `/orders` กับ `/telegram-delivery` ตรวจหน้าใหม่ และดู log ให้ `pnpm build` สำเร็จ

### ตรวจ build ในเครื่อง (ถ้ามี pnpm)

```powershell
pnpm install --frozen-lockfile
pnpm build
```

ถ้า PowerShell บอกว่าไม่รู้จัก `pnpm` คุณยังไม่ต้อง commit เพิ่มหรือคัดลอกไฟล์เอง — ใช้ Render build หลัง push เป็นตัวตรวจได้ หรือเตรียม Node.js/pnpm ก่อน

## ถ้า `git am` แจ้ง conflict

อย่าพิมพ์ `git commit` เองหรือคัดลอกบรรทัด help ลง Terminal ให้ดูสถานะด้วย:

```powershell
git status
```

ถ้ายังไม่ต้องการแก้ conflict ให้ยกเลิกรอบ patch ที่ค้าง:

```powershell
git am --abort
git status --short
```

คำสั่งนี้ยกเลิกเฉพาะ am ที่กำลังค้าง ไม่ได้ลบ commit ก่อนหน้า หากมี conflict อีก ให้ส่งผล `git status` และบรรทัด error มาให้ดูก่อน

## ผลตรวจจากฝั่งแพตช์

- `pnpm build` ผ่าน
- `pnpm test -- client/src/lib/orderWarnings.test.ts` ผ่าน 5 tests รวมทั้งครบ 20 รหัสไปรษณีย์ตัวอย่าง
- TypeScript check สำหรับไฟล์ที่แก้ผ่าน
- `git am --3way` ผ่านบน worktree สะอาดที่ฐาน `9f6f5ba`

หมายเหตุ: การตรวจ warning ขึ้นกับฟิลด์ที่ข้อมูลออเดอร์โหลดมาได้จริง หากบางรายการไม่เตือนทั้งที่ควรเตือน ให้ส่งตัวอย่างแถวแบบปิดข้อมูลส่วนตัวแล้วค่อย map ชื่อฟิลด์เพิ่ม โดยไม่ต้องเปลี่ยนโครงสร้างฐานข้อมูล
