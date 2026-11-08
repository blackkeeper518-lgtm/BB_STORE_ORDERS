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

  it("ignores all non-province warnings", () => {
    const warnings = getOrderWarnings({
      ...cleanOrder,
      phone: "12345",
      final_address_for_bill: "บ้าน 4",
      zipcode: "",
      datamiss: true,
      telegram_copy_text: "บอททวนบิลก่อนจัดส่ง",
      cancel_status: "CANCELLED",
      order_fibo_product: "ยกเลิกสินค้า 1 ชิ้น",
    });
    expect(warnings).toEqual([]);
  });

  it("uses a source risk signal without inventing other warnings", () => {
    expect(getOrderWarnings({ ...cleanOrder, high_risk_area: true })).toEqual([{
      code: "RESTRICTED_AREA",
      severity: "BLOCK",
      message: "งดส่ง/พื้นที่เสี่ยง · กรุงเทพมหานคร",
    }]);
  });

  it("recognizes a restricted province from the province field", () => {
    expect(getOrderWarnings({ ...cleanOrder, province: "บุรีรัมย์", zipcode: "" })).toEqual([{
      code: "RESTRICTED_AREA",
      severity: "BLOCK",
      message: "งดส่ง/พื้นที่เสี่ยง · บุรีรัมย์",
    }]);
  });
});
