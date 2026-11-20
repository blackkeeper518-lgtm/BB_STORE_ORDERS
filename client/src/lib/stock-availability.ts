export type StockAvailability = "in" | "out" | "unknown";

export function classifyStockAvailability(stockStatus: string | null | undefined, stockQty: number | null | undefined, adminAvailability?: string | null): StockAvailability {
  const adminRaw = String(adminAvailability ?? "").trim();
  const adminNormalized = adminRaw.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  if (adminNormalized.includes("OUT_OF_STOCK") || adminNormalized.includes("OUTOFSTOCK") || /หมด|ไม่มีของ/.test(adminRaw)) return "out";
  if (adminNormalized.includes("INSTOCK") || adminNormalized.includes("IN_STOCK") || /มีของ|พร้อมขาย/.test(adminRaw)) return "in";

  const raw = String(stockStatus ?? "").trim();
  const normalized = raw.toUpperCase().replace(/[^A-Z0-9]+/g, "_");

  if (normalized.includes("OUT_OF_STOCK") || normalized.includes("OUTOFSTOCK") || /หมด|ไม่มีของ/.test(raw)) return "out";
  if (normalized.includes("INSTOCK") || normalized.includes("IN_STOCK") || /มีของ|พร้อมขาย/.test(raw)) return "in";

  // When there is no explicit admin override, use the actual quantity/status.
  if (typeof stockQty === "number" && stockQty > 0) return "in";
  if (stockQty === 0) return "out";
  return "unknown";
}
