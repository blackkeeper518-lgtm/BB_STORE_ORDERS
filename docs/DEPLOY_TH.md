# วิธีอัปโหลด BB_STORE_ORDERS

แพ็กเกจนี้เป็น source project สำหรับอัปโหลดไปยังโหนดเว็บ ไม่รวม `node_modules`, `dist` และ `.git` เพื่อให้ระบบติดตั้ง dependency และ build ใหม่บนโหนดปลายทาง

## คำสั่งหลัก

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

ถ้าโหนดใช้ npm ให้ใช้ `npm install` แทนได้ แต่แนะนำให้ใช้ pnpm เพราะโปรเจกต์มี `pnpm-lock.yaml`

## SQL

รัน SQL ใน Supabase โปรเจกต์สายส่งเลขเอง:

```text
sql/20261106_script_atelier.sql
sql/views/combined_views.sql
```

เว็บจะไม่รัน SQL ให้อัตโนมัติ

## การเชื่อม Supabase

หลังเปิดเว็บ ให้เข้า `/secret-gallery/connect` แล้วตั้งค่า URL และ Anon/Publishable Key ของโปรเจกต์สายส่งเลข ห้อง Script Atelier จะอ่านสต๊อกจากโต๊ะเดิม และอ่าน/เขียนการ์ดจาก `sales_script_cards`

อย่าใส่ secret key ลงใน source package และอย่าอัปโหลดไฟล์ `.env` ขึ้นโหนดสาธารณะ
