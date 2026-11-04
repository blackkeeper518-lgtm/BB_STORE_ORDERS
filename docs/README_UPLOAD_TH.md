# วิธีอัปโหลด BB_STORE_ORDERS — 11 ไฟล์

แพ็กนี้มีไฟล์ที่เปลี่ยนจาก `origin/main` จำนวน **11 ไฟล์** พร้อมโครงสร้าง path เดิมของ repository

## ใช้หน้า GitHub Upload files

1. ดาวน์โหลด `bb-store-orders-11-files.zip` แล้ว **แตก ZIP ก่อน** (GitHub จะอัปโหลด ZIP เป็นไฟล์ ZIP ไม่ได้แตกให้อัตโนมัติ)
2. เปิดหน้า [Upload files ของ repository](https://github.com/blackkeeper518-lgtm/BB_STORE_ORDERS/upload/main)
3. ลากโฟลเดอร์ `client`, `server`, `sql` และไฟล์ `package.json`, `pnpm-lock.yaml`, `telegram-status-archive.patch` จากโฟลเดอร์ที่แตกแล้วลงหน้า Upload — หรือใช้ปุ่มเลือกไฟล์หลายรายการ
4. ตรวจหน้าตัวอย่างก่อน commit: ควรเห็นทั้งหมด **11 paths** โดย 10 paths เป็นการแทนที่ไฟล์เดิม และ `server/supabase.test.ts` เป็นไฟล์ใหม่
5. ใส่ commit message เช่น `Fix Telegram delivery and improve Secret Gallery` แล้วทำตามตัวเลือก commit/branch ที่ GitHub แสดง

**สำคัญ:** ถ้า GitHub แสดงว่าจะเพิ่ม ZIP เป็นไฟล์เดียว แปลว่ายังไม่ได้แตกไฟล์ — อย่า commit ZIP ไฟล์นั้นใน repository

ถ้า branch `main` ถูกป้องกันหรือ GitHub ไม่ให้ commit ตรง ให้สร้าง branch/PR ตามที่หน้าเว็บแจ้ง

## ตัวเลือกใช้ patch

ไฟล์ `bb-store-orders-11-files.patch` เป็น unified Git patch ของทั้ง 11 paths หากนำไปใช้ผ่าน Git แทนหน้าเว็บ ให้รันจาก checkout ที่อิง `origin/main`:

```bash
git apply --check bb-store-orders-11-files.patch
git apply bb-store-orders-11-files.patch
```

จากนั้นตรวจ `git status`, commit แล้ว push ตาม workflow ของ repository
