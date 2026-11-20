export type StockAvailability = "in" | "out" | "unknown";

export function classifyStockAvailability(stockStatus: string | null | undefined, stockQty: number | null | undefined): StockAvailability {
  const raw = String(stockStatus ?? "").trim();
  const normalized = raw.toUpperCase().replace(/[^A-Z0-9]+/g, "_");

  if (normalized.includes("OUT_OF_STOCK") || normalized.includes("OUTOFSTOCK") || /หมด|ไม่มีของ/.test(raw)) return "out";
  if (normalized.includes("INSTOCK") || normalized.includes("IN_STOCK") || /มีของ|พร้อมขาย/.test(raw)) return "in";

  // This workflow currently uses 999/0 as availability flags, not physical counts.
  if (typeof stockQty === "number" && stockQty > 0) return "in";
  if (stockQty === 0) return "out";
  return "unknown";
}
