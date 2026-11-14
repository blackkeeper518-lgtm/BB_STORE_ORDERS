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
const PARCEL_CONFIG_KEY = "bb-parcel-supabase-config";
const VAULT_CONFIG_KEY = "bb-vault-supabase-config";
export type Camp = "BB";
export type SupabaseProject = "main" | "tracking" | "parcel" | "vault";
const DEPLOYMENT_CAMP: Camp = "BB";
export type SupabaseConfig = { url: string; anonKey: string; orderTable?: string };
// Browser client ใช้เฉพาะ Anon/Publishable key; Chat ต้องผ่าน protected server route เท่านั้น
const DEPLOYMENT_SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const DEPLOYMENT_SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const DEPLOYMENT_TRACKING_URL = String(import.meta.env.VITE_TRACKING_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const DEPLOYMENT_TRACKING_ANON_KEY = String(import.meta.env.VITE_TRACKING_SUPABASE_ANON_KEY ?? "").trim();
const DEPLOYMENT_PARCEL_URL = String(import.meta.env.VITE_PARCEL_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const DEPLOYMENT_PARCEL_ANON_KEY = String(import.meta.env.VITE_PARCEL_SUPABASE_ANON_KEY ?? "").trim();
const DEPLOYMENT_VAULT_URL = String(import.meta.env.VITE_VAULT_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const DEPLOYMENT_VAULT_ANON_KEY = String(import.meta.env.VITE_VAULT_SUPABASE_ANON_KEY ?? "").trim();
const clients: Partial<Record<SupabaseProject, SupabaseClient>> = {};
const clientSignatures: Partial<Record<SupabaseProject, string>> = {};
export function getActiveCamp(): Camp { return DEPLOYMENT_CAMP; }
export function setActiveCamp(_camp: Camp) { for (const project of ["main", "tracking", "parcel", "vault"] as const) { delete clients[project]; delete clientSignatures[project]; } }
function profileKey(_camp: Camp, project: SupabaseProject) {
  if (project === "tracking") return TRACKING_CONFIG_KEY;
  if (project === "parcel") return PARCEL_CONFIG_KEY;
  if (project === "vault") return VAULT_CONFIG_KEY;
  return CONFIG_KEY;
}
export function getSupabaseConfig(camp: Camp = getActiveCamp(), project: SupabaseProject = "main"): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(profileKey(camp, project));
    if (raw) {
      const value = JSON.parse(raw) as Partial<SupabaseConfig>;
      if (value.url && value.anonKey) return { url: value.url.replace(/\/$/, ""), anonKey: value.anonKey, orderTable: project === "main" ? defaultOrderView(camp) : undefined };
    }
    if (project === "parcel") {
      const fallback = localStorage.getItem(TRACKING_CONFIG_KEY);
      if (fallback) {
        const value = JSON.parse(fallback) as Partial<SupabaseConfig>;
        if (value.url && value.anonKey) return { url: value.url.replace(/\/$/, ""), anonKey: value.anonKey };
      }
    }
  } catch { /* invalid local value; try deployment defaults */ }
  const url = project === "tracking" ? DEPLOYMENT_TRACKING_URL : project === "parcel" ? DEPLOYMENT_PARCEL_URL || DEPLOYMENT_TRACKING_URL : project === "vault" ? DEPLOYMENT_VAULT_URL : DEPLOYMENT_SUPABASE_URL;
  const anonKey = project === "tracking" ? DEPLOYMENT_TRACKING_ANON_KEY : project === "parcel" ? DEPLOYMENT_PARCEL_ANON_KEY || DEPLOYMENT_TRACKING_ANON_KEY : project === "vault" ? DEPLOYMENT_VAULT_ANON_KEY : DEPLOYMENT_SUPABASE_ANON_KEY;
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
export const supabase = { from: (table: string) => { const api = getSupabase(); if (!api) throw new Error("ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key"); return api.from(table); } } as any;
function fail(error: any): never { throw new Error(error?.message || "Supabase connection failed"); }
function num(v: any) { const n = Number(v); return v == null || v === "" || !Number.isFinite(n) ? null : n; }
function asText(v: any) { return typeof v === "string" ? v : v == null ? "" : JSON.stringify(v); }
function chatAttachmentPayload(row: any) {
  const values: any[] = [];
  const add = (value: any) => {
    if (value == null || value === "") return;
    if (Array.isArray(value)) { value.forEach(add); return; }
    if (typeof value === "string") {
      const text = value.trim();
      if (/^https?:\/\//i.test(text)) { values.push({ url: text }); return; }
      try { add(JSON.parse(text)); } catch { /* keep non-JSON text out of image payload */ }
      return;
    }
    if (typeof value === "object") values.push(value);
  };
  add(row?.attachments_raw);
  add(row?.attachment_urls);
  add(row?.attachment_url);
  add(row?.sticker_url);
  return JSON.stringify(values);
}
function hasChatAttachment(row: any) {
  return Boolean(row?.has_attachment || chatAttachmentPayload(row) !== "[]");
}
export type CanonicalOrder = Record<string, any> & { upsert_key: string; order_time_display: string };
const ORDER_SOURCE_TABLE_BY_CAMP: Record<Camp, string> = { BB: "🗝️HERMES_ARCHIVE" };
// Order screens load at most 1,000 rows per explicit refresh.
const ORDER_OPERATIONAL_LIMIT = 1000;
function defaultOrderView(camp: Camp) { return ORDER_SOURCE_TABLE_BY_CAMP[camp]; }
function currentOrderWindowStart() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)])); return new Date(Date.UTC(values.year, values.month - 1, values.day - 1, 7, 0, 0)).toISOString(); }
function displayOrderSortKey(value: unknown): number {
  const match = String(value ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let year = Number(match[3]);
  if (year < 100) year = 1957 + year; // Thai short year: 69 = 2026
  else if (year > 2400) year -= 543;
  return Number(`${year}${match[2].padStart(2, "0")}${match[1].padStart(2, "0")}${match[4].padStart(2, "0")}${match[5]}`);
}
// ⫘ CENTRAL ORDER CLOCK · เวลากลางของเว็บ ใช้เรียงออเดอร์ล่าสุดก่อนทุกห้อง
// แหล่งเวลาเดียวของระบบ: order_time_display แบบ DD/MM/YY HH:mm
export function orderTimeSortKey(value: unknown): number {
  const raw = String(value ?? "").trim();
  // order_time_display เป็นก้อนเวลาแบบ DD/MM/YY จาก n8n
  // ต้องอ่านรูปแบบนี้ก่อน new Date() เพื่อไม่ให้ browser ตีความเป็น MM/DD/YY
  const displayKey = displayOrderSortKey(raw);
  if (displayKey) return displayKey;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(parsed);
    const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "0";
    return Number(`${part("year")}${part("month")}${part("day")}${part("hour")}${part("minute")}`);
  }
  return displayOrderSortKey(raw);
}

function chatDateMs(value: unknown): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const display = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (display) {
    let year = Number(display[3]);
    if (year < 100) year += 1957;
    else if (year > 2400) year -= 543;
    const localAsUtc = Date.UTC(year, Number(display[2]) - 1, Number(display[1]), Number(display[4] ?? 0), Number(display[5] ?? 0), Number(display[6] ?? 0));
    return localAsUtc - 7 * 60 * 60 * 1000;
  }
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function isBangkokToday(value: unknown, now = new Date()) {
  const timestamp = chatDateMs(value);
  if (timestamp == null) return false;
  const format = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return format(new Date(timestamp)) === format(now);
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
  "telegram_message_web",
  "telegram_change_alert_web",
  "telegram_message",
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
  "customer_change_summary",
  "raw_text",
  "recipient_id",
  "expected_cod",
  "telegram_bill_header"
].join(",");

// HERMES_ARCHIVE stores the three aliased view fields with their original names.
const HERMES_DIRECT_ORDER_COLUMNS = HERMES_WEB_ORDER_COLUMNS
  .replace(/order_time_display/g, "order_time_display");

// Only fields used by TelegramDeliveryRoom; avoid returning all 330 view columns.
const TELEGRAM_WEB_ORDER_COLUMNS = [
  // PIONEER and ANDROMEDA share the operational order number, but ANDROMEDA
  // does not expose the optional order_number_display column.
  "upsert_key", "source_table", "order_time_display", "order_number",
  "telegram_product_display", "final_display_for_packer", "order_fibo_product", "for_packer_st_display", "manus_for_packer", "google_for_packer", "packer_tag_display", "packer_obj",
  "address_fibo_selected_clean", "address_display_packer", "full_address", "province", "zipcode", "phone", "extracted_phone",
  "cod_amount", "customer_name", "facebook_name", "page_name", "shipping_carrier", "sku",
  "delivery_state", "delivery_status", "telegram_status", "telegram_sent", "sent_at", "telegram_sent_at",
  "telegram_message_web", "telegram_change_alert_web", "telegram_message", "telegram_change_alert",
  "raw_text", "original"
].join(",");

function firstText(...values: unknown[]): string {
  return values.map(value => String(value ?? "").trim()).find(Boolean) ?? "";
}
function asBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  return ["true", "t", "1", "yes", "ใช่"].includes(String(value ?? "").trim().toLowerCase());
}

export async function readCanonicalOrders(search = "", since: string | null = null, until: string | null = null) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });

  // n8n owns parsing, mapping, canonical selection and deduplication.
  // The browser reads HERMES values as supplied and does not rebuild them.
  const ordersResult = await api.from("🗝️HERMES_ARCHIVE")
    .select(HERMES_DIRECT_ORDER_COLUMNS)
    .limit(ORDER_OPERATIONAL_LIMIT);
  if (ordersResult.error) fail(ordersResult.error);

  const query = search.trim().toLowerCase();
  const fromKey = isoDateKey(since);
  const untilKey = isoDateKey(until);
  const orders = (ordersResult.data ?? []).filter((row: any) => {
      if (query && !JSON.stringify(row).toLowerCase().includes(query)) return false;
      const dateKey = displayDateKey(row.order_time_display);
      return (!fromKey || (dateKey && dateKey >= fromKey)) && (!untilKey || (dateKey && dateKey <= untilKey));
    }).sort((a: any, b: any) => orderTimeSortKey(b.order_time_display) - orderTimeSortKey(a.order_time_display)) as unknown as CanonicalOrder[];
  return { orders, itemError: null, sourceTable: "🗝️HERMES_ARCHIVE", fetchedAt: new Date().toISOString(), since };
}
export async function readTelegramDeliveryOrders(search = "", room: "queue" | "today" | "yesterday_after_14" | "sent" = "queue") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });

  // Telegram has one room with two views: live queue from PIONEER and
  // the final sent archive from GENESIS. ANDROMEDA is retired.
  const sourceTable = room === "sent" ? "🌟GENESIS_xXx_HISTORY" : "🛰️PIONEER_xXx_CAPSULE";
  const columns = room === "sent" ? GENESIS_HISTORY_COLUMNS : TELEGRAM_WEB_ORDER_COLUMNS;
  let request = api
    .from(sourceTable)
    .select(columns)
    .order("order_time_display", { ascending: false })
    .limit(ORDER_OPERATIONAL_LIMIT);
  const { data, error } = await request;
  if (error) fail(error);
  const query = search.trim().toLowerCase();
  const orders = (data ?? []).filter((row: any) => !query || JSON.stringify(row).toLowerCase().includes(query));
  return { orders, sourceTable, fetchedAt: new Date().toISOString(), room };
}

export async function readBbAlertRoom(search = "") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from("🔸PARADOX_xXx_EXCHANGE").select("*").order("order_time_display", { ascending: false }).limit(2000);
  if (error) fail(error);
  const query = search.trim().toLowerCase();
  return (data ?? [])
    .filter((row: any) => !query || JSON.stringify(row).toLowerCase().includes(query))
    .sort((a: any, b: any) => displayOrderSortKey(b.order_time_display) - displayOrderSortKey(a.order_time_display));
}

export async function readBlackboxRoom(search = "") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from("💀THANATOS_xXx_DEATH_NOTE").select("*").order("order_time_display", { ascending: false }).limit(2000);
  if (error) fail(error);
  const query = search.trim().toLowerCase();
  return (data ?? []).filter((row: any) => !query || JSON.stringify(row).toLowerCase().includes(query));
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

async function withSentWriteTimeout<T>(request: PromiseLike<T>, timeoutMs = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Supabase ไม่ตอบใน 15 วินาที — สถานะอาจเขียนแล้ว ให้รีเฟรชเช็กก่อนกดซ้ำ")), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(request), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function markBbOrderSentByKey(upsertKey: string, sourceTable: "🗝️HERMES_ARCHIVE" | "🌀SINGULARITY_xXx_EXCHANGE") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const patch = { delivery_status: "SENT", sent_at: new Date().toISOString() };
  const request = api.from(sourceTable)
    .update(patch)
    .eq("upsert_key", upsertKey)
    .select("upsert_key,delivery_status,sent_at");
  const { data, error } = await withSentWriteTimeout(request);
  if (error) fail(error);
  if (!data?.length) fail({ message: `เขียน 🔥SENT ไม่สำเร็จ: ไม่พบ ${upsertKey} ใน ${sourceTable} หรือสิทธิ์ RLS ไม่อนุญาต` });
  if (data.length > 1) fail({ message: `เขียน 🔥SENT ไม่สำเร็จ: พบ ${data.length} แถวสำหรับ ${upsertKey}` });
  const row = data[0] as Record<string, unknown>;
  const deliveryStatus = String(row.delivery_status ?? "").trim().toLowerCase().replace(/^🔥\s*/, "");
  if (deliveryStatus !== "sent" || !String(row.sent_at ?? "").trim()) {
    fail({ message: `อัปเดต ${upsertKey} แล้วแต่ตรวจค่ากลับไม่ครบ — ไม่ซ่อนรายการจากคิว` });
  }
  return row;
}

export type StockProduct = { id: number; sku: string; label: string; thName: string; emoji: string; price: number | null; stockQty: number; stockStatus: string | null; outOfStockJoke: string | null; stockNotice: string | null; inventoryId: number | string | null };

export async function readStockProducts(): Promise<StockProduct[]> {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  // Stock Room is intentionally a Product Master room for now.
  // It does not read inventory and it never deducts stock from orders.
  const { data: products, error } = await api.from("🛒product_master")
    .select("id,master_sku,th_name,name_standard,master_display_for_packer,display_for_packer,emoji,unit_price,stock_qty,stock_status,stock_notice")
    .order("master_sku");
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

const GENESIS_HISTORY_COLUMNS = [
  "upsert_key", "order_time_display", "order_number", "order_number_display",
  "page_id", "page_name", "threadId", "customer_name", "facebook_name",
  "phone", "extracted_phone", "full_address", "final_address_for_bill",
  "address_display_packer", "addressclean", "province", "zipcode", "sku",
  "order_fibo_product", "for_packer_st_display", "manus_for_packer",
  "google_for_packer", "packer_tag_display", "packer_obj", "telegram_product_display",
  "telegram_message", "original",
  "cod_amount", "expected_cod", "shipping_carrier", "source_table", "telegram_status",
  "telegram_sent", "sent_at", "telegram_sent_at"
].join(",");

export async function readGenesisOrderHistory(date: string) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { orders: [], total: 0, sourceView: "🌟GENESIS_xXx_HISTORY", fetchedAt: new Date().toISOString() };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const years = new Set([String(year), String(year + 543)]);
  if (year - 1957 >= 0 && year - 1957 <= 99) years.add(String(year - 1957).padStart(2, "0"));
  const days = new Set([String(day).padStart(2, "0"), String(day)]);
  const months = new Set([String(month).padStart(2, "0"), String(month)]);
  const prefixes = new Set<string>([date]);
  Array.from(days).forEach((d) => Array.from(months).forEach((m) => Array.from(years).forEach((y) => prefixes.add(`${d}/${m}/${y}`))));
  const dateFilter = Array.from(prefixes).map((prefix) => `order_time_display.ilike.${prefix}%`).join(",");

  const { data, error } = await api.from("🌟GENESIS_xXx_HISTORY")
    .select(GENESIS_HISTORY_COLUMNS)
    .or(dateFilter)
    .order("order_time_display", { ascending: false })
    .limit(1000);
  if (error) fail(error);

  const orders = (data ?? []).sort((a: any, b: any) => displayOrderSortKey(b.order_time_display) - displayOrderSortKey(a.order_time_display));

  return { orders, total: orders.length, sourceView: "🌟GENESIS_xXx_HISTORY", fetchedAt: new Date().toISOString() };
}

export async function readDailyTrackingHistory(date: string) {
  const api = getSupabase("parcel");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const { data, error } = await api.from("📓DEAD_xXx_NOTE").select("*").limit(2000);
  if (error) fail(error);
  const dayKey = (value: unknown) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime())
      ? raw.slice(0, 10)
      : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(parsed);
  };
  const orders = (data ?? []).filter((row: any) => [
    row.facebook_tracking_sent_at,
    row.sent_at,
    row.pickup_date,
    row.order_time,
    row.order_time_display,
  ].some(value => dayKey(value) === date));
  return { orders, total: orders.length, sourceView: "📓DEAD_xXx_NOTE", fetchedAt: new Date().toISOString() };
}
export async function readTelegramSentHistory(search = "") {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });

  const { data, error } = await api.from("🌟GENESIS_xXx_HISTORY")
    .select(GENESIS_HISTORY_COLUMNS)
    .order("order_time_display", { ascending: false })
    .limit(1000);
  if (error) fail(error);

  const needle = search.trim().toLocaleLowerCase();
  const orders = (data ?? []).map((row: any) => ({
    ...row,
    source_view: "🌟GENESIS_xXx_HISTORY",
  })).filter((row: Record<string, any>) => !needle || [
    row.upsert_key, row.order_number, row.order_number_display, row.customer_name,
    row.facebook_name, row.phone, row.extracted_phone,
  ].some((value) => asText(value).toLocaleLowerCase().includes(needle)));

  return { orders, total: orders.length, sourceView: "🌟GENESIS_xXx_HISTORY", fetchedAt: new Date().toISOString() };
}
export async function readDailyParcels(date: string, search = "") {
  const api = getSupabase("parcel");
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
function normalizeChatReadRows(sourceRows: any[]) {
  return sourceRows.filter(row => {
    // ห้องจริงต้องมี page_id และ thread_id; กันแถว metadata/แถวว่างไม่ให้กลายเป็นห้อง
    const hasRoomKey = String(row?.page_id ?? "").trim() && String(row?.thread_id ?? row?.threadId ?? "").trim();
    if (!hasRoomKey) return false;
    const isPage = row._source_table === "Pg_Chat⭐BINARY_xXx_STAR";
    // แถว delivery/status อย่างเดียวไม่ใช่ข้อความแชท และห้ามเปิดเป็นห้องเปล่า
    return Boolean(
      asText(row?.message_text).trim()
      || (isPage && asText(row?.facebook_tracking_message).trim())
      || asText(row?.customer_latest_message).trim()
      || asText(row?.page_latest_message).trim()
      || hasChatAttachment(row),
    );
  }).flatMap(row => {
    const isPage = row._source_table === "Pg_Chat⭐BINARY_xXx_STAR";
    // สองโต๊ะต้นทางเป็น source of truth: Cust = ลูกค้า, Pg = เพจ
    // เพราะบางรอบ n8n ใส่ speaker ผิดแถวจนข้อความลูกค้าถูกตีเป็นข้อความเพจ
    const rawSpeaker = asText(row.speaker).trim().toLowerCase();
    const isCustomer = row._source_table === "Cust_Chat⭐BINARY_xXx_STAR";
    const speaker = isCustomer ? "customer" : isPage ? "page"
      : rawSpeaker && /^(page|เพจ|admin|แอดมิน|outbound|เจ้าหน้าที่)$/i.test(rawSpeaker) ? "page" : "customer";
    const isPageSpeaker = speaker === "page";
    // customer_latest_message คือข้อความแรก/ล่าสุดจากลูกค้าในแถวสรุปของ n8n
    // บางแถวไม่มี message_text แต่มีฟิลด์นี้ จึงห้ามปล่อยให้กลายเป็น bubble ว่าง
    const messageText = asText(row.message_text).trim()
      || (isPageSpeaker ? asText(row.page_latest_message).trim() : asText(row.customer_latest_message).trim())
      || asText(row.text).trim()
      || asText(row.message).trim();
    const threadId = String(row.thread_id ?? row.threadId ?? "").trim();
    const base = {
      ...row,
      // เชื่อค่า speaker ที่ผู้ใช้กำหนด; ใช้ต้นทางตารางสำรองเมื่อไม่มีค่าเท่านั้น
      _speaker: speaker,
      _side: isPageSpeaker ? "right" : "left",
      // ชื่อป้ายห้องมาจาก Facebook API เท่านั้น; customer_name เป็นชื่อในบิล ห้ามนำมาแทน
      _name: isPageSpeaker ? row.page_name : row.facebook_name,
      // message_text เป็นหลัก; ข้อความ tracking ขาออกใช้ facebook_tracking_message เมื่อ message_text ว่าง
      _text: messageText || (isPageSpeaker ? asText(row.facebook_tracking_message).trim() : ""),
      _thread: threadId,
      _occurred: row.occurred_at || row.time,
      _hasAttachment: hasChatAttachment(row),
    };
    // แถวสรุปจาก n8n อาจมี customer_latest และ page_latest อยู่พร้อมกัน
    // เพราะ 3 Flow เขียนห่างกันเป็นรอบ ๆ จึงต้องแตกเป็น bubble แยกฝั่งเอง
    if (!asText(row.message_text).trim() && (asText(row.customer_latest_message).trim() || asText(row.page_latest_message).trim())) {
      const splitRows = [];
      const customerText = asText(row.customer_latest_message).trim();
      const pageText = asText(row.page_latest_message).trim();
      if (customerText) splitRows.push({ ...base, _speaker: "customer", _side: "left", _name: row.facebook_name, _text: customerText, _occurred: row.customer_message_time_th || row.occurred_at || row.time, time_th: row.customer_message_time_th || row.time_th });
      if (pageText) splitRows.push({ ...base, _speaker: "page", _side: "right", _name: row.page_name, _text: pageText, _occurred: row.page_message_time_th || row.occurred_at || row.time, time_th: row.page_message_time_th || row.time_th });
      return splitRows;
    }
    return [base];
  }).sort((a, b) => (chatDateMs(a._occurred) ?? 0) - (chatDateMs(b._occurred) ?? 0));
}
function chatCustomerNameCandidate(row: any) {
  const value = String(row.facebook_name ?? "").trim();
  return value ? { value, priority: 1 } : null;
}
export function mapChatRowsToThreads(sourceRows: any[]) {
  const rows = normalizeChatReadRows(sourceRows);
  const map = new Map<string, any>();
  const customerThreadKeys = new Set(
    rows
      .filter(row => row._speaker === "customer" && (row._text || row._hasAttachment))
      .map(row => `${String(row.page_id ?? "").trim()}:${String(row._thread ?? "").trim()}`),
  );
  for (const row of rows) {
    const pageId = String(row.page_id ?? "").trim();
    const threadId = String(row._thread ?? "").trim();
    const key = `${pageId}:${threadId}`;
    const nameCandidate = chatCustomerNameCandidate(row);
    const current = map.get(key) ?? {
      key, pageId, threadId, portalKey: row.portal_key || null, chatLinkKey: row.chat_link_key || null,
      timeSlotLabel: String(row.time_slot_label ?? "").trim() || null,
      customerId: row.customer_id || row.recipient_id || null, customerPhone: row.phone || null, pageName: row.page_name || "ไม่ระบุเพจ",
      customerName: nameCandidate?.value || "", _customerNamePriority: nameCandidate?.priority ?? -1,
      latestAt: row._occurred || row.occurred_at || null,
      preview: row._text || (row._hasAttachment ? "[ไฟล์แนบ]" : ""), unread: false, messageCount: 0, chatTimeline: [],
      customerLatestMessage: row.customer_latest_message || null, customerMessageTimeTh: row.customer_message_time_th || null,
      pageLatestMessage: row.page_latest_message || null, pageMessageTimeTh: row.page_message_time_th || null,
      pagerMessageTimeTh: row.pager_message_time_th || null,
      upsert_key: row.upsert_key || null, order_number: row.order_number || null,
      _searchTokens: "",
      is_sent: row.is_sent === true || row.is_sent === "true",
      order_number_display: row.order_number_display || null, order_time: row.order_time || null,
      order_time_display: row.order_time_display || null, cod_amount: row.cod_amount ?? null,
      facebook_name: row.facebook_name || null, manus_for_packer: row.manus_for_packer || null,
      parcel_status_emoji: row.parcel_status_emoji || null,
      delivery_status: row.delivery_status || null,
      orderTodayActive: false,
      trackingAgeMs: null,
    };
    current.latestAt = row._occurred || row.occurred_at || current.latestAt;
    current.preview = row._text || (row._hasAttachment ? "[ไฟล์แนบ]" : current.preview);
    if (String(row.time_slot_label ?? "").trim()) current.timeSlotLabel = String(row.time_slot_label).trim();
    current.customerId ||= row.customer_id || row.recipient_id || null;
    current.customerPhone ||= row.phone || null;
    current.portalKey ||= row.portal_key || null;
    current.chatLinkKey ||= row.chat_link_key || null;
    if (nameCandidate && nameCandidate.priority >= current._customerNamePriority) {
      current.customerName = nameCandidate.value;
      current._customerNamePriority = nameCandidate.priority;
    }
    current.is_sent ||= row.is_sent === true || row.is_sent === "true";
    for (const [source, target] of [
      ["customer_latest_message", "customerLatestMessage"], ["customer_message_time_th", "customerMessageTimeTh"],
      ["page_latest_message", "pageLatestMessage"], ["page_message_time_th", "pageMessageTimeTh"],
      ["pager_message_time_th", "pagerMessageTimeTh"], ["upsert_key", "upsert_key"], ["order_number", "order_number"],
      ["order_number_display", "order_number_display"], ["order_time", "order_time"], ["order_time_display", "order_time_display"],
      ["cod_amount", "cod_amount"], ["facebook_name", "facebook_name"], ["manus_for_packer", "manus_for_packer"],
      ["parcel_status_emoji", "parcel_status_emoji"], ["phone", "phone"],
    ]) {
      const value = row[source];
      if (value != null && String(value).trim()) current[target] = value;
    }
    current.messageCount += 1;
    current.chatTimeline.push(`${row._speaker === "page" ? "[เพจ]" : "[ลูกค้า]"} ${row._text || (row._hasAttachment ? "[ไฟล์แนบ]" : "")}`);
    // Tracking fields are supplied directly on either room-side table; keep the newest non-empty value.
    for (const field of ["tracking_number", "order_number", "order_number_display", "shipping_carrier", "facebook_tracking_message", "drakside_tracking_message", "source_lane", "delivery_status", "tracking_created_at", "tracking_number_created_at", "tracking_time", "tracking_at", "tracking_sent_at", "facebook_tracking_sent_at", "sent_at", "pickup_date"]) {
      if (row[field] != null && String(row[field]).trim()) current[field] = row[field];
    }
    current._searchTokens = [current._searchTokens, row.phone, row.customer_id, row.recipient_id, row.order_number, row.order_number_display, row.upsert_key, row.chat_link_key].filter(Boolean).join(" ");

    const hasOrderNumber = Boolean(String(current.order_number_display ?? current.order_number ?? "").trim());
    const orderTime = current.order_time_display ?? current.order_time ?? row.order_time_display ?? row.order_time ?? row.occurred_at;
    current.orderTodayActive = current.orderTodayActive || (hasOrderNumber && isBangkokToday(orderTime));
    if (current.tracking_number) {
      const trackingTime = [
        current.tracking_created_at, current.tracking_number_created_at, current.tracking_time,
        current.tracking_at, current.tracking_sent_at, current.facebook_tracking_sent_at,
        current.sent_at, current.pickup_date, current.order_time_display, current.order_time,
        current.latestAt,
      ].find(value => String(value ?? "").trim());
      const timestamp = chatDateMs(trackingTime);
      if (timestamp != null) current.trackingAgeMs = Date.now() - timestamp;
    }

    map.set(key, current);
  }
  return Array.from(map.values()).filter(thread => customerThreadKeys.has(thread.key)).map(({ _customerNamePriority, _searchTokens, ...thread }) => ({
    ...thread,
    customerPhone: thread.phone || thread.customerPhone || null,
    latestOrderNumber: thread.order_number_display || thread.order_number || "",
    searchText: [thread.customerName, thread.customerPhone, thread.customerId, thread.chatLinkKey, thread.upsert_key, thread.order_number, thread.order_number_display, _searchTokens, thread.preview].filter(Boolean).join(" "),
  })).sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());
}
export function mapChatRowsToMessages(sourceRows: any[]) {
  return normalizeChatReadRows(sourceRows).map((row: any) => ({
    // บางโต๊ะแชทไม่มี id ของแถว; ห้ามปล่อย undefined ซ้ำทุก bubble
    id: row.id ?? row.message_id ?? row.dedupe_key ?? `${row._thread}:${row._occurred}:${row._speaker}:${row._text}`,
    text: row._text,
    message_text: asText(row.message_text),
    direction: row._speaker === "page" ? "outbound" : "inbound",
    senderType: row._speaker,
    senderName: row._name,
    side: row._side,
    occurredAt: row._occurred,
    messageId: row.message_id,
    dedupeKey: row.dedupe_key,
    isSent: row.is_sent,
    messageTimeDisplay: row.message_time_display,
    timeTh: row.time_th,
    customerLatestMessage: row.customer_latest_message,
    customerMessageTimeTh: row.customer_message_time_th,
    pageLatestMessage: row.page_latest_message,
    pageMessageTimeTh: row.page_message_time_th,
    attachmentsJson: chatAttachmentPayload(row),
    imageUrls: Array.isArray(row.attachment_urls) ? row.attachment_urls : row.attachment_url ? [row.attachment_url] : [],
  }));
}
export function reconcileOptimisticMessages(optimistic: any[], persisted: any[]) {
  const persistedIds = new Set(persisted
    .filter(message => message.direction === "outbound")
    .map(message => String(message.messageId ?? "").trim())
    .filter(Boolean));
  if (!persistedIds.size) return optimistic;
  const remaining = optimistic.filter(message => {
    const messageId = String(message.messageId ?? "").trim();
    return !messageId || !persistedIds.has(messageId);
  });
  return remaining.length === optimistic.length ? optimistic : remaining;
}
export type CloseJobCase = { id: string; page_id: string; page_name: string; conversation_key: string; customer_id: string; customer_name: string; speaker_type: string; occurred_at: string; message_text: string; case_type: string; area: string; branch: string; carrier_employee: string; tracking_number: string; order_number: string };
export async function readCloseJobCases(limit = 10000): Promise<CloseJobCase[]> {
  const api = getSupabase();
  if (!api) return [];
  const { data, error } = await api.from("Cust_Chat⭐BINARY_xXx_STAR")
    .select("id,page_id,page_name,conversation_id,thread_id,customer_id,customer_name,message_id,speaker,is_sent,time,created_at,occurred_at,message_text,tracking_number,order_number,order_number_display,order_time_display,phone,facebook_name,shipping_carrier")
    .order("occurred_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 10000)));
  if (error) fail(error);
  const classify = (value: unknown) => {
    const message = String(value ?? "").replace(/\s+/gu, "");
    if (message.includes("ปิดงาน")) return "ปิดงาน";
    if (message.includes("ยกเลิก") || message.includes("ไม่เอาแล้ว")) return "ยกเลิก / ไม่เอาแล้ว";
    if (/สั่ง.{0,16}แล้วไม่รับ/u.test(message)) return "สั่งแล้วไม่รับ";
    return "";
  };
  return (data ?? []).filter((row: any) => {
    const speaker = String(row.speaker ?? "").toLowerCase();
    return speaker !== "page" && speaker !== "admin" && speaker !== "business" && classify(row.message_text);
  }).map((row: any) => ({
    id: String(row.id ?? row.message_id ?? row.order_number ?? ""),
    page_id: String(row.page_id ?? ""),
    page_name: String(row.page_name ?? ""),
    conversation_key: String(row.conversation_id ?? row.thread_id ?? ""),
    customer_id: String(row.customer_id ?? ""),
    customer_name: String(row.customer_name ?? row.facebook_name ?? ""),
    speaker_type: "customer",
    occurred_at: String(row.occurred_at ?? row.time ?? row.created_at ?? ""),
    message_text: String(row.message_text ?? ""),
    case_type: classify(row.message_text),
    area: "",
    branch: "",
    carrier_employee: "",
    tracking_number: String(row.tracking_number ?? ""),
    order_number: String(row.order_number_display ?? row.order_number ?? ""),
  }));
}
export async function saveCloseJobCaseFields(input: { caseId: string; branch: string; carrierEmployee: string; area: string }) {
  void input;
  return { ok: false, readOnly: true };
}
export async function readParcelMappingQueue(status: "all" | "sent" = "all", limit = 300) {
  const api = getSupabase("parcel");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const safeLimit = Math.max(1, Math.min(limit, 5000));
  const activeData = status === "sent" ? { data: [], error: null } : (await api.from("🦅ROGUE_xXx_SHIPPINGz").select("*").limit(safeLimit));
  if ("error" in activeData && activeData.error) fail(activeData.error);
  const sent = status === "all" || status === "sent" ? await api.from("📓DEAD_xXx_NOTE").select("*").limit(safeLimit) : { data: [], error: null };
  if (sent.error) fail(sent.error);
  // DEAD is the authoritative sent history. If the same parcel briefly exists
  // in both views while the source status is propagating, keep DEAD first so
  // the web never hides a sent row behind the waiting-queue copy.
  const rows = [
    ...(sent.data ?? []).map((row: any) => ({ ...row, parcel_queue_source: "DEAD" })),
    ...( "data" in activeData ? (activeData.data ?? []) : [] ).map((row: any) => ({ ...row, parcel_queue_source: "ROGUE" })),
  ];
  const seen = new Set<string>();
  return rows.map((row: any) => {
    const messageId = String(row.message_id ?? "").trim();
    const recipientId = String(row.recipient_id ?? "").trim();
    return {
      ...row,
      chat_key: messageId && recipientId ? `${messageId}:${recipientId}` : null,
      chat_key_valid: Boolean(messageId && recipientId),
    };
  }).filter((row: any) => {
    // ห้องแชทใช้คีย์คู่เท่านั้น; fallback นี้มีไว้แค่กันแถว parcel ที่ไม่มีข้อมูลแชทหายจากหน้าคิว
    const key = row.chat_key || `parcel:${String(row.id ?? row.tracking_number ?? row.order_number ?? "")}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, safeLimit);
}

export async function readParcelByTrackingNumber(trackingNumber: string) {
  const api = getSupabase("parcel");
  if (!api) fail({ message: "ยังไม่ได้เชื่อมสาย Parcel: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const exact = String(trackingNumber ?? "").trim().toUpperCase();
  if (!exact) return [];
  const { data, error } = await api.from("parcels").select("*").eq("tracking_number", exact).limit(20);
  if (error) fail(error);
  return data ?? [];
}
export type PostalMasterMatch = { district: string | null; amphoe: string | null; province: string | null; zipcode: string | null };
export async function searchThailandPostalMaster(raw: string): Promise<PostalMasterMatch[]> {
  const api = getSupabase("tracking");
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Tracking & Messenger: ไปที่ /secret-gallery แล้วบันทึก URL กับ Anon/Publishable Key" });
  const input = String(raw ?? "").normalize("NFC").trim().slice(0, 160);
  if (!input) return [];
  const postalCode = input.match(/(?:^|\D)(\d{5})(?!\d)/)?.[1] ?? "";
  const text = input.replace(/[,;|\n]+/g, " ");
  const stops = "(?:ตำบล|ต\\.|แขวง|อำเภอ|อ\\.|เขต|จังหวัด|จ\\.|รหัสไปรษณีย์|รหัสปณ)";
  const capture = (labels: string) => {
    const match = text.match(new RegExp(`(?:${labels})\\s*([^,;|]*?)(?=\\s*${stops}|\\d{5}|$)`, "i"));
    return String(match?.[1] ?? "").replace(/\d+/g, " ").replace(/[%_*(),]/g, " ").replace(/[^A-Za-z0-9\u0E00-\u0E7F\s.-]/g, " ").replace(/\s+/g, " ").trim();
  };
  const district = capture("ตำบล|ต\\.|แขวง");
  const amphoe = capture("อำเภอ|อ\\.|เขต");
  let province = capture("จังหวัด|จ\\.");
  if (/^(กรุงเทพฯ?|กทม)$/i.test(province.replace(/[.\s]/g, ""))) province = "กรุงเทพมหานคร";
  const cleanSearch = text.replace(/\d+/g, " ").replace(/(?:หมู่บ้าน|หมู่ที่|หมู่|บ้านเลขที่|เลขที่|ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต)/gi, " ").replace(/[^A-Za-z0-9\u0E00-\u0E7F\s]/g, " ").replace(/\s+/g, " ").trim();
  let data: any[] = [];
  if (postalCode || district || amphoe || province) {
    let request = api.from("thailand_address_master").select("district,amphoe,province,zipcode").limit(50);
    if (postalCode) request = request.eq("zipcode", postalCode);
    else {
      if (district) request = request.ilike("district", `%${district}%`);
      if (amphoe) request = request.ilike("amphoe", `%${amphoe}%`);
      if (province) request = request.ilike("province", `%${province}%`);
    }
    const result = await request.order("province").order("amphoe").order("district");
    if (result.error) fail(result.error);
    data = result.data ?? [];
  } else {
    // No ต./อ./จ. labels? Search each place word across all three columns,
    // then keep the rows that match the greatest number of words.
    const tokens = Array.from(new Set(cleanSearch.split(/\s+/).map((token) => token.trim()).filter((token) => token.length >= 2))).slice(0, 8);
    if (!tokens.length) return [];
    const orFilter = tokens.flatMap((token) => ["district", "amphoe", "province"].map((column) => `${column}.ilike.%${token}%`)).join(",");
    const result = await api.from("thailand_address_master").select("district,amphoe,province,zipcode").or(orFilter).limit(200);
    if (result.error) fail(result.error);
    const rows = result.data ?? [];
    const score = (row: any) => {
      const fields = [row.district, row.amphoe, row.province].map((value) => String(value ?? "").toLowerCase());
      return tokens.filter((token) => fields.some((field) => field.includes(token.toLowerCase()))).length;
    };
    const bestScore = rows.reduce((best, row) => Math.max(best, score(row)), 0);
    data = rows.filter((row) => score(row) === bestScore).sort((a, b) => score(b) - score(a));
  }
  const seen = new Set<string>();
  return data.filter((row: any) => {
    const key = [row.district, row.amphoe, row.province, row.zipcode].map((part) => String(part ?? "").trim()).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }) as PostalMasterMatch[];
}
