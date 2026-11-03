// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// 🎯 BB OrderControl : DATA ROUTE RULES
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// Scope: BB only · อ่านและตรวจออเดอร์
// โต๊ะหลัก: 🗝️HERMES_ARCHIVE
// สินค้า/หัวบิล: ฟิลด์จาก FOUR_SEND_BILL_BUILDER
// หน้าเว็บอ่าน projection ที่ตรงกับ schema ปัจจุบันและใช้ upsert_key เป็นคีย์
// คีย์หลัก: upsert_key · เวลาหลัก: order_time_display
// ที่อยู่สำรอง: address_display_packer
// สถานะส่งใช้ delivery_state · ห้ามลบหลักฐาน · ห้ามเอา ST logic มาปน
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const CONFIG_KEY = "bb-supabase-config";
const TRACKING_CONFIG_KEY = "bb-tracking-supabase-config";
export type Camp = "BB";
export type SupabaseProject = "main" | "tracking";
const DEPLOYMENT_CAMP: Camp = "BB";
export type SupabaseConfig = { url: string; anonKey: string; orderTable?: string };
// Browser connections use public Anon/Publishable keys only; never store service-role keys here.
const DEPLOYMENT_SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const DEPLOYMENT_SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const DEPLOYMENT_TRACKING_URL = String(import.meta.env.VITE_TRACKING_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const DEPLOYMENT_TRACKING_ANON_KEY = String(import.meta.env.VITE_TRACKING_SUPABASE_ANON_KEY ?? "").trim();
const clients: Partial<Record<SupabaseProject, SupabaseClient>> = {};
const clientSignatures: Partial<Record<SupabaseProject, string>> = {};
export function getActiveCamp(): Camp { return DEPLOYMENT_CAMP; }
export function setActiveCamp(_camp: Camp) { for (const project of ["main", "tracking"] as const) { delete clients[project]; delete clientSignatures[project]; } }
function profileKey(_camp: Camp, project: SupabaseProject) { return project === "tracking" ? TRACKING_CONFIG_KEY : CONFIG_KEY; }
export function getSupabaseConfig(camp: Camp = getActiveCamp(), project: SupabaseProject = "main"): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(profileKey(camp, project));
    if (raw) {
      const value = JSON.parse(raw) as Partial<SupabaseConfig>;
      if (value.url && value.anonKey) return { url: value.url.replace(/\/$/, ""), anonKey: value.anonKey, orderTable: project === "main" ? defaultOrderView(camp) : undefined };
    }
  } catch { /* invalid local value; try deployment defaults */ }
  const url = project === "tracking" ? DEPLOYMENT_TRACKING_URL : DEPLOYMENT_SUPABASE_URL;
  const anonKey = project === "tracking" ? DEPLOYMENT_TRACKING_ANON_KEY : DEPLOYMENT_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey, orderTable: project === "main" ? defaultOrderView(camp) : undefined } : null;
}
export function saveSupabaseConfig(config: SupabaseConfig, camp: Camp = getActiveCamp(), project: SupabaseProject = "main") {
  const clean = { url: config.url.trim().replace(/\/$/, ""), anonKey: config.anonKey.trim(), ...(project === "main" ? { orderTable: defaultOrderView(camp) } : {}) };
  localStorage.setItem(profileKey(camp, project), JSON.stringify(clean));
  delete clients[project]; delete clientSignatures[project];
}
export function clearSupabaseConfig(camp: Camp = getActiveCamp(), project: SupabaseProject = "main") {
  localStorage.removeItem(profileKey(camp, project)); delete clients[project]; delete clientSignatures[project];
}
export function getSupabase(project: SupabaseProject = "main") {
  const config = getSupabaseConfig(getActiveCamp(), project);
  if (!config) return null;
  const signature = `${getActiveCamp()}|${config.url}|${config.anonKey}`;
  if (!clients[project] || signature !== clientSignatures[project]) {
    clients[project] = createClient(config.url, config.anonKey);
    clientSignatures[project] = signature;
  }
  return clients[project] ?? null;
}
export function subscribeToChatMessages(onChange: () => void) {
  const api = getSupabase("tracking");
  if (!api) return () => undefined;
  const channel = api
    .channel(`chat-live-${getActiveCamp().toLowerCase()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "chat_customer_messages" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "chat_page_messages" }, onChange)
    .subscribe();
  return () => { void api.removeChannel(channel); };
}
const CHAT_HISTORY_DAYS = 2;
function chatHistoryCutoff() { return new Date(Date.now() - CHAT_HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString(); }
export const supabase = { from: (table: string) => { const api = getSupabase(); if (!api) throw new Error("ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key"); return api.from(table); } } as any;
function fail(error: any): never { throw new Error(error?.message || "Supabase connection failed"); }
function num(v: any) { const n = Number(v); return v == null || v === "" || !Number.isFinite(n) ? null : n; }
function asText(v: any) { return typeof v === "string" ? v : v == null ? "" : JSON.stringify(v); }
function parseCod(text: string) { const matches = text.match(/(?:ยอดรวม\s*)?cod\s*[:=]?\s*\[?\s*([\d,]+(?:\.\d+)?)\s*\]?|เก็บปลายทาง[^\d]{0,20}([\d,]+(?:\.\d+)?)/gi) || []; const last = matches[matches.length - 1] || ""; const numberMatch = last.match(/[\d,]+(?:\.\d+)?/); return numberMatch ? Number(numberMatch[0].replace(/,/g, "")) : null; }
export function hasCodOrderSignal(text: unknown) { return /\bCOD\b/i.test(String(text ?? "")); }
function scoreDailyOrderSignal(text: string, latestCod: number | null) {
  const qualified = hasCodOrderSignal(text);
  return {
    score: qualified ? 1 : 0,
    qualified,
    qualifiedCod: qualified && latestCod != null && latestCod >= 200,
    reasons: qualified ? ["คำว่า COD"] : [],
    coreCount: 0,
    flowCount: 0,
  };
}
export type CanonicalItem = Record<string, any>;
export type CanonicalOrder = Record<string, any> & { items: CanonicalItem[]; items_text: string; display_for_packer: string | null; is_ready_to_pack: boolean; cod_check_status: string | null; audit_status: string | null; order_status: string | null; telegram_status: string | null };
const ORDER_SOURCE_TABLE_BY_CAMP: Record<Camp, string> = { BB: "🗝️HERMES_ARCHIVE" };
// Order screens load at most 1,000 rows per explicit refresh.
const ORDER_OPERATIONAL_LIMIT = 1000;
function defaultOrderView(camp: Camp) { return ORDER_SOURCE_TABLE_BY_CAMP[camp]; }
function currentOrderWindowStart() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)])); return new Date(Date.UTC(values.year, values.month - 1, values.day - 1, 7, 0, 0)).toISOString(); }
function normalizeItem(item: CanonicalItem): CanonicalItem { const master = item.product_master && typeof item.product_master === "object" ? item.product_master : {}; const display = String(item.bb_pack_center ?? "").trim() || null; const mapping = item.mapping_status || (item.sku_match_status === "MATCHED_PRODUCT_MASTER" ? "MATCHED" : null); return { ...item, ...master, quantity: num(item.quantity ?? item.extracted_qty ?? item.qty ?? item.master_qty_display ?? item.master_quantity), unit_price: num(item.unit_price_order ?? item.unit_price ?? master.unit_price), expected_cod: num(item.expected_cod), stock_qty: num(item.stock_qty ?? item.inventory?.stock_qty), mapping_status: mapping, display_for_packer: display, label: display, label_display: display }; }
function parseJsonArray(value: unknown): CanonicalItem[] { if (Array.isArray(value)) return value as CanonicalItem[]; if (typeof value !== "string") return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function orderLocalTimestamp(row: any): string | null {
  const dateText = String(row.order_date || row.date_th || "");
  const timeText = String(row.time_th || "");
  const dateMatch = dateText.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  const timeMatch = timeText.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!dateMatch || !timeMatch) return null;
  const day = Number(dateMatch[1]); const month = Number(dateMatch[2]);
  let year = Number(dateMatch[3]); if (year < 100) year += 2000; if (year > 2400) year -= 543;
  const hour = Number(timeMatch[1]); const minute = Number(timeMatch[2]); const second = Number(timeMatch[3] || 0);
  if (![day, month, year, hour, minute, second].every(Number.isFinite)) return null;
  // Bangkok local time represented as UTC ISO: 14 Sep 21:00 +07 = 14 Sep 14:00Z.
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second)).toISOString();
}
function effectiveOrderTime(row: any): string | null {
  // กฎ BB: เวลาของออเดอร์มาจาก order_time_display เท่านั้น ห้าม fallback ไปเวลาอื่น
  return row.order_time_display || null;
}
function displayOrderSortKey(value: unknown): number {
  const match = String(value ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let year = Number(match[3]);
  if (year < 100) year = 1957 + year; // Thai short year: 69 = 2026
  else if (year > 2400) year -= 543;
  return Number(`${year}${match[2].padStart(2, "0")}${match[1].padStart(2, "0")}${match[4].padStart(2, "0")}${match[5]}`);
}
function displayDateKey(value: unknown): string {
  const match = String(value ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return "";
  let year = Number(match[3]);
  if (year < 100) year = 1957 + year;
  else if (year > 2400) year -= 543;
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}
function isoDateKey(value: string | null): string {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return values.year && values.month && values.day ? `${values.year}-${values.month}-${values.day}` : "";
}
function normalizeOrder(row: any, items: CanonicalItem[]): CanonicalOrder { const normalized = items.map(normalizeItem); const cod = num(row.cod_amount); const mapping = row.alien_mapping_status || row.web_mapping_status || row.mapping_status || (normalized.length > 0 && normalized.every(item => item.mapping_status === "MATCHED") ? "MATCHED" : "CHECK_DATA"); const address = row.master_delivery_address || row.address_complete_web || row.web_address_primary || row.address_display_primary || row.full_address || row.address_display_packer || row.addressclean || row.address_display_fallback || row.web_address_fallback || row.web_address_short || [row.address_line_1, row.address_line_2, row.district, row.amphoe, row.province, row.zipcode].filter(Boolean).join(" ") || ""; const productDisplay = String(row.bb_pack_center ?? "").trim() || null; return { ...row, full_address: address, customer_name: row.customer_name, phone: row.phone || row.extracted_phone, address_display_primary: row.web_address_primary || row.address_display_primary || address, address_display_fallback: row.web_address_fallback || row.address_display_fallback || address, items: normalized, mapping_status: mapping, order_number: row.order_number || row.order_number_display || `#${row.upsert_key || "UNKNOWN"}`, order_time: effectiveOrderTime(row), cod_amount: cod, is_ready_to_pack: row.is_ready_to_pack ?? (mapping === "MATCHED"), cod_check_status: row.cod_check_status || (cod == null ? "CHECK" : "PASS"), audit_status: row.alien_audit_status || row.audit_status || mapping, telegram_status: row.telegram_status ?? null, items_text: productDisplay || "", display_for_packer: productDisplay }; }
// Projection aligned to FOUR_SEND_BILL_BUILDER and the applied HERMES schema.
// Keep only known columns; upsert_key is the row key (the table has no id column).
const HERMES_WEB_ORDER_COLUMNS = [
  "upsert_key",
  "bb_express_send_route",
  "currentThreadTotalBills",
  "duplicate_count_th",
  "balloonNotice",
  "sniperAuthorClass",
  "facebook_name",
  "threadId",
  "time_th",
  "customer_id",
  "tracking_request_same_thai_date",
  "tracking_request_route_hint",
  "order_date",
  "order_time",
  "order_time_display",
  "day_of_week",
  "order_time_source",
  "page_id",
  "page_name",
  "order_number",
  "cod_amount",
  "customer_name",
  "phone",
  "extracted_phone",
  "phone_type",
  "phone_status",
  "phone_candidates",
  "rejected_phone_candidates",
  "address_display_packer",
  "addressclean",
  "finalAddress",
  "short_address",
  "district",
  "amphoe",
  "province",
  "zipcode",
  "order_source_type",
  "audit_flags",
  "chat_timeline",
  "cod_check_status",
  "shipping_carrier",
  "assigned_agent",
  "assigned_hashtag",
  "original",
  "orderItems",
  "for_packer_st_display",
  "sku",
  "google_for_packer",
  "manus_for_packer",
  "final_order_qty",
  "extracted_text_qty",
  "qty_display_th",
  "darksideBillDataComplete",
  "bill_data_complete",
  "darkside_completeness_status",
  "darkside_missing_reasons",
  "bill_data_reason",
  "bill_signal_source",
  "bill_quantity_is_blocker",
  "route_reason_emoji",
  "route_reason_color",
  "route_reason_label",
  "packer_obj",
  "extracted_text_price",
  "is_salty_gold",
  "fibo_score",
  "fibo_tier",
  "fibo_badge",
  "mathematically_price",
  "final_order_price",
  "is_vip",
  "vip_tag",
  "order_time_ms_reference",
  "order_time_bkk_iso",
  "order_time_thai_date",
  "order_time_thai_clock",
  "order_time_thai_label",
  "order_time_contract_locked",
  "tracking_request_48h",
  "tracking_request_48h_event",
  "node2_tracking_request_detected",
  "node2_tracking_request_48h",
  "node2_tracking_request_event",
  "node2_tracking_request_route_hint",
  "product_items_v5",
  "product_map_sku_list",
  "product_map_master_sku_list",
  "order_fibo_product",
  "packer_tag_display",
  "final_product",
  "final_display_for_packer",
  "telegram_product_display",
  "telegram_message",
  "telegram_main_bill",
  "telegram_copy_text",
  "telegram_body",
  "telegram_change_alert",
  "customer_change_diff_json",
  "customer_change_admin_footer",
  "customer_change_admin_footer_text",
  "customer_change_audit_group_key",
  "customer_change_audit_is_current",
  "customer_change_current_time",
  "customer_change_current_upsert_key",
  "customer_change_previous_time",
  "customer_change_previous_upsert_key",
  "pre_save_change_group_key",
  "pre_save_change_selected",
  "customer_address_current",
  "customer_address_previous",
  "customer_name_current",
  "customer_name_previous",
  "customer_phone_current",
  "customer_phone_previous",
  "customer_product_current",
  "customer_product_previous",
  "source_table",
  "stock_notice",
  "order_number_display",
  "full_address",
  "final_address_for_bill",
  "address_fibo_selected_clean",
  "is_ready_to_pack",
  "send_eligible",
  "telegram_bill_send_eligible",
  "telegram_status",
  "delivery_state",
  "delivery_status",
  "telegram_sent",
  "telegram_sent_at",
  "sent_at",
  "life_status",
  "status_color",
  "routing_tag",
  "product_mapping_status",
  "mapping_status",
  "telegram_message_for_send_final",
  "customer_change_summary",
  "raw_text",
  "recipient_id",
  "expected_cod",
  "telegram_bill_header"
].join(",");

function parseJsonRecord(value: unknown): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === "string" && value.trim()) {
    try { const parsed = JSON.parse(value); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed; } catch { /* text field, not JSON */ }
  }
  return {};
}
function firstText(...values: unknown[]): string {
  return values.map(value => String(value ?? "").trim()).find(Boolean) ?? "";
}
function plainTelegramText(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function asBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  return ["true", "t", "1", "yes", "ใช่"].includes(String(value ?? "").trim().toLowerCase());
}
function normalizeBbDirectRow(row: any): CanonicalOrder {
  const packer = parseJsonRecord(row.packer_obj);
  const product = firstText(row.order_fibo_product, row.for_packer_st_display, row.manus_for_packer,
    row.google_for_packer, row.packer_tag_display,
    packer.order_fibo_product, packer.for_packer_st_display, packer.manus_for_packer,
    packer.google_for_packer, packer.packer_tag_display);
  const address = firstText(row.address_fibo_selected_clean, row.telegram_primary_address,
    row.address_display_packer, row.rescue_address_normalized, row.full_address,
    packer.address_fibo_selected_clean, packer.telegram_primary_address,
    packer.address_display_packer, packer.rescue_address_normalized, packer.full_address);
  const ready = asBoolean(row.is_ready_to_pack ?? row.bill_data_complete);
  const deliveryState = firstText(row.delivery_state, row.delivery_status);
  return normalizeOrder({
    ...row,
    order_number: firstText(row.order_number_display, row.order_number) || `#${row.upsert_key || "UNKNOWN"}`,
    phone: firstText(row.extracted_phone, row.phone),
    extracted_phone: firstText(row.extracted_phone, row.phone),
    packer_obj: packer,
    normalized_chat_timeline: row.chat_timeline ?? null,
    telegram_copy_text: row.telegram_copy_text ?? null,
    bb_pack_center: product || null,
    for_packer_bb_display: product || null,
    master_delivery_address: address,
    address_complete_web: address,
    web_address_primary: address,
    web_address_fallback: address,
    address_display_primary: address,
    address_display_packer: address,
    full_address: address,
    stock_notice: firstText(row.bill_header_playful, row.telegram_bill_header, row.product_master_stock_notice) || null,
    telegram_body: parseJsonRecord(row.telegram_body),
    telegram_status: deliveryState || null,
    telegram_sent: ["SENT", "DELIVERED", "SENT_TO_TELEGRAM"].includes(deliveryState.toUpperCase()),
    shipping_method: row.shipping_carrier || "⚡FLASH EXPRESS",
    is_ready_to_pack: ready,
    mapping_status: ready ? "MATCHED" : row.mapping_status || null,
  }, []);
}

function productMasterSku(row: any): string {
  return String(row.master_sku ?? row.sku ?? row.product_sku ?? row.product_code ?? row.code ?? "").trim();
}
function cleanProductDisplay(value: unknown): string {
  return String(value ?? "").trim().replace(/\s*(?:\bx|×|(?:จำนวน|qty)\s*)\s*\d+(?:\.\d+)?\s*(?:คอต\.?|กล่อง|ซอง|ชิ้น|ลัง)?\s*$/i, "").trim();
}
function productLineFromOrder(row: any, sku: string): string {
  const lines = String(row.telegram_copy_text ?? "").split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean);
  return lines.find((line: string) => /(?:\bx|×|(?:จำนวน|qty)\s*)\s*\d+(?:\.\d+)?/i.test(line))
    ?? lines.find((line: string) => sku && line.toLowerCase().includes(sku.toLowerCase()))
    ?? "";
}
function quantityFromOrder(row: any, productLine: string, productDisplay: string): number | null {
  const packer = parseJsonRecord(row.packer_obj);
  for (const value of [row.quantity, row.qty, row.extracted_qty, packer.quantity, packer.qty, packer.extracted_qty]) {
    const quantity = num(value);
    if (quantity != null) return quantity;
  }
  const sources = [productLine, productDisplay, row.order_fibo_product, row.for_packer_st_display,
    row.manus_for_packer, row.google_for_packer, row.packer_tag_display, row.telegram_copy_text];
  for (const source of sources) {
    const match = String(source ?? "").match(/(?:\bx|×|(?:จำนวน|qty)\s*)\s*(\d+(?:\.\d+)?)/i);
    if (match) return num(match[1]);
  }
  return null;
}

export async function readCanonicalOrders(search = "", since: string | null = null, until: string | null = null) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });

  const limit = ORDER_OPERATIONAL_LIMIT;
  const ordersResult = await api.from("🗝️HERMES_ARCHIVE")
    .select(HERMES_WEB_ORDER_COLUMNS)
    .order("order_time_display", { ascending: false })
    .limit(limit);
  const masterResult = await api.from("🛒product_master").select("*").limit(1500);
  if (ordersResult.error) fail(ordersResult.error);

  // Product Master is supplementary: if its read policy is not configured yet,
  // keep HERMES orders visible and use the product text stored on the bill.
  const masterBySku = new Map<string, any>();
  for (const master of (masterResult.error ? [] : masterResult.data ?? [])) {
    const key = productMasterSku(master).toLowerCase();
    if (key && !masterBySku.has(key)) masterBySku.set(key, master);
  }

  const query = search.trim().toLowerCase();
  const fromKey = isoDateKey(since);
  const untilKey = isoDateKey(until);
  const orders = (ordersResult.data ?? [])
    .map((row: any) => {
      const normalized = normalizeBbDirectRow(row);
      const packer = parseJsonRecord(row.packer_obj);
      const sku = firstText(row.sku, row.extracted_sku, packer.sku).split(/[\n,|]+/)[0].trim();
      const master = masterBySku.get(sku.toLowerCase());
      const productLine = productLineFromOrder(row, sku);
      const fields = [row.for_packer_st_display, row.manus_for_packer, row.google_for_packer,
        row.packer_tag_display, packer.for_packer_st_display, packer.manus_for_packer,
        packer.google_for_packer, packer.packer_tag_display, row.order_fibo_product, packer.order_fibo_product]
        .map((value: unknown) => String(value ?? "").trim()).filter(Boolean);
      const richField = fields.find((value: string) => cleanProductDisplay(value).toLowerCase() !== sku.toLowerCase());
      const masterDisplay = firstText(master?.master_display_for_packer, master?.display_for_packer,
        master?.name_standard, master?.th_name, master?.product_name);
      const display = cleanProductDisplay(productLine) || cleanProductDisplay(richField)
        || masterDisplay || sku || normalized.display_for_packer || null;
      const quantity = quantityFromOrder(row, productLine, display || "");
      const unitPrice = num(row.unit_price ?? packer.unit_price) ?? num(master?.unit_price) ?? normalized.unit_price ?? null;
      return {
        ...normalized,
        sku: sku || normalized.sku || null,
        th_name: firstText(master?.th_name, master?.name_standard, master?.product_name, normalized.th_name) || null,
        emoji: firstText(master?.emoji, normalized.emoji) || "📦",
        display_for_packer: display,
        bb_pack_center: display,
        quantity: quantity ?? normalized.quantity ?? null,
        unit_price: unitPrice,
      } as CanonicalOrder;
    })
    .filter((row: any) => {
      if (query && !JSON.stringify(row).toLowerCase().includes(query)) return false;
      const dateKey = displayDateKey(row.order_time_display);
      return (!fromKey || (dateKey && dateKey >= fromKey)) && (!untilKey || (dateKey && dateKey <= untilKey));
    });
  orders.sort((a, b) => displayOrderSortKey(b.order_time_display) - displayOrderSortKey(a.order_time_display));
  return { orders, itemError: null, sourceTable: "🗝️HERMES_ARCHIVE", fetchedAt: new Date().toISOString(), since };
}
export async function readTelegramDeliveryOrders(search = "", room: "queue" | "today" | "yesterday_after_14" | "sent" = "queue") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });

  const sourceTable = room === "sent" ? "🌟GENESIS_xXx_HISTORY" : "🛰️PIONEER_xXx_CAPSULE";
  const { data, error } = await api
    .from(sourceTable)
    .select("*")
    .order("order_time_display", { ascending: false })
    .limit(ORDER_OPERATIONAL_LIMIT);
  if (error) fail(error);
  const query = search.trim().toLowerCase();
  const allOrders = (data ?? [])
    .map((row: any) => ({ ...normalizeBbDirectRow(row), source_view: sourceTable, source_table: row.source_table || sourceTable }) as CanonicalOrder)
    .filter((row: any) => !query || JSON.stringify(row).toLowerCase().includes(query));
  const orders = allOrders.sort((a, b) => displayOrderSortKey(b.order_time_display) - displayOrderSortKey(a.order_time_display));
  return { orders, itemError: null, sourceTable, fetchedAt: new Date().toISOString(), room };
}

export async function readBbOrderEvidence(upsertKey: string) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api
    .from(defaultOrderView("BB"))
    .select("upsert_key,chat_timeline,customer_change_diff_json,telegram_copy_text")
    .eq("upsert_key", upsertKey)
    .maybeSingle();
  if (error) fail(error);
  const row: any = data ?? {};
  return { ...row, normalized_chat_timeline: row.chat_timeline ?? null, telegram_copy_text: row.telegram_copy_text ?? null };
}

export async function readBbOrderEvidenceBatch(upsertKeys: string[]) {
  const keys = Array.from(new Set(upsertKeys.map((key) => String(key ?? "").trim()).filter(Boolean)));
  if (!keys.length) return [];
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const evidence: any[] = [];
  for (let offset = 0; offset < keys.length; offset += 100) {
    const { data, error } = await api
      .from(defaultOrderView("BB"))
      .select("upsert_key,chat_timeline,customer_change_diff_json,telegram_copy_text")
      .in("upsert_key", keys.slice(offset, offset + 100));
    if (error) fail(error);
    evidence.push(...(data ?? []).map((row: any) => ({ ...row, normalized_chat_timeline: row.chat_timeline ?? null, telegram_copy_text: row.telegram_copy_text ?? null })));
  }
  return evidence;
}

export async function readBbAlertRoom(search = "") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from("🌀SINGULARITY_xXx_EXCHANGE").select("*").order("order_time_display", { ascending: false }).limit(2000);
  if (error) fail(error);
  const query = search.trim().toLowerCase();
  const rows = (data ?? []).map((row: any) => {
    const changes = [
      ["สินค้า", row.customer_product_change_detected, row.customer_product_previous, row.customer_product_current],
      ["สี", row.customer_color_change_detected, row.customer_color_previous, row.customer_color_current],
      ["จำนวน", row.customer_quantity_change_detected, row.customer_quantity_previous, row.customer_quantity_current],
      ["ขนส่ง", row.customer_carrier_change_detected, row.customer_carrier_previous, row.customer_carrier_current],
      ["ที่อยู่", row.customer_address_change_detected, row.customer_address_previous, row.customer_address_current],
      ["เบอร์", row.customer_phone_change_detected, row.customer_phone_previous, row.customer_phone_current],
      ["ชื่อ", row.customer_name_change_detected, row.customer_name_previous, row.customer_name_current],
      ["COD", row.customer_cod_change_detected, row.customer_cod_previous, row.customer_cod_current],
    ].filter(([, detected, before, after]) => asBoolean(detected) || (String(before ?? "").trim() && String(after ?? "").trim()));
    const stamp = row.order_time_display;
    const changeText = plainTelegramText(firstText(row.telegram_change_alert_web, row.telegram_change_alert, row.customer_change_summary, row.customer_change_admin_footer_text));
    return {
      ...row,
      id: row.upsert_key,
      person_key: row.phone || row.customer_id || row.threadId,
      alert_status: "PRODUCT_CHANGE_HISTORY",
      customer_bill_count: row.currentThreadTotalBills || 1,
      cod_value: row.cod_amount,
      customer_cod_total: null,
      is_bot_summary: false,
      duplicate_signature_count: 1,
      changed_from: changes.map(([label, , before]) => `${label}: ${String(before || "เดิม")}`).join("\n"),
      changed_to: changes.map(([label, , , after]) => `${label}: ${String(after || "ใหม่")}`).join("\n"),
      change_decision_minutes: row.change_decision_minutes,
      last_chat_at: stamp,
      last_chat_text: changeText || changes.map(([label]) => `${label}มีการเปลี่ยนแปลง`).join(" · "),
      chat_message_count: 0,
      telegram_actual_bill: firstText(row.telegram_message_web, plainTelegramText(firstText(row.telegram_message_for_send_final, row.telegram_message, row.telegram_main_bill, row.telegram_copy_text))),
      telegram_send_status: row.telegram_status || row.delivery_status || row.telegram_sent,
    };
  }).filter((row: any) => row.changed_from || row.changed_to || asBoolean(row.customer_change_detected) || Boolean(String(row.telegram_change_alert_web || row.telegram_change_alert || "").trim()));
  return rows
    .filter((row: any) => !query || JSON.stringify(row).toLowerCase().includes(query))
    .sort((a: any, b: any) => displayOrderSortKey(b.order_time_display) - displayOrderSortKey(a.order_time_display));
}

export async function updateBbOrder(upsertKey: string | number, patch: Record<string, unknown>) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from(defaultOrderView("BB")).update(patch).eq("upsert_key", String(upsertKey)).select("upsert_key");
  if (error) fail(error);
  if (!data?.length) fail({ message: `ไม่พบออเดอร์ upsert_key=${upsertKey} หรือสิทธิ์ RLS ไม่อนุญาตให้อัปเดต` });
  if (data.length > 1) fail({ message: `พบออเดอร์ซ้ำ ${data.length} แถวด้วย upsert_key=${upsertKey}` });
  return data[0];
}
export async function updateBbOrderByKey(upsertKey: string, patch: Record<string, unknown>, sourceTable: "🗝️HERMES_ARCHIVE" | "🌀SINGULARITY_xXx_EXCHANGE" = "🗝️HERMES_ARCHIVE") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from(sourceTable).update(patch).eq("upsert_key", upsertKey).select("upsert_key");
  if (error) fail(error);
  if (!data?.length) fail({ message: `ไม่พบออเดอร์ upsert_key=${upsertKey} หรือสิทธิ์ RLS ไม่อนุญาตให้อัปเดต` });
  if (data.length > 1) fail({ message: `พบ upsert_key ซ้ำ ${data.length} แถว ต้องตรวจข้อมูลก่อนแก้ไข` });
  return data[0];
}

export type StockProduct = { id: number; sku: string; label: string; thName: string; emoji: string; price: number | null; stockQty: number; stockStatus: string | null; outOfStockJoke: string | null; stockNotice: string | null; aliases: string; inventoryId: number | string | null };
export type ProductMapAlias = { id: string; alias: string; canonicalSku: string; canonicalLabel: string; isActive: boolean };

export async function readProductMapAliases(): Promise<ProductMapAlias[]> {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const [{ data: rows, error }, { data: products, error: productError }] = await Promise.all([
    api.from("product_map_master").select("*").order("sku"),
    api.from("🛒product_master").select("sku,label_display,display_for_packer,name_standard,th_name,product_name,emoji,unit_price").order("sku")
  ]);
  if (error) fail(error);
  if (productError) fail(productError);
  const masters = new Map((products ?? []).map((p: any) => [String(p.sku ?? '').trim().toLowerCase(), p]));
  const output: ProductMapAlias[] = [];
  for (const row of rows ?? []) {
    const sku = String(row.sku ?? '').trim();
    const master = masters.get(sku.toLowerCase()) ?? {};
    const aliases = [row.alias, row.alias_text].flatMap((v: any) => String(v ?? '').split(/[,\n|]+/)).map((v: string) => v.trim()).filter(Boolean);
    for (const alias of Array.from(new Set(aliases))) output.push({ id: String(row.id ?? sku + ':' + alias), alias, canonicalSku: sku, canonicalLabel: master.label_display ?? master.display_for_packer ?? master.name_standard ?? master.th_name ?? master.product_name ?? sku, isActive: row.is_active !== false });
  }
  return output;
}

export async function readProductMapCatalog() {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from("🛒product_master").select("sku,label_display,display_for_packer,name_standard,th_name,product_name,emoji,unit_price").order("sku");
  if (error) fail(error);
  return (data ?? []).map((p: any) => ({ sku: String(p.sku ?? ''), label: p.label_display ?? p.display_for_packer ?? p.name_standard ?? p.th_name ?? p.product_name ?? p.sku ?? '', emoji: p.emoji ?? '📦', price: num(p.unit_price) }));
}

export async function saveProductMapAlias(input: { alias: string; canonicalSku: string }) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const alias = input.alias.trim(); const sku = input.canonicalSku.trim();
  if (!alias || !sku) throw new Error('ต้องมี Alias และ SKU');
  const { data: existing, error: readError } = await api.from('product_map_master').select('*').eq('sku', sku).maybeSingle();
  if (readError) fail(readError);
  const old = [existing?.alias, existing?.alias_text].flatMap((v: any) => String(v ?? '').split(/[,\n|]+/)).map((v: string) => v.trim()).filter(Boolean);
  const aliases = Array.from(new Set([...old, alias]));
  const payload: any = { sku, alias: aliases.join(', '), alias_text: aliases.join(', '), alias_norm: aliases.map(v => v.toLowerCase().replace(/\s+/g, '')).join(', ') };
  const result = existing?.id != null ? await api.from('product_map_master').update(payload).eq('id', existing.id) : await api.from('product_map_master').insert(payload);
  if (result.error) fail(result.error);
  return { sku, alias, aliases };
}

export async function readStockProducts(): Promise<StockProduct[]> {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  // Stock Room is intentionally a Product Master room for now.
  // It does not read inventory and it never deducts stock from orders.
  const { data: products, error } = await api.from("🛒product_master").select("*").order("master_sku");
  if (error) fail(error);
  return (products ?? []).map((p: any) => {
    const sku = String(p.master_sku ?? p.sku ?? "").trim();
    const stockQty = num(p.stock_qty) ?? 0;
    return {
      id: Number(p.id),
      sku,
      label: p.master_display_for_packer ?? p.display_for_packer ?? p.name_standard ?? p.th_name ?? sku,
      thName: p.th_name ?? p.name_standard ?? "",
      emoji: p.emoji ?? "📦",
      price: num(p.unit_price),
      stockQty,
      stockStatus: p.stock_status ?? (stockQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK"),
      outOfStockJoke: null,
      stockNotice: p.stock_notice ?? null,
      aliases: String(p.alias ?? ""),
      inventoryId: null,
    };
  });
}

export async function updateInventoryStock(input: { productId: number; sku: string; stockQty: number; stockStatus?: "IN_STOCK" | "OUT_OF_STOCK" }) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const stockQty = Math.max(0, Math.trunc(Number(input.stockQty) || 0));
  const stockStatus = input.stockStatus ?? (stockQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK");
  const { error } = await api.from("🛒product_master").update({ stock_qty: stockQty, stock_status: stockStatus, updated_at: new Date().toISOString() }).eq("id", input.productId);
  if (error) fail(error);
  return { ...input, stockQty, stockStatus };
}

export async function setInventoryAvailability(input: { productId: number; sku: string; available: boolean; currentQty: number }) {
  return updateInventoryStock({
    ...input,
    stockQty: input.available ? Math.max(1, input.currentQty || 1) : 0,
    stockStatus: input.available ? "IN_STOCK" : "OUT_OF_STOCK",
  });
}

export async function readDailyOrders(date: string, search = "") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from("💀THANATOS_xXx_DEATH_NOTE")
    .select("*")
    .order("order_time_display", { ascending: false })
    .limit(10000);
  if (error) fail(error);

  const query = search.trim().toLowerCase();
  const orders = (data ?? []).map((row: any) => {
    const product = row.final_display_for_packer || row.display_for_packer || row.product_map_mapped_display
      || row.product_map_display || row.for_packer_st_display || row.manus_for_packer || row.google_for_packer
      || row.order_fibo_product || row.telegram_product_display || row.telegram_copy_text || row.original || "";
    const orderTime = row.order_time_bkk_iso || row.order_time || row.order_time_display || row.order_date || null;
    return {
      ...row,
      id: row.id ?? row.upsert_key,
      order_number: row.order_number_display || row.order_number || row.upsert_key,
      customer_name: row.customer_name || row.facebook_name,
      phone: row.phone || row.extracted_phone,
      full_address: row.final_address_for_bill || row.full_address || row.finalAddress || row.address_display_packer || row.addressclean,
      sku: row.master_sku || row.product_map_sku || row.sku,
      display_for_packer: product,
      lab_product_display_text: product,
      cod_amount: row.cod_amount ?? row.expected_cod,
      order_time: orderTime,
      thread_id: row.thread_id || row.threadId,
      mapping_status: row.mapping_status || row.product_map_status || row.canonical_status,
      review_status: row.darkside_completeness_status || row.canonical_status || row.change_status,
    };
  }).filter((row: any) => {
    const displayKey = displayDateKey(row.order_time_display);
    const dateKey = displayKey || isoDateKey(row.order_time_bkk_iso || row.order_time || row.order_date || null);
    if (dateKey !== date) return false;
    return !query || JSON.stringify(row).toLowerCase().includes(query);
  });
  return { orders, total: orders.length, sourceTable: "💀THANATOS_xXx_DEATH_NOTE", fetchedAt: new Date().toISOString() };
}
export async function readDailyParcels(date: string, search = "") {
  const api = getSupabase("tracking");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const parsedDate = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parsedDate) return { parcels: [], total: 0, sourceTable: "parcels", fetchedAt: new Date().toISOString() };
  const todayKey = isoDateKey(new Date().toISOString());
  const earliestKey = isoDateKey(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
  if (date < earliestKey || date > todayKey) return { parcels: [], total: 0, sourceTable: "parcels", fetchedAt: new Date().toISOString() };
  const [, year, month, day] = parsedDate;
  const yearNumber = Number(year);
  const thaiYearShort = String((yearNumber - 1957) % 100).padStart(2, "0");
  const thaiYear = String(yearNumber + 543);
  const prefixes = Array.from(new Set([
    `${year}-${month}-${day}`,
    `${day}/${month}/${thaiYearShort}`,
    `${Number(day)}/${Number(month)}/${thaiYearShort}`,
    `${day}/${month}/${year}`,
    `${Number(day)}/${Number(month)}/${year}`,
    `${day}/${month}/${thaiYear}`,
    `${Number(day)}/${Number(month)}/${thaiYear}`,
  ]));
  const dateFilter = prefixes.map(prefix => `pickup_date.ilike.${prefix}%`).join(",");
  const { data, error } = await api.from("parcels")
    .select("id,pickup_date,tracking_number,consignee,phone_number,address,cod_amount,order_phone,order_number,delivery_status,sent_at")
    .or(dateFilter)
    .order("pickup_date", { ascending: false })
    .limit(2000);
  if (error) fail(error);
  const query = search.trim().toLowerCase();
  const toDateKey = (value: unknown) => {
    const raw = String(value ?? "").trim();
    const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
    const thai = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (thai) {
      let year = Number(thai[3]);
      if (year < 100) year += 1957;
      else if (year > 2400) year -= 543;
      return `${year}-${thai[2].padStart(2, "0")}-${thai[1].padStart(2, "0")}`;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? "" : isoDateKey(parsed.toISOString());
  };
  const parcels = (data ?? []).filter((row: any) => {
    if (toDateKey(row.pickup_date) !== date) return false;
    return !query || JSON.stringify(row).toLowerCase().includes(query);
  });
  return { parcels, total: parcels.length, sourceTable: "parcels", fetchedAt: new Date().toISOString() };
}
async function readChatRows() {
  const api = getSupabase("tracking");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วกรอก URL และ Anon Key" });
  // Read the newest window first. Ascending + limit would permanently return
  // the oldest rows once a chat table grows beyond the limit.
  const cutoff = chatHistoryCutoff();
  const [customerResult, pageResult] = await Promise.all([
    api.from("chat_customer_messages").select("*").gte("occurred_at", cutoff).order("occurred_at", { ascending: false }).limit(10000),
    api.from("chat_page_messages").select("*").gte("occurred_at", cutoff).order("occurred_at", { ascending: false }).limit(10000),
  ]);
  if (customerResult.error) fail(customerResult.error);
  const customers = customerResult.data ?? [];
  const pages = pageResult.error ? [] : (pageResult.data ?? []);
  const rows = [
    ...customers.map((r: any) => ({ ...r, _speaker: r.speaker_type || r.speaker || "customer", _side: r.side || "left", _name: r.customer_name || r.sender_name, _text: asText(r.message_text ?? r.message_raw), _thread: r.thread_id || r.conversation_key || r.conversation_id, _occurred: r.occurred_at || r.time || r.created_at, _hasAttachment: Boolean(r.has_attachment || r.attachments?.length || r.attachments_json?.length) })),
    ...pages.map((r: any) => ({ ...r, _speaker: r.speaker_type || r.speaker || "page", _side: r.side || "right", _name: r.page_sender_name || r.sender_name, _text: asText(r.message_text ?? r.message_raw), _thread: r.thread_id || r.conversation_key || r.conversation_id, _occurred: r.occurred_at || r.time || r.created_at, _hasAttachment: Boolean(r.has_attachment || r.attachments?.length || r.attachments_json?.length) })),
  ];
  return rows.sort((a, b) => new Date(a._occurred || a.occurred_at || a.synced_at || 0).getTime() - new Date(b._occurred || b.occurred_at || b.synced_at || 0).getTime());
}
export function orderThreadAliases(order: any): string[] {
  return Array.from(new Set([order.thread_id, order.threadId, order.conversation_key, order.conversation_id]
    .map(value => String(value ?? "").trim()).filter(Boolean)));
}
export function orderIdentity(order: any): string {
  for (const [field, prefix] of [["order_number", "order"], ["upsert_key", "upsert"], ["id", "id"]] as const) {
    const value = String(order[field] ?? "").trim();
    if (value) return `${prefix}:${value}`;
  }
  return "";
}
export function codSignalIdentity(row: any): string {
  const text = String(row?._text ?? row?.message_text ?? row?.message_raw ?? "");
  if (!hasCodOrderSignal(text)) return "";
  const speaker = String(row?._speaker ?? row?.speaker_type ?? row?.speaker ?? "unknown");
  const messageId = String(row?.source_message_id || row?.message_id || row?.id || "").trim();
  const identity = messageId || `${row?._occurred || row?.occurred_at || row?.created_at || ""}:${text}`;
  return `${speaker}:${identity}`;
}
export async function readChatThreads() {
  const rows = await readChatRows();
  const map = new Map<string, any>();
  const codMessagesByRoom = new Map<string, Set<string>>();
  for (const row of rows) {
    const pageId = String(row.page_id ?? row.pageId ?? "").trim();
    const threadId = String(row._thread ?? "").trim();
    const key = `${pageId}:${threadId}`;
    const current = map.get(key) ?? {
      key, pageId, threadId, customerId: row.customer_id, pageName: row.page_name || "ไม่ระบุเพจ",
      customerName: row.customer_name || row._name || "ลูกค้า", latestAt: row._occurred || row.occurred_at || row.synced_at,
      latestOrderNumber: null, preview: row._text || (row._hasAttachment ? "[ไฟล์แนบ]" : ""),
      orderCount: 0, codSignalCount: 0, orderCountError: null, unread: false, messageCount: 0, orders: [], chatTimeline: [],
    };
    current.latestAt = row._occurred || row.occurred_at || row.synced_at || current.latestAt;
    current.preview = row._text || (row._hasAttachment ? "[ไฟล์แนบ]" : current.preview);
    current.customerId ||= row.customer_id;
    current.customerName = current.customerName === "ลูกค้า" ? row.customer_name || row._name || current.customerName : current.customerName;
    current.messageCount += 1;
    current.chatTimeline.push(`${row._speaker === "page" ? "[เพจ]" : "[ลูกค้า]"} ${row._text || (row._hasAttachment ? "[ไฟล์แนบ]" : "")}`);
    // Tracking fields are supplied directly on either room-side table; keep the newest non-empty value.
    for (const field of ["tracking_number", "order_number", "order_number_display", "shipping_carrier", "facebook_tracking_message", "drakside_tracking_message"]) {
      if (row[field] != null && String(row[field]).trim()) current[field] = row[field];
    }

    // COD keyword only: no template, product, address, phone, amount, or speaker gate.
    const signalKey = codSignalIdentity(row);
    if (signalKey) {
      const seen = codMessagesByRoom.get(key) ?? new Set<string>();
      if (!seen.has(signalKey)) {
        seen.add(signalKey);
        codMessagesByRoom.set(key, seen);
        current.codSignalCount += 1;
      }
    }
    map.set(key, current);
  }

  // ChatHub เป็นห้องของสาย 2 เท่านั้น:
  // parcels → SHADOW → ROGUE → VOID → page_tokens_vault → Messenger
  // ห้ามอ่าน 🗝️HERMES_ARCHIVE จากห้องนี้ เพราะเป็นสายออเดอร์หลักคนละ pipeline
  // รายละเอียดออเดอร์/เลขพัสดุจะถูกเติมจาก parcels.mappingQueue ใน ChatHub แทน
  Array.from(map.values()).forEach(thread => { thread.orderCountError = null; });
  return Array.from(map.values()).sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());
}
export async function readChatMessages(pageId: string, threadId: string) { const rows = await readChatRows(); return rows.filter(row => String(row.page_id) === String(pageId) && String(row._thread) === String(threadId)).map((row: any) => ({ id: row.id, text: row._text || (row._hasAttachment ? "ส่งรูปภาพ" : ""), message_text: row._text, direction: row._speaker === "page" ? "outbound" : "inbound", senderType: row._speaker, senderName: row._name, side: row._side, occurredAt: row._occurred || row.occurred_at || row.synced_at, attachmentsJson: JSON.stringify(row.attachments_json || []), imageUrls: row.image_urls || [] })); }
export type CloseJobCase = { id: string; page_id: string; page_name: string; conversation_key: string; customer_id: string; customer_name: string; speaker_type: string; occurred_at: string; message_text: string; case_type: string; area: string; branch: string; carrier_employee: string; tracking_number: string; order_number: string };
export async function readCloseJobCases(limit = 10000): Promise<CloseJobCase[]> {
  const api = getSupabase("tracking");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const [casesResult, notesResult] = await Promise.all([
    api.from("vw_bb_close_job_cases").select("*").order("occurred_at", { ascending: false }).limit(Math.max(1, Math.min(limit, 10000))),
    api.from("bb_delivery_case_notes").select("case_id,branch,carrier_employee,area"),
  ]);
  if (casesResult.error) fail(casesResult.error);
  if (notesResult.error) fail(notesResult.error);
  const notes = new Map((notesResult.data ?? []).map((note: any) => [String(note.case_id), note]));
  return (casesResult.data ?? []).map((row: any) => {
    const note = notes.get(String(row.id));
    return {
      ...row,
      branch: note ? String(note.branch ?? "") : String(row.branch ?? ""),
      carrier_employee: note ? String(note.carrier_employee ?? "") : String(row.carrier_employee ?? ""),
      area: note ? String(note.area ?? "") : String(row.area ?? ""),
    } as CloseJobCase;
  });
}
export async function saveCloseJobCaseFields(input: { caseId: string; branch: string; carrierEmployee: string; area: string }) {
  const api = getSupabase("tracking");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const { error } = await api.from("bb_delivery_case_notes").upsert({
    case_id: input.caseId,
    branch: input.branch.trim(),
    carrier_employee: input.carrierEmployee.trim(),
    area: input.area.trim(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "case_id" });
  if (error) fail(error);
  return { ok: true };
}
export async function readParcelMappingQueue(status: "all" | "sent" = "all", limit = 300) {
  const api = getSupabase("tracking");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const safeLimit = Math.max(1, Math.min(limit, 500));
  const activeData = status === "sent" ? { data: [], error: null } : (await api.from("🦅ROGUE_xXx_SHIPPINGz").select("*").limit(safeLimit));
  if ("error" in activeData && activeData.error) fail(activeData.error);
  const sent = status === "sent" ? await api.from("📓DEAD_xXx_NOTE").select("*").limit(safeLimit) : { data: [], error: null };
  if (sent.error) fail(sent.error);
  return [...("data" in activeData ? (activeData.data ?? []) : []), ...(sent.data ?? [])].slice(0, safeLimit);
}
export async function readDailyChatSummary(date: string) {
  const rows = await readChatRows(); let orders: any[] = [];
  try { const orderResult = await readCanonicalOrders("", new Date(date + "T00:00:00+07:00").toISOString()); orders = orderResult.orders; } catch { /* keep chat summary usable when canonical view is unavailable */ }
  const ordersByRoom = new Map(orders.map((order: any) => [String(order.page_id ?? "") + ":" + String(order.thread_id ?? ""), order]));
  const dayRows = rows.filter(row => { const value = row._occurred || row.occurred_at || row.synced_at; return value && new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(value)) === date; });
  const map = new Map<string, any>();
  for (const row of dayRows) {
    const key = String(row.page_id ?? "") + ":" + String(row._thread ?? ""); const current = map.get(key) ?? { customerName: row.customer_name || row._name || "ไม่ระบุชื่อ", customerId: row.customer_id || "", pageName: row.page_name || "ไม่ระบุเพจ", pageId: row.page_id, threadId: row._thread, customerMessages: 0, pageMessages: 0, orderSignals: 0, signalScore: 0, signalReasons: [], coreSignalCount: 0, flowSignalCount: 0, qualifiedSignal: false, snippets: [], latestAt: row._occurred || row.occurred_at || row.synced_at, customerText: [], pageText: [], latestCod: null };
    const text = row._text || (row._hasAttachment ? "[ไฟล์แนบ]" : ""); if (row._speaker === "customer") { current.customerMessages += 1; current.customerText.push(text); } else { current.pageMessages += 1; current.pageText.push(text); }
    current.latestAt = row._occurred || row.occurred_at || row.synced_at || current.latestAt; const cod = parseCod(text); if (cod != null) current.latestCod = cod;
    const signal = scoreDailyOrderSignal(text, cod); if (signal.qualified) current.orderSignals += 1; current.signalScore += signal.score; current.coreSignalCount += signal.coreCount; current.flowSignalCount += signal.flowCount; current.qualifiedSignal ||= signal.qualified; current.signalReasons.push(...signal.reasons);
    if (text.trim()) current.snippets.push(text.slice(0, 300)); map.set(key, current);
  }
  const threads = Array.from(map.values()).map(row => { const order = ordersByRoom.get(String(row.pageId ?? "") + ":" + String(row.threadId ?? "")) as any; return { ...row, sourceText: order?.source_text || order?.source_payload?.source_text || "", productDisplay: order?.display_for_packer || order?.items_text || "", snippets: row.snippets.slice(-8), signalReasons: Array.from(new Set(row.signalReasons)).slice(-12), orderSignalsText: row.latestCod != null ? "COD ล่าสุด " + row.latestCod.toLocaleString("th-TH") + " บาท" : "ไม่พบ COD" }; });
  return { date, threads, totalMessages: dayRows.length, customerMessages: dayRows.filter(r => r._speaker === "customer").length, pageMessages: dayRows.filter(r => r._speaker === "page").length, threadCount: threads.length, orderSignalThreads: threads.filter(r => r.orderSignals > 0).length };
}
export type AlienReviewItem = Record<string, any> & { audit_status: string; raw_display: string; mapped_display: string; customer_history: string[] };
export async function readAlienReview(search = ''): Promise<AlienReviewItem[]> {
  const api = getSupabase();
  if (!api) fail({ message: 'ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key' });
  const camp = getActiveCamp();
  const orderTable = defaultOrderView(camp);
  const inspectorView = 'vw_bb_alien_master_center';
  const [ordersResult, masterResult, aliasResult, inventoryResult, inspectorResult] = await Promise.all([
    api.from(orderTable).select(HERMES_WEB_ORDER_COLUMNS).order('order_time_display', { ascending: false }).limit(ORDER_OPERATIONAL_LIMIT),
    // Read the existing tables without assuming a particular SKU column name.
    // Some Supabase projects use master_sku/product_code instead of sku.
    api.from("🛒product_master").select('*').limit(1500),
    api.from('product_map_master').select('*').limit(3000),
    api.from('inventory').select('*'),
    api.from(inspectorView).select('*').limit(2000),
  ]);
  if (ordersResult.error) fail(ordersResult.error);
  if (masterResult.error) fail(masterResult.error);
  if (aliasResult.error) fail(aliasResult.error);
  // Inventory is supplementary. If the table is not connected yet or RLS
  // hides it, keep the raw/master inspection alive and report STOCK_UNKNOWN.

  const productKey = (row: any) => String(row.sku ?? row.master_sku ?? row.product_sku ?? row.product_code ?? row.code ?? '').trim();
  // product_master is shared by BB and has no store_code column. Do not
  // filter by a non-existent column, otherwise the Master/stock lookup is
  // coupled to an unsupported schema.
  const masters: any[] = masterResult.data ?? [];
  const bySku = new Map<string, any>(masters
    .map((master: any): [string, any] => [productKey(master).toLowerCase(), master])
    .filter(([key]) => Boolean(key)));
  const inventoryByKey = new Map<string, any>();
  for (const stock of inventoryResult.data ?? []) {
    if (stock.product_id != null) inventoryByKey.set(`id:${String(stock.product_id)}`, stock);
    const stockSku = productKey(stock).toLowerCase();
    if (stockSku) inventoryByKey.set(`sku:${stockSku}`, stock);
  }
  const normalize = (value: any) => String(value ?? '').toLowerCase().normalize('NFKC').replace(/[\s_\-.,:;|()[\]{}]+/g, '').trim();
  const aliasToSku = new Map<string, string>();
  for (const row of aliasResult.data ?? []) {
    const sku = productKey(row);
    if (!sku) continue;
    for (const value of [row.alias, row.alias_text, row.alias_norm].flatMap((v: any) => String(v ?? '').split(/[,\n|]+/)).map((v: string) => v.trim()).filter(Boolean)) {
      const key = normalize(value);
      if (key) aliasToSku.set(key, sku);
    }
  }

  const query = search.trim().toLowerCase();
  const inspectorByKey = new Map<string, any>();
  for (const item of inspectorResult.data ?? []) {
    const key = String(item.upsert_key ?? item.order_number ?? '').trim();
    if (key) inspectorByKey.set(key, item);
  }
  return (ordersResult.data ?? []).map((sourceOrder: any) => {
    // The order table remains the no-drop source. The inspector view only
    // enriches it with verified Master/quantity/inventory fields.
    const order = { ...sourceOrder, ...(inspectorByKey.get(String(sourceOrder.upsert_key ?? sourceOrder.order_number ?? '').trim()) ?? {}) };
    const history = [
      ...(Array.isArray(order.normalized_chat_timeline) ? order.normalized_chat_timeline : []),
      ...(Array.isArray(order.chat_timeline) ? order.chat_timeline : []),
    ].map((value: any) => String(value)).filter(Boolean);
    const rawCandidates = [
      order.raw_text,
      order.raw_item_text,
      order.raw_product_text,
      order.extracted_product_raw,
      order.product_lines,
      order.sniper_x_text_clean,
    ].map((value: any) => String(value ?? '').trim()).filter(Boolean);
    const raw = rawCandidates.find((value: string) => !/CHECK_SKU|ระบุสินค้าไม่ได้/i.test(value)) || rawCandidates[0] || '';
    const evidenceText = [raw, ...history].join('\n');
    const rawNormalized = normalize(evidenceText);
    const aliasSku = Array.from(aliasToSku.entries()).find(([alias]) => alias.length >= 3 && rawNormalized.includes(alias))?.[1] ?? '';
    const sourceSku = String(order.sku ?? order.extracted_sku ?? '').trim();
    const resolvedSku = sourceSku || aliasSku;
    const master: any = bySku.get(resolvedSku.toLowerCase());
    const inventory: any = master?.id != null
      ? inventoryByKey.get(`id:${String(master.id)}`) ?? inventoryByKey.get(`sku:${resolvedSku.toLowerCase()}`)
      : inventoryByKey.get(`sku:${resolvedSku.toLowerCase()}`);
    // Prefer the final product fields produced by the current bill-builder node.
    // Do not infer or translate product names in the web room.
    const masterDisplay = firstText(order.master_display_for_packer, order.final_display_for_packer, order.final_product, order.for_packer_st_display, order.manus_for_packer, order.sku);
    const mappingStatus = String(order.mapping_status ?? order.match_status ?? '').toUpperCase();
    const matched = Boolean(masterDisplay && (mappingStatus === 'MATCHED' || mappingStatus === 'RESOLVED' || Boolean(aliasSku)));
    const audit_status = matched ? 'MATCHED' : 'REVIEW';
    const customerHistory = Array.from(new Set(history));
    const row = {
      ...order,
      store_code: order.store_code ?? camp,
      sku: resolvedSku || null,
      raw_display: raw || 'ไม่มีคำดิบ',
      mapped_display: matched ? masterDisplay : '',
      master_display_for_packer: masterDisplay || null,
      audit_status,
      mapping_status: mappingStatus || 'REVIEW',
      alias_match: Boolean(aliasSku),
      alias_match_sku: aliasSku || null,
      alias_match_method: aliasSku ? 'product_map_master' : null,
      customer_history: customerHistory,
      customer_history_count: order.chat_timeline_count ?? customerHistory.length,
      product_source: order.product_source ?? null,
      product_evidence: order.product_evidence ?? null,
      address_completeness: order.address_completeness ?? null,
      // Inventory is the stock truth; product_master is only the product
      // catalogue and display source.
      stock_status: inventory?.stock_status ?? 'STOCK_UNKNOWN',
      stock_qty: inventory?.stock_qty ?? inventory?.quantity ?? null,
      available_qty: inventory?.stock_qty ?? inventory?.quantity ?? null,
      unit_price: order.unit_price ?? master?.unit_price ?? null,
      price_mismatch: false,
    };
    return row;
  }).filter((row: AlienReviewItem) => !query || JSON.stringify(row).toLowerCase().includes(query));
}
