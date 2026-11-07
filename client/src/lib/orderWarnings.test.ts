import { describe, expect, it } from "vitest";
import { getOrderWarnings } from "./orderWarnings";

const cleanOrder = {
  upsert_key: "page-1:order-1",
  order_number: "ORD-1",
  customer_name: "ผู้รับทดสอบ",
  phone: "0812345678",
  province: "กรุงเทพมหานคร",
  zipcode: "10110",
  final_address_for_bill: "บ้านเลขที่ 12 หมู่ 3 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10110",
  final_display_for_packer: "สินค้า A จำนวน 2 ชิ้น",
  cod_amount: 500,
  total_quantity: 2,
  stock_qty: "",
};

describe("getOrderWarnings", () => {
  it("does not flag a complete order or an empty stock quantity", () => {
    expect(getOrderWarnings(cleanOrder)).toEqual([]);
  });

  it("blocks all 20 user-provided restricted postcode prefixes", () => {
    const postcodes = [
      "30000", "31000", "32000", "33000", "34000", "35000", "36000", "37000", "38000", "39000",
      "40000", "41000", "42000", "43000", "44000", "45000", "46000", "47000", "48000", "49000",
    ];
    for (const zipcode of postcodes) {
      expect(getOrderWarnings({ ...cleanOrder, zipcode }).some((warning) => warning.code === "RESTRICTED_AREA" && warning.severity === "BLOCK"), zipcode).toBe(true);
    }
  });

  it("flags a short address, incomplete phone, DATA MISS, and bot bill recheck", () => {
    const warnings = getOrderWarnings({
      ...cleanOrder,
      phone: "12345",
      final_address_for_bill: "บ้าน 4",
      zipcode: "",
      datamiss: true,
      telegram_copy_text: "บอททวนบิลก่อนจัดส่ง",
    });
    const codes = warnings.map((warning) => warning.code);
    expect(codes).toContain("PHONE_INVALID");
    expect(codes).toContain("ADDRESS_SHORT");
    expect(codes).toContain("POSTCODE_MISSING");
    expect(codes).toContain("DATA_MISS");
    expect(codes).toContain("BOT_RECHECK");
  });

  it("blocks cancelled orders and flags a cancellation note in item details", () => {
    expect(getOrderWarnings({ ...cleanOrder, cancel_status: "CANCELLED" }).some((warning) => warning.code === "ORDER_CANCELLED" && warning.severity === "BLOCK")).toBe(true);
    expect(getOrderWarnings({ ...cleanOrder, order_fibo_product: "ยกเลิกสินค้า 1 ชิ้น" }).some((warning) => warning.code === "ITEM_CANCELLED" && warning.severity === "REVIEW")).toBe(true);
  });

  it("recognizes Thailand mobile numbers with country code 66", () => {
    expect(getOrderWarnings({ ...cleanOrder, phone: "+66812345678" }).some((warning) => warning.code === "PHONE_INVALID")).toBe(false);
  });
});
