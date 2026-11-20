import { describe, expect, it } from "vitest";
import { classifyStockAvailability } from "./stock-availability";

describe("classifyStockAvailability", () => {
  it("maps the current product-master instock token to available", () => {
    expect(classifyStockAvailability("✅ INSTOCK", 999)).toBe("in");
  });

  it("maps the trigger's out-of-stock token to unavailable", () => {
    expect(classifyStockAvailability("❌ OUT_OF_STOCK", 0)).toBe("out");
  });

  it("uses the current 999/0 control flag only when status is absent", () => {
    expect(classifyStockAvailability(null, 999)).toBe("in");
    expect(classifyStockAvailability(null, 0)).toBe("out");
  });

  it("does not treat product status ACTIVE as stock availability", () => {
    expect(classifyStockAvailability("ACTIVE", null)).toBe("unknown");
  });
});
