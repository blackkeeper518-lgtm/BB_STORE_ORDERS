BB STORE PATCH FOR COMMIT d0e3faf458eb3221a90fb6071523b544dd0c4565

ให้แตก ZIP ก่อนนำไฟล์ไปวางใน repository ห้ามอัปโหลด ZIP เป็นไฟล์เดียวแล้วคาดหวังให้ GitHub แตกไฟล์ให้เอง

ไฟล์สำหรับวางทับ:
- client/src/App.tsx
- client/src/components/DashboardLayout.tsx
- client/src/lib/canonical.ts
- client/src/pages/StockRoom.tsx
- client/src/pages/SystemManual.tsx
- client/src/pages/TelegramDeliveryRoom.tsx
- client/src/pages/TelegramSentHistory.tsx

ไฟล์ที่ต้องลบด้วยตนเองตาม DELETE_FILES.txt:
- client/src/lib/TelegramDeliveryRoom.tsx

หลังวางไฟล์:
1. ตรวจว่า path ตรงกับรายการ
2. ลบไฟล์ตาม DELETE_FILES.txt
3. Commit และ push
4. รัน pnpm check
5. รัน pnpm build

ไม่รวม n8n, tools, .env, node_modules, dist และไฟล์ลับ
