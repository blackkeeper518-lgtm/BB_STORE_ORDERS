// BB_ORDERS_MAP FIX
// Replace the alias section inside extractProducts(), then replace chooseProduct() and output fields.

// --- Replace old alias loop (the old loop reads the first quantity for every alias) ---
for (const line of value.split(/\r?\n/).map(text).filter(Boolean)) {
  for (const [pattern, sku] of ALIASES) {
    const match = line.match(pattern);
    if (!match) continue;

    // Read the quantity belonging to this line/alias, not the first quantity in the whole message.
    const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:คอต|กล่อง|ซอง|ชิ้น)?\s*$/iu)
      || line.match(/(?:จำนวน|x|×|\|)\s*(\d+(?:\.\d+)?)/iu);
    add(found, sku, qtyMatch ? qtyMatch[1] : 1, `${source}:alias_line`);
  }
}

// --- Replace chooseProduct() with this ---
function chooseProduct(row, timeline) {
  const rawTexts = [
    ['raw_text', row.raw_text],
    ['single_cleaned_products', row.single_cleaned_products],
    ['product_lines', row.product_lines],
    ['sniper_x_text_clean', row.sniper_x_text_clean],
    ['clean_text', row.clean_text],
    ...timeline.map((value, index) => [`chat_timeline[${index}]`, value]),
  ];

  const found = new Map();
  for (const [source, raw] of rawTexts) {
    if (!raw) continue;
    for (const product of extractProducts(raw, source)) {
      const key = `${product.sku}|${product.qty}`;
      if (!found.has(key)) found.set(key, product);
    }
  }

  // Fallback: preserve every SKU/quantity line; never use only [0].
  if (!found.size) {
    const skuLines = String(row.extracted_sku ?? row.sku ?? '').split(/\r?\n/).map(text).filter(Boolean);
    const qtyLines = String(row.extracted_qty ?? row.extracted_quantity ?? row.qty ?? row.quantity ?? '')
      .split(/\r?\n/).map(text).filter(Boolean);
    skuLines.forEach((sku, index) => add(found, sku, qtyLines[index] ?? qtyLines[0] ?? 1, 'mapped_fallback_line'));
  }

  const products = [...found.values()];
  const formatted = products.map((product) => formatProduct(product, row));
  return {
    products,
    best: formatted.join('\n'),
    candidates: formatted,
  };
}

// --- In output, replace the old products[0] fields with these ---
const realSkus = product.products.map((p) => p.sku).join('\n');
const realQtys = product.products.map((p) => p.qty).join('\n');

// Use these fields inside the returned json object:
// extracted_sku: realSkus || null,
// sku: realSkus || null,
// extracted_qty: realQtys || text(row.extracted_qty || row.quantity) || null,
// extracted_product_raw: product.best || null,
// product_copy_text: product.best || null,
// product_display_for_packer: product.best || null,
// display_for_packer: product.best || null,
// final_display_for_packer: product.best || null,
// product_display_candidates: product.candidates,
// source_logic: product.products.map((p) => p.source).join('\n') || null,
