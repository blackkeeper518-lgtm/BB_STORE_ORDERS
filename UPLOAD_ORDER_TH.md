# BB_STORE_ORDERS · Parcel Mapping UI Package

คิวปกติอ่านจาก `🦅ROGUE_xXx_SHIPPINGz` เพียงห้องเดียว สถานะต้นทางอัปเดตตาม workflow ทุก 1–3 นาที หน้าเว็บไม่รวม HUNTER และไม่คำนวณสถานะเอง

การปรับ UI:

- แสดงข้อความ Facebook และ Drakside ในแถวทันที ไม่ต้องเปิด Inspector
- ปุ่มคัดลอก Facebook และ Drakside แยกกัน
- กดเลข FLASH TRACKING เพื่อคัดลอกเลขทันที
- ปุ่มเปิดหน้า FLASH ยังคงอยู่
- ปุ่ม `×` ล้างช่องค้นหา
- ป้ายสถานะที่เลือกมีไฟกระพริบและวงแหวนชัดเจน
- ลดพื้นที่หัวการ์ด
- ไม่ส่ง Messenger และไม่แตะ `⛩️VOID_xXx_GATEWAYz`

ใช้ connection จาก `/secret-gallery/connect` โดยตรง

ไฟล์ที่ต้องวางทับตาม path:

- `client/src/lib/canonical.ts`
- `client/src/pages/ChatHub.tsx`
- `client/src/pages/ParcelMapping.tsx`
- `client/src/pages/OrderHistory.tsx`
- `server/routers.ts`
- `server/supabase.ts`
