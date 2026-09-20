// BB_ORDERS_MAP source priority
// Use this before chooseProduct(). It prevents old chat messages from overriding
// the confirmed order summary.

function isConfirmedOrderSummary(value) {
  const s = text(value);
  return /(?:COD|ยอดรวม|ยอด COD|รายการสินค้า|ชื่อ-นามสกุล|ที่อยู่จัดส่ง)/iu.test(s)
    && /(?:\d+\s*คอต|รายการสินค้า|COD|ยอด COD)/iu.test(s);
}

function lastConfirmedTimelineMessage(timeline) {
  for (let i = timeline.length - 1; i >= 0; i--) {
    const value = text(timeline[i]);
    if (/(?:\[เพจ:|รายการสินค้า\s*:|COD\s*[:：])/iu.test(value)) return value;
  }
  return '';
}

function productSourceCandidates(row, timeline) {
  const summary = [row.sniper_x_text_clean, row.clean_text]
    .map(text)
    .find(isConfirmedOrderSummary) || '';
  const timelineSummary = lastConfirmedTimelineMessage(timeline);

  // Priority: product-only n8n field -> confirmed order summary -> latest confirmed timeline.
  // Do not start with full_chunk_text; it contains old conversations.
  return [
    ['raw_text', row.raw_text],
    ['single_cleaned_products', row.single_cleaned_products],
    ['order_summary', summary],
    ['chat_timeline_confirmed', timelineSummary],
  ].filter(([, value]) => text(value));
}

// In chooseProduct(), replace the old rawTexts array with:
// const rawTexts = productSourceCandidates(row, timeline);
// Then process rawTexts exactly as before.

// Verification rule:
// - If a line has SKU/name and quantity in raw_text, keep that quantity.
// - If summary and chat disagree, keep the confirmed summary and mark the row REVIEW.
// - total_quantity remains the trusted order-level total; never use it to rewrite line quantities.
