export type HistoryProductItem = {
  sku: string;
  masterSku: string;
  name: string;
  quantity: number | null;
  display: string;
};

function parseValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function quantity(value: unknown): number | null {
  const match = text(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function list(value: unknown): unknown[] {
  const parsed = parseValue(value);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return parsed == null || parsed === "" ? [] : [parsed];
}

function itemFrom(value: unknown, fallbackMasterSku = ""): HistoryProductItem | null {
  const parsed = parseValue(value);
  if (typeof parsed === "string") {
    const display = parsed.trim();
    return display ? { sku: "", masterSku: fallbackMasterSku, name: display, quantity: null, display } : null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const row = parsed as Record<string, unknown>;
  const masterSku = text(row.master_sku ?? row.masterSku ?? row.product_map_master_sku ?? fallbackMasterSku);
  const sku = text(row.sku ?? row.product_sku ?? row.product_map_sku ?? masterSku);
  const name = text(row.name ?? row.product_name ?? row.th_name ?? row.name_standard ?? row.display ?? row.product);
  const qty = quantity(row.quantity ?? row.qty ?? row.order_qty ?? row.final_order_qty ?? row.extracted_text_qty);
  const display = text(row.display_for_packer ?? row.final_display_for_packer ?? row.display ?? row.product_display) || [masterSku || sku, name].filter(Boolean).join(" ");
  if (!display && !sku && !masterSku) return null;
  return { sku, masterSku, name, quantity: qty, display: display || sku || masterSku };
}

export function parseHistoryProducts(row: Record<string, unknown>): HistoryProductItem[] {
  const masterSkus = list(row.product_map_master_sku_list).map(text).filter(Boolean);
  const structured = [...list(row.product_items_v5), ...list(row.product_items_matched), ...list(row.product_map_items)]
    .map((value, index) => itemFrom(value, masterSkus[index] ?? ""))
    .filter((item): item is HistoryProductItem => Boolean(item));
  const unique = new Map<string, HistoryProductItem>();
  structured.forEach((item) => unique.set(`${item.masterSku}|${item.sku}|${item.display}|${item.quantity ?? ""}`, item));
  if (unique.size) return [...unique.values()];

  const fallbackDisplay = text(row.final_display_for_packer) || text(row.final_product) || text(row.telegram_product_display) || text(row.order_fibo_product) || text(row.sku);
  if (!fallbackDisplay) return [];
  const qty = quantity(row.final_order_qty ?? row.extracted_text_qty ?? row.qty_display_th);
  return [{ sku: text(row.sku), masterSku: masterSkus[0] ?? text(row.master_sku), name: fallbackDisplay, quantity: qty, display: fallbackDisplay }];
}

export function historyProductDisplay(row: Record<string, unknown>): string {
  return parseHistoryProducts(row).map((item) => item.quantity == null ? item.display : `${item.display} × ${item.quantity}`).join("\n") || "ไม่มีข้อมูลสินค้าใน GENESIS";
}

export function historyChangeLabel(row: Record<string, unknown>): string {
  const current = text(row.customer_product_current);
  const previous = text(row.customer_product_previous);
  if (!current && !previous) return "";
  if (current && previous && current !== previous) return `เปลี่ยนสินค้า: ${previous} → ${current}`;
  return `ห้องเปลี่ยนของ: ${current || previous}`;
}
