// BB_MASTER quantity fix
// Replace the old block that totals all quantities and then fills every line with "1".
// This keeps the quantity attached to each product line from n8n.

const qtySource = String(
  $json.raw_text
  ?? $json.product_lines
  ?? $json.single_cleaned_products
  ?? rawStep1Text
  ?? ''
).trim();

const qtyMatches = [...qtySource.matchAll(/\b([0-9]+(?:[.,][0-9]+)?)\b/g)]
  .map(match => Number(String(match[1]).replace(',', '.')))
  .filter(value => Number.isFinite(value) && value > 0 && value <= 99);

const fallbackQty = Number(String(finalQty ?? '').replace(',', '.'));
const qtyLines = qtyMatches.length
  ? qtyMatches
  : (Number.isFinite(fallbackQty) ? [fallbackQty] : []);

const qtyDisplay = qtyLines.length === 1
  ? String(qtyLines[0])
  : qtyLines.join('\n');

const totalQty = qtyLines.reduce((sum, value) => sum + value, 0);

// Use this object in output.push({ json: { ... } }.
// Do not use totalQty to overwrite each product line.
const quantityFields = {
  quantity: qtyDisplay,
  qty: qtyDisplay,
  extracted_qty: qtyDisplay,
  master_qty_display: qtyDisplay,
  master_extracted_qty: qtyDisplay,
  total_quantity: totalQty,
};

// Preserve product lines exactly as n8n/master matching produced them.
const productDisplayFields = {
  single_cleaned_products: qtySource,
  master_display_for_packer: String(finalDisplayLocked ?? '').trim(),
  final_display_for_packer: String(finalDisplayLocked ?? '').trim(),
  raw_text: String($json.raw_text ?? qtySource).trim(),
};

// In the output object, spread these two objects after the old scalar fields:
// ...quantityFields,
// ...productDisplayFields,
// and remove the old splitQtyArray/totalKot assignments.
