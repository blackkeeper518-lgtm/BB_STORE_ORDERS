export type OrderSummaryInput = {
  rawText: string;
  customerName?: string;
  product?: string;
  cod?: string;
  orderNumber?: string;
  productAliases?: Array<{ alias: string; canonicalLabel: string; isActive?: boolean }>;
};

export type OrderSummary = {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  product: string;
  cod: string;
  copyText: string;
  timingMs?: { total: number; parse: number; dataLookup: number; audit: number };
};

function clean(value: string | undefined) {
  return String(value ?? "").replace(/[\t ]+/g, " ").trim();
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return "";
}

function thaiOrderNumber(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "00";
  return `ORD-${get("day")}${get("month")}${get("year")}-${get("hour")}${get("minute")}${get("second")}`;
}

function parseAddress(lines: string[]) {
  return lines.filter(line => {
    if (!line) return false;
    if (/^(ชื่อ|ลูกค้า|ผู้รับ|โทร|เบอร์|phone|tel|cod|ยอด|สินค้า|product|sku|order|เลขที่|หมายเหตุ)\s*[:：]/i.test(line)) return false;
    if (/^0\d{8,9}$/.test(line.replace(/[ -]/g, ""))) return false;
    return true;
  }).join(" ").replace(/\s+/g, " ").trim();
}

const productAliases = [
  { pattern: /(?:เซียร่า|ซีวอส|se[vw]ios)\s*เขียว|se[vw]ios[_ -]?green/i, label: "🟩 SEVIOS_GREEN(ซีวอสเขียว)" },
  { pattern: /เซียร่า\s*แดง|ซีวอส\s*แดง|se[vw]ios[_ -]?red/i, label: "🟥 SEVIOS_RED(ซีวอสแดง)" },
  { pattern: /มอนด์\s*เขียว|mond[_ -]?green/i, label: "🟩 MOND_GREEN(มอนด์เขียว)" },
  { pattern: /มะม่วง/i, label: "🥭 OS_MANGO(มะม่วง)" },
  { pattern: /เมนทอล|menthol/i, label: "🟦 MILANO_MENTHOL(มิลานเมนทอล)" },
  { pattern: /วีส\s*เขียว|vess[_ -]?green/i, label: "🟩 VESS_GREEN(วีสเขียว)" },
];

export type OrderSignalFormat = "compact" | "summary" | "closed";
export type OrderSignalDetection =
  | { detected: false; format: null; orderNumber: null; orderTimeDisplay: null }
  | { detected: true; format: OrderSignalFormat; orderNumber: string | null; orderTimeDisplay: string | null };

/** Classifies confirmed bill-shaped chat text; it does not build or send a live Deck bill. */
export function detectOrderSignal(rawText: unknown): OrderSignalDetection {
  const text = String(rawText ?? "").trim();
  if (!text) return { detected: false, format: null, orderNumber: null, orderTimeDisplay: null };

  const hasCodAmount = /(?:ยอด\s*(?:รวม\s*)?COD|COD|ยอดรวม|เก็บปลายทาง)\s*[:：]?\s*(?:฿\s*)?[\d,]+(?:\.\d+)?/i.test(text);
  const hasProductSection = /รายการสินค้า\s*[:：]?/i.test(text);
  const orderTimeDisplay = text.match(/เวลาสั่งซื้อ\s*[:：]\s*(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)/i)?.[1] ?? null;
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const hasTopBillMarker = /^\s*[^A-Za-zก-๙0-9]*(?:COD\b|ยอดรวม)/i.test(firstLine);
  const hasProductQuantityLine = text.split(/\r?\n/).some(line => {
    if (!/[A-Za-zก-๙]/.test(line) || /^(?:ชื่อ|ลูกค้า|ผู้รับ|โทร|เบอร์|phone|tel|cod|ยอด|ที่อยู่|บ้านเลขที่|หมายเหตุ|ขนส่ง|เวลาสั่งซื้อ|order|เลขที่)\s*[:：]/i.test(line.trim())) return false;
    return /(?:[x×]\s*\d{1,2}(?:\.\d+)?|จำนวน\s*\d{1,2}(?:\.\d+)?|\s(?<!\d)\d{1,2}(?:\.\d+)?\s*(?:คอค|คอต|คอตตอน|กล่อง|ชิ้น|ซอง|แพ็ค|แพ็ก|ขวด|ชุด)?\s*\.?\s*$)/i.test(line);
  });

  const closedOrderNumber = text.match(/(?:เลขที่ออเดอร์|เลขออเดอร์)\s*[:：]\s*(\d{8}-[A-Z0-9]+)/i)?.[1] ?? null;
  if (/ปิดยอดสำเร็จ/i.test(text) && /#\s*BB_ORDER/i.test(text) && hasCodAmount && hasProductSection) {
    return { detected: true, format: "closed", orderNumber: closedOrderNumber, orderTimeDisplay };
  }

  const summaryOrderNumber = text.match(/\b(ORD-\d{6}-\d{6})\b/i)?.[1] ?? null;
  if (/สรุปรายการสั่งซื้อ/i.test(text) && /เวลาสั่งซื้อ/i.test(text) && hasCodAmount && hasProductSection) {
    return { detected: true, format: "summary", orderNumber: summaryOrderNumber, orderTimeDisplay };
  }

  const hasPhone = /\(?0\d{8,9}\)?/.test(text);
  const hasAddress = /บ้านเลขที่|บ้านเอื้ออาทร|ที่อยู่|ส่งที่|อาคาร|ถนน|ซอย|แขวง|เขต|ตำบล|อำเภอ|จังหวัด|(?:^|\s)(?:ต\.|อ\.|จ\.)/im.test(text);
  const hasPostalMarker = /\*{2,}\s*ปณ\s*\*{2,}/i.test(text);
  if (hasTopBillMarker || (hasCodAmount && hasPhone && (hasAddress || hasPostalMarker) && hasProductQuantityLine)) {
    return { detected: true, format: "compact", orderNumber: null, orderTimeDisplay: null };
  }

  return { detected: false, format: null, orderNumber: null, orderTimeDisplay: null };
}

function normalizeProduct(value: string, customAliases: OrderSummaryInput["productAliases"] = []) {
  const quantity = value.match(/(\d+(?:\.\d+)?)\s*(?:คอค|คอต|คอตตอน|กล่อง|ชิ้น)?\s*$/i)?.[1];
  const custom = customAliases.find(alias => alias.isActive !== false && value.toLowerCase().includes(alias.alias.toLowerCase()));
  if (custom) return `${custom.canonicalLabel}${quantity ? ` ${quantity} คอต` : ""}`;
  const match = productAliases.find(alias => alias.pattern.test(value));
  if (!match) return value;
  return `${match.label}${quantity ? ` ${quantity} คอต` : ""}`;
}

function normalizeProducts(value: string, customAliases: OrderSummaryInput["productAliases"] = []) {
  const parts = value
    .split(/\s*(?:\n|,|;|\|)\s*/)
    .map(clean)
    .filter(Boolean);
  return (parts.length > 1 ? parts : [value]).map(part => normalizeProduct(part, customAliases)).join("\n");
}

export function generateOrderSummary(input: OrderSummaryInput, now = new Date()): OrderSummary {
  const rawText = clean(input.rawText);
  const lines = rawText.split(/\r?\n/).map(clean).filter(Boolean);
  const phone = firstMatch(rawText, [/(0\d{8,9})/, /(?:โทร|เบอร์|phone|tel)\s*[:：]?\s*([0-9 -]{9,13})/i]).replace(/[ -]/g, "");
  const inlineName = firstMatch(rawText, [/(?:COD|ยอด(?:รวม)?|ราคา)\s*[:：]?\s*[\d,]+(?:\.\d+)?\s+([ก-๙A-Za-z][^\d]*?)(?=\s*(?:บ้านเลขที่|ที่อยู่|ส่งที่))/i]);
  const customerName = clean(input.customerName) || firstMatch(rawText, [/(?:ชื่อ|ลูกค้า|ผู้รับ|customer)\s*[:：-]\s*([^\n]+)/i]) || inlineName || lines.find(line => /[ก-๙]{2,}/.test(line) && !/(ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|ถนน|หมู่|แขวง|เขต|บ้านเลขที่)/.test(line) && !/\d{5}/.test(line)) || "ไม่ระบุชื่อ";
  const cod = clean(input.cod) || firstMatch(rawText, [/(?:COD|เก็บปลายทาง|ยอด(?:รวม)?|ราคา)\s*[:：]?\s*([\d,]+(?:\.\d+)?)\s*(?:บาท|฿)?/i]) || "ไม่ระบุ";
  const customAliasText = input.productAliases?.find(alias => alias.isActive !== false && rawText.toLowerCase().includes(alias.alias.toLowerCase()))?.alias;
  const productLines = lines.filter(line => /(?:คอต|คอตตอน|กล่อง|ชิ้น|SKU|MOND|CAVALLO|MILANO|SEVIOS|MANGO|GREEN|RED|BLUE|PURPLE|เซียร่า|ซีวอส|มอนด์)/i.test(line));
  const rawProduct = clean(input.product) || firstMatch(rawText, [/(?:สินค้า|product|sku)\s*[:：-]\s*([^\n]+)/i]) || (customAliasText ? rawText : "") || productLines.join(", ") || "ไม่ระบุสินค้า";
  const product = normalizeProducts(rawProduct, input.productAliases);
  const inlineAddress = firstMatch(rawText, [/((?:บ้านเลขที่|ที่อยู่|ส่งที่)\s*[^\n]*?)(?=\s*(?:เบอร์|โทร|มือถือ)\s*[:：]?\s*0|\s*0\d{8,9}\s*$)/i]);
  const address = inlineAddress || parseAddress(lines.filter(line => line !== customerName && !line.replace(/[ -]/g, "").includes(phone)));
  const orderNumber = clean(input.orderNumber) || thaiOrderNumber(now);
  const copyText = [orderNumber, customerName, phone || "ไม่ระบุเบอร์โทร", address || "ไม่ระบุที่อยู่", product, cod === "ไม่ระบุ" ? cod : `${cod} บาท`].join("\n");
  return { orderNumber, customerName, phone, address, product, cod, copyText };
}
