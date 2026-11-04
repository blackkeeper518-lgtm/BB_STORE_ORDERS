# BB_STORE_ORDERS · ChatHub Fixed Layout Package

ปรับเฉพาะโครงขนาดก่อนเพิ่มเครื่องมืออื่น:

- หัวห้องไม่ขยายตามข้อความ
- พื้นที่ข้อความแชทเป็นส่วนที่เลื่อนเอง
- composer ถูกล็อกด้านล่าง สูงคงที่ 250px
- textarea สูงคงที่ 112px และเลื่อนเฉพาะด้านในเมื่อข้อความยาว
- ปุ่มส่งไม่ถูกดันหาย
- summary preview ที่ยาวไม่แทรกเข้ามาดัน composer
- แผงขวาเป็น drawer overlay ไม่กินพื้นที่กลาง
- แผงขวาปรับกว้างได้ด้วย slider 280–520px
- กด X เพื่อหุบแผง และกดเปิดเครื่องมือเพื่อเปิดกลับ
- Tracking Card ยังแสดงเฉพาะห้องที่มีออเดอร์จับคู่จริง

ตรวจแล้ว:

- `pnpm check` ผ่าน
- `pnpm build` ผ่าน

ไฟล์ที่ต้องวางทับตาม path:

- `client/src/lib/canonical.ts`
- `client/src/pages/ChatHub.tsx`
- `client/src/pages/ParcelMapping.tsx`
- `client/src/pages/OrderHistory.tsx`
- `server/routers.ts`
- `server/supabase.ts`
