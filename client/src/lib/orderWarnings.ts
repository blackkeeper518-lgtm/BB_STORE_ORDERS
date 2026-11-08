export type OrderWarningSeverity = "BLOCK";
export type OrderWarning = {
  code: "RESTRICTED_AREA";
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

function postalCodeFrom(address: string): string {
  return address.match(/(?:^|\D)(\d{5})(?!\d)/)?.[1] ?? "";
}

/** The UI only surfaces the source-backed restricted-area signal. */
export function getOrderWarnings(value: unknown): OrderWarning[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const row = value as OrderRow;
  const address = firstText(row, [
    "address_fibo_selected_clean", "telegram_primary_address", "final_address_for_bill",
    "address_display_packer", "rescue_address_normalized", "full_address", "addressclean",
    "finalAddress", "short_address", "address",
  ]);
  const zipcode = firstText(row, ["zipcode", "zip_code", "postal_code", "postcode", "postal"]);
  const postal = zipcode.match(/\d{5}/)?.[0] ?? postalCodeFrom(address);
  const province = firstText(row, ["province", "master_province", "shipping_province"]);
  const locationText = `${province} ${address}`.replace(/\s+/g, "");
  const matchedProvince = RESTRICTED_PROVINCES.find(({ name }) => locationText.includes(name));
  const matchedPrefix = RESTRICTED_PROVINCES.find(({ prefix }) => prefix === postal.match(/^\d{2}/)?.[0]);
  const auditText = [row.warning_tag, row.audit_flags, row.auditFlags].map(text).join(" ");
  const sourceMarksRisk = enabled(row.high_risk_area) || enabled(row.risk_area) ||
    /พื้นที่เสี่ยงสูง|RISK\s*AREA|ของโดนขโมย|งดส่งพื้นที่/i.test(auditText);

  if (!matchedProvince && !matchedPrefix && !sourceMarksRisk) return [];
  const place = matchedProvince?.name ?? matchedPrefix?.name ?? province;
  return [{
    code: "RESTRICTED_AREA",
    severity: "BLOCK",
    message: `งดส่ง/พื้นที่เสี่ยง${place ? ` · ${place}` : ""}`,
  }];
}
