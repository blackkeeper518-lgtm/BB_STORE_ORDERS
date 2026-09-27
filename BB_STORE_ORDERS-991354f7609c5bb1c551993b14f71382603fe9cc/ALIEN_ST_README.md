# ALIEN ST

ชุดไฟล์ห้อง Alien สำหรับ Singto Store (ST)

- `client/src/pages/AlienRoom.tsx` — Order Inspector + Customer History
- `client/src/lib/canonical.ts` — อ่าน `st_orders`, `normalized_chat_timeline` และ Product Master
- `n8n/SINGTO_V4_3_3_PRODUCT_PARSER.js` — parser ที่กันบ้านเลขที่หายและมี fallback
- `sql/ST_ORDERS_FULL_REFERENCE_COLUMNS.sql` — SQL สำหรับ `public.st_orders`

กฎเหล็ก:
- จับได้จริง + มี `master_display_for_packer` เท่านั้น = `MATCHED`
- จับไม่ได้ = `REVIEW`
- ไม่มี raw = `RAW_MISSING`
- ไม่ทิ้งออเดอร์
