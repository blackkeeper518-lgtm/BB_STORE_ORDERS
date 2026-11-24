ปรับแบรนด์ BB เป็น ST SINGTO STORE / BLACK LION COMMAND

แนวทางสี: ดำเป็นพื้น, ส้มเป็นสีแบรนด์, ทองเป็นรางวัล/ความสำเร็จ, ขาวอุ่นเป็นข้อความ
สีเขียว/แดง/ฟ้ายังคงความหมายสถานะเดิม

ไฟล์หลักที่แก้:
- client/src/index.css — design tokens และการปรับธีมทั่วหน้า
- client/src/components/DashboardLayout.tsx — โลโก้/ชื่อร้านใน sidebar และ avatar
- client/public/lion-mark.svg — โลโก้สิงโตและ favicon
- client/index.html — title, favicon และ theme color
- client/src/pages/*.tsx — ป้ายแบรนด์ ST ที่ผู้ใช้เห็น

คง logic, business IDs, ชื่อ data lanes, database connections, COD และ page mapping ไว้

ตรวจแล้ว: `pnpm build` ผ่าน และ `git diff --check` ผ่าน
`pnpm check` ใช้ไม่ได้ใน repository นี้เพราะไม่มี tsconfig.json (คำสั่ง tsc แสดง help)
