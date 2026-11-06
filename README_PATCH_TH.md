# BB Script Atelier Patch

แพ็กเกจนี้มีเฉพาะไฟล์ที่แก้/เพิ่มสำหรับ Script Atelier ไม่ใช่โปรเจกต์เต็ม

ให้แตก ZIP ทับในโฟลเดอร์โปรเจกต์เดิม โดยคงโครงสร้างโฟลเดอร์ไว้ แล้วรัน SQL ใน Supabase:

1. `sql/views/combined_views.sql`
2. `sql/20261106_script_atelier.sql`

ไฟล์ที่อยู่ใน patch นี้จะทับไฟล์เดิมดังนี้:
- `client/src/App.tsx`
- `client/src/components/DashboardLayout.tsx`
- `client/src/index.css`
- `client/src/pages/ScriptAtelier.tsx`
- `public/manus-routes.json`
- `sql/views/combined_views.sql`
- `sql/20261106_script_atelier.sql`

หลังแตกไฟล์ในโปรเจกต์เดิม ให้ติดตั้งและ build ตามระบบเดิม ไม่ต้องเอา ZIP นี้ไปรันเป็นโปรเจกต์เดี่ยว
