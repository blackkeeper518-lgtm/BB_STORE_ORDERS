BB STORE / Drakside — ห้องที่ขอ (แพตช์ล่าสุด)

วิธีใช้: แตก ZIP แล้วเปิดโฟลเดอร์ BB_STORE_ORDERS_rooms_patch_2026-11-03 จากนั้นนำ client/ และ server/ ไปวางทับ path เดิมใน repository โดยคงโฟลเดอร์ไว้

ไฟล์ตามรายการที่ขอ:
- client/src/pages/OrderHistory.tsx
- client/src/pages/DailyChatSummary.tsx
- client/src/lib/canonical.ts
- server/routers.ts
- server/supabase.ts
- client/src/components/DashboardLayout.tsx
- client/src/pages/AlertRoom.tsx
- client/src/lib/telegramDelivery.ts
- client/src/pages/TelegramDeliveryRoom.tsx
- client/src/lib/TelegramDeliveryRoom.tsx (helper/legacy module)

ไฟล์ประกอบที่เพิ่มเพื่อให้ route และ server handler ที่เกี่ยวข้องครบ:
- client/src/App.tsx
- client/src/pages/CloseJobHistory.tsx
- server/meta.ts

OrderHistory.tsx ซ้ำในรายการที่พิมพ์มา จึงใส่ครั้งเดียวตาม path จริง
