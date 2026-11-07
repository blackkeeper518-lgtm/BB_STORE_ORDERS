export type OrderWarningSeverity = "BLOCK" | "REVIEW";
export type OrderWarning = {
  code: string;
  severity: OrderWarningSeverity;
  message: string;
};

type OrderRow = Record<string, unknown>;

const RESTRICTED_PROVINCES: Array<{ name: string; prefix: string }> = [
  { name: "นครราชสีมา", prefix: "30" },
  { name: "บุรีรัมย์", prefix: "31" },
  { name: "สุรินทร์", prefix: "32" },
  { name: "ศรีสะเกษ", prefix: "33" },
  { name: "อุบลราชธานี", prefix: "34" },
  { name: "ยโสธร", prefix: "35" },
  { name: "ชัยภูมิ", prefix: "36" },
  { name: "อำนาจเจริญ", prefix: "37" },
  { name: "บึงกาฬ", prefix: "38" },
  { name: "หนองบัวลำภู", prefix: "39" },
  { name: "ขอนแก่น", prefix: "40" },
  { name: "อุดรธานี", prefix: "41" },
  { name: "เลย", prefix: "42" },
  { name: "หนองคาย", prefix: "43" },
  { name: "มหาสารคาม", prefix: "44" },
  { name: "ร้อยเอ็ด", prefix: "45" },
  { name: "กาฬสินธุ์", prefix: "46" },
  { name: "สกลนคร", prefix: "47" },
  { name: "นครพนม", prefix: "48" },
  { name: "มุกดาหาร", prefix: "49" },
];

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(" ");
  if (typeof value === "object") {
    try { return JSON.stringify(value); } catch { return ""; }
  }
  return String(value).trim();
}

function firstText(row: OrderRow, keys: string[]): string {
  for (const key of keys) {
    const value = text(row[key]);
    if (value) return value;
  }
  return "";
}

function enabled(value: unknown): boolean {
  return value === true || value === 1 || ["true", "t", "1", "yes", "ใช่"].includes(text(value).toLowerCase());
}

function hasAnyValue(value: unknown): boolean {
  if (value == null || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  const result = text(value);
  return Boolean(result && result !== "[]" && result !== "{}" && result.toLowerCase() !== "null");
}

function normalizedPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("66") && digits.length === 11) digits = `0${digits.slice(2)}`;
  return digits;
}

function isThaiPhone(value: string): boolean {
  return /^0\d{9}$/.test(normalizedPhone(value));
}

function statusIndicatesCancellation(value: string): boolean {
  const status = value.trim().toLowerCase();
  if (!status || /not[_\s-]?cancel|ไม่ยกเลิก/.test(status)) return false;
  return /ยกเลิก|cancel(?:led|ed)?/.test(status);
}

function postalCodeFrom(address: string): string {
  return address.match(/(?:^|\D)(\d{5})(?!\d)/)?.[1] ?? "";
}

/**
 * Derive visible safety warnings from the order fields already loaded by the two rooms.
 * This function never changes source data, persists flags, or calls another service.
 */
export function getOrderWarnings(value: unknown): OrderWarning[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const row = value as OrderRow;
  const warnings: OrderWarning[] = [];
  const added = new Set<string>();
  const add = (code: string, severity: OrderWarningSeverity, message: string) => {
    if (added.has(code)) return;
    added.add(code);
    warnings.push({ code, severity, message });
  };

  const auditText = [row.warning_tag, row.audit_flags, row.auditFlags].map(text).join(" ");
  const address = firstText(row, [
    "address_fibo_selected_clean", "telegram_primary_address", "final_address_for_bill",
    "address_display_packer", "rescue_address_normalized", "full_address", "addressclean",
    "finalAddress", "short_address", "address",
  ]);
  const addressMissing = !address || /^(?:ยังไม่มีที่อยู่|ไม่พบที่อยู่|n\/a|null|undefined)$/i.test(address);
  const zipcode = firstText(row, ["zipcode", "zip_code", "postal_code", "postcode", "postal"]);
  const postal = zipcode.match(/\d{5}/)?.[0] ?? postalCodeFrom(address);
  const province = firstText(row, ["province", "master_province", "shipping_province", "amphoe"]);
  const locationText = `${province} ${address}`.replace(/\s+/g, "");
  const matchedProvince = RESTRICTED_PROVINCES.find(({ name }) => locationText.includes(name));
  const postalPrefix = postal.match(/^\d{2}/)?.[0] ?? "";
  const matchedPrefix = RESTRICTED_PROVINCES.find(({ prefix }) => prefix === postalPrefix);
  const explicitlyRisky = enabled(row.high_risk_area) || enabled(row.risk_area) ||
    /พื้นที่เสี่ยงสูง|RISK\s*AREA|ของโดนขโมย|งดส่งพื้นที่/i.test(auditText);
  if (matchedProvince || matchedPrefix || explicitlyRisky) {
    const place = matchedProvince?.name ?? matchedPrefix?.name ?? province;
    add("RESTRICTED_AREA", "BLOCK", `งดส่ง/พื้นที่เสี่ยง${place ? ` · ${place}` : ""} — ตรวจจังหวัด/รหัสไปรษณีย์ก่อนส่ง`);
  }

  if (addressMissing) {
    add("ADDRESS_MISSING", "REVIEW", "ไม่มีที่อยู่ผู้รับที่ใช้จัดส่ง");
  } else {
    if (address.length < 15 || !/\d/.test(address)) {
      add("ADDRESS_SHORT", "REVIEW", "ที่อยู่สั้นผิดปกติหรือไม่พบเลขที่บ้าน — ตรวจที่อยู่เต็มก่อนส่ง");
    }
    if (!/^\d{5}$/.test(postal)) {
      add("POSTCODE_MISSING", "REVIEW", "ไม่พบรหัสไปรษณีย์ 5 หลักในข้อมูลที่อยู่");
    }
  }

  const phone = firstText(row, ["master_customer_phone", "phone", "extracted_phone", "customer_phone", "phone_number", "order_phone"]);
  const phoneStatus = firstText(row, ["phone_status", "phone_type"]).toLowerCase();
  if (!isThaiPhone(phone) || /missing|invalid|reject|not.?found|ไม่ครบ|ไม่ถูกต้อง|ไม่พบ/.test(phoneStatus)) {
    add("PHONE_INVALID", "REVIEW", "เบอร์โทรขาดหรือรูปแบบไม่ครบ 10 หลัก");
  }

  const completeness = firstText(row, ["darkside_completeness_status", "data_completeness_status", "data_status", "bill_data_status"]).toLowerCase();
  const missingReasons = [row.darkside_missing_reasons, row.data_missing_reasons, row.missing_fields, row.datamiss].filter(hasAnyValue).map(text).join(" ");
  const completeFlag = row.darksideBillDataComplete ?? row.data_complete ?? row.bill_data_complete;
  const sourceDataEvidence = [row.raw_text, row.source_text, row.original].map(text).join(" ");
  const isDataMiss = completeFlag === false || enabled(row.datamiss) || enabled(row.data_miss) || ["false", "0", "no", "n"].includes(text(completeFlag).toLowerCase()) ||
    /data[\s_-]*miss|missing|incomplete|not[\s_-]*complete|ขาดข้อมูล|ข้อมูลไม่ครบ|ไม่ครบถ้วน/i.test(`${completeness} ${missingReasons}`) ||
    /\bDATAMISS\b|DATA[\s_-]*MISS|ข้อมูลไม่ครบ|ขาดข้อมูล/i.test(sourceDataEvidence);
  if (isDataMiss) {
    const detail = missingReasons.replace(/[\[\]{}"]+/g, " ").replace(/\s+/g, " ").trim();
    add("DATA_MISS", "REVIEW", `พบ DATA MISS/ข้อมูลบิลไม่ครบ${detail ? ` · ${detail.slice(0, 100)}` : ""}`);
  }

  const billText = [
    row.telegram_message_for_send_final, row.telegram_message, row.telegram_message_web,
    row.telegram_main_bill, row.telegram_actual_bill, row.telegram_bill, row.telegram_copy_text,
  ].map(text).filter(Boolean).join("\n");
  if (/บอท.{0,20}(?:ทวน|ยืนยัน)|(?:ทวน|ยืนยัน).{0,20}บิล|รอ.{0,12}(?:ทวน|ยืนยัน)|กรุณา.{0,24}(?:ตรวจ|ทวน|ยืนยัน)|ตรวจสอบ.{0,16}(?:ก่อนส่ง|บิล)|bot.{0,20}(?:review|confirm|verify)/i.test(billText)) {
    add("BOT_RECHECK", "REVIEW", "มีข้อความบอทให้ทวน/ยืนยันในบิล — ตรวจว่าลูกค้ายืนยันแล้ว");
  }

  const cancellationStatus = ["order_status", "cancel_status", "telegram_status", "delivery_status", "delivery_state", "life_status", "status"].map((key) => text(row[key])).find(statusIndicatesCancellation) ?? "";
  const explicitlyCancelled = [row.is_cancelled, row.cancelled, row.order_cancelled, row.product_cancelled, row.item_cancelled].some(enabled) ||
    Boolean(text(row.cancelled_at)) || Boolean(cancellationStatus);
  const itemText = [row.order_fibo_product, row.final_display_for_packer, row.telegram_product_display, row.final_product, row.orderItems, row.product_items_v5, row.customer_change_diff_json, row.customer_change_summary].map(text).join(" ");
  const itemCancellation = /ยกเลิก(?:สินค้า|ออเดอร์|รายการ)|สินค้า.{0,16}(?:ถูกยกเลิก|ยกเลิกแล้ว)|(?:cancelled|canceled)\s+(?:item|product|order)/i.test(itemText);
  if (explicitlyCancelled) {
    add("ORDER_CANCELLED", "BLOCK", "ออเดอร์/สินค้าอยู่ในสถานะยกเลิก — งดส่งจนกว่าจะยืนยันสถานะล่าสุด");
  } else if (itemCancellation) {
    add("ITEM_CANCELLED", "REVIEW", "พบข้อความยกเลิกสินค้าในข้อมูลบิล/ประวัติแก้ไข — ตรวจจำนวนสินค้าปัจจุบัน");
  }

  const stock = firstText(row, ["stock_status", "stock_state", "inventory_status"]).toLowerCase();
  const stockQuantity = text(row.stock_qty);
  if (stock.includes("out") || stock.includes("หมด") || enabled(row.is_out_of_stock) || (stockQuantity !== "" && Number(stockQuantity) === 0)) {
    add("OUT_OF_STOCK", "REVIEW", firstText(row, ["master_stock_notice"]) || "สินค้าอาจหมด — ตรวจ Product Master/สต๊อกก่อนจัด");
  }

  if (enabled(row.change_order_24h) || enabled(row.order_change_detected) || /CHANGE\s*ORDER|แก้ไขออเดอร์/i.test(auditText)) {
    add("CHANGE_ORDER", "REVIEW", "พบการแก้ไขออเดอร์ — เทียบข้อมูลล่าสุดกับก้อนต้นทาง");
  }
  if (enabled(row.duplicate_order_15m) || enabled(row.duplicate_detected) || /DUPLICATE|ยิงออเดอร์ซ้ำ/i.test(auditText)) {
    add("DUPLICATE_ORDER", "REVIEW", "ตรวจพบสัญญาณออเดอร์ซ้ำ — ตรวจประวัติก่อนส่ง");
  }
  if (enabled(row.blacklist) || enabled(row.blacklisted) || /BLACKLIST|แบล็กลิสต์/i.test(auditText)) {
    add("BLACKLIST", "REVIEW", "ลูกค้ามีประวัติแบล็กลิสต์ — ตรวจประวัติก่อนส่ง");
  }

  const product = firstText(row, ["order_fibo_product", "final_display_for_packer", "telegram_product_display", "final_product", "product", "sku"]);
  if (!product || /^(?:ยังไม่มีสินค้า|ไม่พบสินค้า|n\/a|null|undefined)$/i.test(product)) add("PRODUCT_MISSING", "REVIEW", "ไม่พบรายการสินค้า — ตรวจข้อมูลสินค้า/จำนวนก่อนจัด");

  const customerName = firstText(row, ["master_customer_name", "customer_name", "facebook_name", "recipient_name"]);
  if (!customerName) add("NAME_MISSING", "REVIEW", "ไม่มีชื่อผู้รับในข้อมูลออเดอร์");

  const codText = firstText(row, ["cod_amount", "expected_cod"]);
  const cod = Number(codText.replace(/,/g, ""));
  const quantityText = firstText(row, ["total_quantity", "final_order_qty", "quantity", "extracted_qty", "qty"]);
  const quantity = Number(quantityText.replace(/,/g, ""));
  if (!codText || !Number.isFinite(cod)) {
    add("COD_MISSING", "REVIEW", "ยอด COD ว่างหรืออ่านเป็นตัวเลขไม่ได้");
  } else {
    if (cod > 0 && cod < 200) add("COD_LOW", "REVIEW", "ยอด COD ต่ำกว่า 200 บาท — ตรวจยอดก่อนส่ง");
    if (Number.isFinite(quantity) && quantity === 1 && cod > 500) add("COD_QTY_MISMATCH", "REVIEW", "COD สูงกว่า 500 บาททั้งที่จำนวนสินค้าเป็น 1 — ตรวจจำนวน/ยอด");
    if (cod < 0 || cod > 10000) add("COD_ANOMALY", "REVIEW", "ยอด COD ผิดช่วงปกติ — ตรวจข้อมูลก่อนส่ง");
  }
  const codCheck = firstText(row, ["cod_check_status"]).toLowerCase();
  if (/fail|error|mismatch|review|ไม่ตรง|ผิดปกติ/.test(codCheck)) {
    add("COD_CHECK", "REVIEW", `ผลตรวจ COD: ${firstText(row, ["cod_check_status"])}`);
  }

  if ([row.order_summary_status, row.summary_status, row.bot_summary_status].some((status) => text(status).toUpperCase() === "ERROR")) {
    add("BOT_SUMMARY_ERROR", "REVIEW", "บอทสรุปออเดอร์มีสถานะผิดพลาด");
  }

  const linkKey = firstText(row, ["chat_link_key", "chatLinkKey", "upsert_key", "threadId", "thread_id", "order_number"]);
  if (!linkKey) add("LINK_KEY_MISSING", "REVIEW", "ไม่พบคีย์อ้างอิงออเดอร์/แชท");

  return warnings;
}
