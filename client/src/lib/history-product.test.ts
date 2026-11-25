import { describe, expect, it } from "vitest";
import { historyChangeLabel, historyProductDisplay, parseHistoryProducts } from "./history-product";

describe("history product parser", () => {
  it("prefers structured mapped products and preserves multiple rows", () => {
    const row = {
      product_items_v5: JSON.stringify([
        { master_sku: "PLATINUM_GREEN", display_for_packer: "🟩 PLATINUM_GREEN", quantity: 2 },
        { master_sku: "COOL_BLUE", display_for_packer: "🟦 COOL_BLUE", quantity: 1 },
      ]),
      final_product: "raw chat text",
      product_map_master_sku_list: '["PLATINUM_GREEN","COOL_BLUE"]',
    };
    expect(parseHistoryProducts(row).map((item) => item.masterSku)).toEqual(["PLATINUM_GREEN", "COOL_BLUE"]);
    expect(historyProductDisplay(row)).toContain("🟩 PLATINUM_GREEN × 2");
  });

  it("falls back to canonical display and quantity", () => {
    expect(historyProductDisplay({ final_display_for_packer: "🟩 PLATINUM_GREEN", final_order_qty: "3" }))
      .toBe("🟩 PLATINUM_GREEN × 3");
  });

  it("marks product-room changes", () => {
    expect(historyChangeLabel({ customer_product_previous: "OLD", customer_product_current: "NEW" }))
      .toBe("เปลี่ยนสินค้า: OLD → NEW");
  });
});
