import { describe, expect, it } from "vitest";
import { classifyStockAvailability } from "./stock-availability";

describe("classifyStockAvailability", () => {
  it("maps the current product-master instock token to available", () => {
    expect(classifyStockAvailability("✅ INSTOCK", 999)).toBe("in");
  });

  it("maps the trigger's out-of-stock token to unavailable", () => {
    expect(classifyStockAvailability("❌ OUT_OF_STOCK", 0)).toBe("out");
  });

  it("falls back to actual quantity only when status is absent", () => {
    expect(classifyStockAvailability(null, 12)).toBe("in");
    expect(classifyStockAvailability(null, 0)).toBe("out");
  });

  it("does not treat product status ACTIVE as stock availability", () => {
    expect(classifyStockAvailability("ACTIVE", null)).toBe("unknown");
  });

  it("uses the separate admin availability flag without changing the real quantity", () => {
    expect(classifyStockAvailability("✅ INSTOCK", 42, "OUT_OF_STOCK")).toBe("out");
    expect(classifyStockAvailability("❌ OUT_OF_STOCK", 0, "IN_STOCK")).toBe("in");
  });

  it("continues to derive state from the database stock trigger when no admin override is set", () => {
    expect(classifyStockAvailability("✅ INSTOCK", 24, null)).toBe("in");
    expect(classifyStockAvailability("❌ OUT_OF_STOCK", 0, null)).toBe("out");
  });
});
