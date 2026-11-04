// 🎨 แมปอีโมจิสำรองตาม Keyword ของ SKU
// ใช้เฉพาะเมื่อ SKU นั้นไม่มี emoji ใน PRODUCT_MASTER
// ลำดับสำคัญ: SKU เฉพาะเจาะจงก่อน keyword กว้าง
const EMOJI_MAP_BY_KEYWORD = [
  // สินค้าเฉพาะที่มีชื่อผลไม้/สีปนกัน ต้องล็อกชื่อสินค้าให้มาก่อน
  [/CAVALLO[_\s-]*WATERMELON|OS[_\s-]*WATERMELON|WATERMELON|แตงโม/iu, '🍉'],
  [/CAVALLO[_\s-]*MANGO|OS[_\s-]*MANGO|MANGO|มะม่วง/iu, '🥭'],
  [/OS[_\s-]*BLUEBERRY|BLUEBERRY|บลูเบอร์รี่/iu, '🟪'],
  [/OS[_\s-]*STRAWBERRY|STRAWBERRY|สตรอว์เบอร์รี่|สตรอเบอร์รี่/iu, '🍓'],
  [/OS[_\s-]*PINEAPPLE|PINEAPPLE|สับปะรด/iu, '🍍'],
  [/VESS[_\s-]*(?:CRUSH[_\s-]*)?GRAPE|GRAPE|องุ่น/iu, '🍇'],

  // SKU สีหลัก
  [/GOLD|ทอง/iu, '🟡'],
  [/RED|แดง/iu, '🟥'],
  [/BLUE|ฟ้า|น้ำเงิน/iu, '🟦'],
  [/PURPLE|ม่วง/iu, '🟪'],
  [/BLACK|ดำ/iu, '⬛'],
  [/WHITE|ขาว/iu, '⬜'],
  [/GREEN|เขียว/iu, '🟩'],

  // คุณสมบัติ/รสชาติที่ไม่มีสีชัดเจน
  [/MENTHOL|MINT|เย็น|มิ้นต์|มินต์/iu, '❄️'],
  [/APPLE|แอปเปิ้ล/iu, '🍎'],
  [/ORANGE|ส้ม/iu, '🍊'],
  [/LEMON|มะนาว/iu, '🍋'],
  [/PEACH|พีช/iu, '🍑'],
  [/COCONUT|มะพร้าว/iu, '🥥'],
];

function getProductEmoji(sku, rowEmoji) {
  const cleanSku = String(sku ?? '').trim().toUpperCase();
  if (PRODUCT_MASTER[cleanSku]?.emoji) return PRODUCT_MASTER[cleanSku].emoji;

  // ใช้ emoji ของแถวเฉพาะเมื่อเป็น emoji เดี่ยวที่มีจริง
  const candidate = String(rowEmoji ?? '').trim().split(/\s+/)[0];
  if (candidate && candidate !== '📦' && /\p{Extended_Pictographic}/u.test(candidate)) {
    return candidate;
  }

  for (const [pattern, emoji] of EMOJI_MAP_BY_KEYWORD) {
    if (pattern.test(cleanSku)) return emoji;
  }
  return '📦';
}
