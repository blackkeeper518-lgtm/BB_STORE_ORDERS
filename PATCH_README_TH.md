BB STORE TELEGRAM / SYSTEM PATCH

ไฟล์แพ็กเกจนี้จัดตาม path ของโปรเจกต์หลัก และใช้สำหรับนำไปวางทับใน commit ล่าสุดของ BB_STORE_ORDERS
เป้าหมายอ้างอิงจาก commit ที่ผู้ใช้แจ้ง:
d0e3faf458eb3221a90fb6071523b544dd0c4565

ไฟล์ในแพ็กเกจ:
- client/src/App.tsx
- client/src/components/DashboardLayout.tsx
- client/src/lib/canonical.ts
- client/src/pages/StockRoom.tsx
- client/src/pages/SystemManual.tsx
- client/src/pages/TelegramDeliveryRoom.tsx
- client/src/pages/TelegramSentHistory.tsx

การใช้งาน:
1. แตกไฟล์ ZIP ที่ root ของ repository BB_STORE_ORDERS
2. อนุญาตให้ไฟล์ในแพ็กเกจวางทับไฟล์เดิมตาม path
3. รัน pnpm check
4. รัน pnpm build

หมายเหตุ:
- ไม่รวม n8n, tools, .env, node_modules, dist และไฟล์ลับ
- ไม่รวมไฟล์ Alias/Product Alias ที่ไม่ได้ใช้งาน
- ไม่ลบไฟล์เก่าใด ๆ
