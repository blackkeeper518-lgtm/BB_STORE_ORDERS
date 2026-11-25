export type LiveOrderItem = { id?: number; order_id?: number | null; product_id?: number | null; sku?: string | null; th_name?: string | null; product_name?: string | null; label_display?: string | null; emoji?: string | null; extracted_emoji?: string | null; display_for_packer?: string | null; telegram_final_mapped?: string | null; quantity?: number | null; qty?: number | null; extracted_qty?: number | null; unit_price?: number | null; expected_cod?: number | null; stock_qty?: number | null; stock_status?: string | null; raw_product_text?: string | null; raw_product_text_norm?: string | null; mapping_status?: string | null; parser_confidence?: number | null; match_method?: string | null; candidate_skus?: unknown; evidence_sources?: unknown; reject_reason?: string | null };
export type LiveOrder = { id: number; upsert_key: string | null; order_number: string; order_date: string | null; order_time: string | null; order_time_display?: string | null; created_at: string | null; updated_at: string | null; customer_name: string | null; facebook_name: string | null; phone: string | null; full_address: string | null; address_line_1?: string | null; address_line_2?: string | null; district?: string | null; amphoe?: string | null; province?: string | null; zipcode?: string | null; address_display_packer: string | null; page_name: string | null; page_id: string | null; thread_id: string | null; threadId: string | null; recipient_id: string | null; cod_amount: number | null; expected_cod: number | null; sku: string | null; th_name: string | null; emoji: string | null; display_for_packer: string | null; label_display: string | null; telegram_status: string | null; order_status: string | null; audit_status: string | null; audit_flags: string | null; cod_check_status: string | null; is_ready_to_pack: boolean; telegram_message: string | null; telegram_copy_text: string | null; telegram_chat_id: string | null; source_text: string | null; raw_text_with_phone: string | null; raw_text_with_phone_timed: string | null; full_chunk_text: string | null; chat_timeline: string[]; items_json?: unknown; items_text?: string | null; items_count?: number | null; total_quantity?: number | null; items: LiveOrderItem[] };
export type LiveOrderStats = { total: number; mapped: number; review: number; codCheck: number; sent: number; pages: number };
export type LiveThread = { key: string; pageName: string; pageId: string | null; threadId: string | null; customerId: string | null; latestAt: string | null; latestOrderNumber: string; customerName: string | null; preview: string; orderCount: number; unread: boolean; sentCount: number; messageCount: number; customerMessages: number; pageMessages: number; orderSignals: number; snippets: string[]; orders: LiveOrder[]; chatTimeline: string[]; searchText: string };
export type ExternalChatMessage = { id: number; providerMessageId: string | null; source_message_id?: string | null; dedupe_key?: string | null; pageId: string; pageName: string | null; threadId: string; senderId: string; senderName: string | null; customerName: string | null; sender_name?: string | null; customer_name?: string | null; speaker_type?: string; senderType: "customer" | "page"; side: "left" | "right"; direction: "inbound" | "outbound"; text: string | null; message_text?: string | null; attachmentsJson: string | null; occurredAt: string | null; occurred_at?: string | null; source_created_at?: string | null; createdAt: string | null };
export type LiveProductMapping = { sku: string; label: string; price: number | null; emoji: string | null; aliases?: string | null };
export type StockProduct = LiveProductMapping & { id: number; thName: string | null; stockQty: number | null; stockStatus: string | null; status: string | null; updatedAt: string | null };
export type StockWarning = { kind: "duplicate_sku" | "missing_sku"; sku: string | null; label: string | null; count?: number };

export type SupabaseProject = "main" | "tracking" | "chat" | "parcel" | "vault";
export type ChatSupabaseCredentials = { url: string; serviceRoleKey: string };
export const CHAT_CUSTOMER_TABLE = "Cust_Chat⭐BINARY_xXx_STAR";
export const CHAT_PAGE_TABLE = "Pg_Chat⭐BINARY_xXx_STAR";
export const CHAT_PAGE_TOKEN_TABLE = "🌈MILKY_WAY_xXx_TOKEN _PAGE";

function config(project: SupabaseProject = "main") {
  // Tracking and Parcel are two functional lanes backed by the same SB parcel account.
  const lane = project === "parcel" ? "tracking" : project;
  const rawUrl = lane === "chat"
    ? process.env.CHAT_SUPABASE_URL?.trim()
    : lane === "vault"
      ? process.env.VAULT_SUPABASE_URL?.trim()
      : lane === "tracking"
        ? process.env.TRACKING_SUPABASE_URL?.trim()
        : process.env.ORDER_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const key = lane === "chat"
    ? process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY?.trim()
    : lane === "vault"
      ? process.env.VAULT_SUPABASE_SERVICE_ROLE_KEY?.trim()
      : lane === "tracking"
        ? process.env.TRACKING_SUPABASE_SERVICE_ROLE_KEY?.trim()
        : process.env.ORDER_SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !key) throw new Error(`Supabase ${project} server credentials are not configured`);
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new Error("SUPABASE_URL is not a valid URL"); }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) throw new Error(`Invalid Supabase hostname: ${parsed.hostname}`);
  return { baseUrl: parsed.toString().replace(/\/$/, ""), key };
}
export function getServerProjectStatus() {
  const has = (url?: string, key?: string) => Boolean(url?.trim() && key?.trim());
  return {
    order: has(process.env.ORDER_SUPABASE_URL || process.env.SUPABASE_URL, process.env.ORDER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    trackingParcel: has(process.env.TRACKING_SUPABASE_URL, process.env.TRACKING_SUPABASE_SERVICE_ROLE_KEY),
    vault: has(process.env.VAULT_SUPABASE_URL, process.env.VAULT_SUPABASE_SERVICE_ROLE_KEY),
    chat: has(process.env.CHAT_SUPABASE_URL, process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY),
  };
}
const PROJECT_TABLES: Record<SupabaseProject, ReadonlySet<string>> = {
  main: new Set([
    "thailand_address_master", "🌀SINGULARITY_xXx_EXCHANGE", "🌌MULTIVERSE_xXx_NEXUS",
    "🌍GALACTIC_GATEWAY_TOKEN", "🌟GENESIS_xXx_HISTORY", "💀THANATOS_xXx_DEATH_NOTE",
    "🔸PARADOX_xXx_EXCHANGE", "🗝️HERMES_ARCHIVE", "🛒product_master",
    "🛰️PIONEER_xXx_CAPSULE", "🪐ANDROMEDA_xXx_SENT", "🧿BB_xXx_ORDERCONTROL", "product_map_master",
    "canonical_orders", "canonical_order_items", "🌓VAGABOND_xXx_DISMISS", "📓DEAD_xXx_NOTE",
    "🦅ROGUE_xXx_SHIPPINGz", "parcels",
  ]),
  tracking: new Set([
    "parcels", "thailand_address_master", "⛩️VOID_xXx_GATEWAYz", "📓DEAD_xXx_NOTE",
    "🔮SHADOW_xXx_RECALL", "🛒product_master", "🦅ROGUE_xXx_SHIPPINGz",
    "🧿BB_xXx_ORDERCONTROL", "sales_script_cards", "page_tokens_vault",
  ]),
  parcel: new Set([
    "parcels", "thailand_address_master", "⛩️VOID_xXx_GATEWAYz", "📓DEAD_xXx_NOTE",
    "🔮SHADOW_xXx_RECALL", "🛒product_master", "🦅ROGUE_xXx_SHIPPINGz",
    "🧿BB_xXx_ORDERCONTROL", "sales_script_cards", "page_tokens_vault",
  ]),
  vault: new Set([
    "🛒product_master", "inventory", "product_aliases", "product_map_master",
    "app_chat_frames", "app_customization_selections", "app_sounds", "app_themes", "chat_product_highlights",
    "sales_script_cards", "thailand_address_master",
  ]),
  chat: new Set([
    CHAT_CUSTOMER_TABLE, CHAT_PAGE_TABLE, CHAT_PAGE_TOKEN_TABLE, "line_channels", "line_messages",
    "delivery_pre_send_checks", "delivery_red_zone_provinces", "delivery_telegram_urgent_queue",
    "🌓VAGABOND_xXx_DISMISS", "🏴‍☠️SIRIUS_xXx_CRASH",
  ]),
};
const STAFF_READ_COLUMNS: Record<string, ReadonlySet<string>> = {
  "main:🛒product_master": new Set(["emoji", "master_sku", "th_name", "name_standard", "brand", "variant", "unit_price", "alias", "status"]),
  "vault:🛒product_master": new Set(["emoji", "master_sku", "th_name", "name_standard", "brand", "variant", "unit_price", "alias", "status", "stock_qty", "stock_status", "admin_availability"]),
  "tracking:thailand_address_master": new Set(["district", "amphoe", "province", "zipcode"]),
  "vault:thailand_address_master": new Set(["district", "amphoe", "province", "zipcode"]),
  "vault:sales_script_cards": new Set(["id", "sku", "title", "subtitle", "script_text", "ai_context", "ai_instruction", "blocks_json", "status", "version", "updated_at"]),
};
export function canStaffExecuteProjectQuery(input: { project: SupabaseProject; table: string; method: string; params?: Record<string, string> }) {
  if (input.method !== "GET" && input.method !== "HEAD") return false;
  const allowed = STAFF_READ_COLUMNS[`${input.project}:${input.table}`];
  const select = input.params?.select?.trim();
  if (!allowed || !select || select.includes("*") || /[():]/.test(select)) return false;
  const columns = select.split(",").map(column => column.trim());
  if (!columns.length || new Set(columns).size !== columns.length || columns.some(column => !allowed.has(column))) return false;
  const limit = Number(input.params?.limit);
  const offset = Number(input.params?.offset ?? "0");
  return Number.isInteger(limit) && limit > 0 && limit <= 500 && Number.isInteger(offset) && offset >= 0 && offset <= 5000;
}
export function canStaffUploadVaultStorage(input: { operation: string; bucket: string; path?: string; contentBase64?: string; contentType?: string; upsert?: boolean }) {
  const path = (input.path ?? "").trim().replace(/^\/+/, "");
  const allowedPath = (input.bucket === "sales-script-images" && path.startsWith("script-art/chat/"))
    || (input.bucket === "warp-images" && path.startsWith("warp/order-deck/"));
  return input.operation === "upload" && allowedPath && path.length <= 500
    && !path.split("/").some(part => !part || part === "." || part === "..")
    && input.upsert !== true
    && ["image/jpeg", "image/png", "image/gif", "image/webp"].includes((input.contentType ?? "").toLowerCase())
    && Boolean(input.contentBase64) && input.contentBase64!.length <= 24_000_000;
}
export async function executeProjectQuery(input: {
  project: SupabaseProject;
  table: string;
  method: "GET" | "HEAD" | "POST" | "PATCH" | "DELETE";
  params?: Record<string, string>;
  body?: unknown;
  prefer?: string;
}) {
  if (!PROJECT_TABLES[input.project]?.has(input.table)) throw new Error(`Supabase relation is not enabled for ${input.project}`);
  const { baseUrl, key } = config(input.project);
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(input.params ?? {})) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) || value.length > 4000) throw new Error("Invalid Supabase query parameter");
    if (name === "select" && /[()]/.test(value)) throw new Error("Embedded relation selects are not enabled");
    if (name === "limit" && (!/^\d+$/.test(value) || Number(value) > 10_000)) throw new Error("Supabase row limit exceeds the server cap");
    if (name === "offset" && (!/^\d+$/.test(value) || Number(value) > 100_000)) throw new Error("Supabase row offset exceeds the server cap");
    query.set(name, value);
  }
  if ((input.method === "PATCH" || input.method === "DELETE") && !Object.keys(input.params ?? {}).some(name => !["select", "order", "limit", "offset", "on_conflict"].includes(name))) {
    throw new Error("Updates and deletes must include a row filter");
  }
  const url = `${baseUrl}/rest/v1/${encodeURIComponent(input.table)}${query.size ? `?${query.toString()}` : ""}`;
  const headers: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" };
  if (input.body !== undefined) headers["Content-Type"] = "application/json";
  const allowedPrefer = new Set(["return=representation", "return=minimal", "resolution=merge-duplicates,return=representation", "resolution=merge-duplicates,return=minimal", "count=exact", "count=exact,return=representation", "count=exact,return=minimal", "resolution=merge-duplicates,return=representation,count=exact"]);
  if (input.prefer) {
    if (!allowedPrefer.has(input.prefer)) throw new Error("Invalid Supabase preference");
    headers.Prefer = input.prefer;
  }
  const response = await fetch(url, {
    method: input.method,
    headers,
    ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
  });
  const text = input.method === "HEAD" ? "" : await response.text();
  if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { throw new Error("Supabase returned an invalid JSON response"); }
  }
  const contentRange = response.headers.get("content-range") ?? "";
  const total = contentRange.match(/\/(\d+)$/)?.[1];
  return { data, count: total ? Number(total) : null, error: null };
}
const STORAGE_BUCKET_PREFIXES: Record<string, string> = {
  "sales-script-images": "script-art/",
  "chat-sounds": "sounds/",
  "theme-graphics": "themes/",
  "warp-images": "warp/",
};
function safeStoragePath(path: string) {
  const clean = path.trim().replace(/^\/+/, "");
  if (!clean || clean.split("/").some(part => !part || part === "." || part === "..") || clean.length > 500) throw new Error("Invalid storage path");
  return clean;
}
export async function executeVaultStorage(input: {
  operation: "upload" | "remove" | "signed" | "public" | "download";
  bucket: string;
  path?: string;
  paths?: string[];
  contentBase64?: string;
  contentType?: string;
  upsert?: boolean;
  expiresIn?: number;
}) {
  const prefix = STORAGE_BUCKET_PREFIXES[input.bucket];
  if (!prefix) throw new Error("Storage bucket is not enabled for VAULT");
  const { baseUrl, key } = config("vault");
  const base = `${baseUrl}/storage/v1/object`;
  const auth = { apikey: key, Authorization: `Bearer ${key}` };
  const checkedPath = (value: string) => {
    const path = safeStoragePath(value);
    if (!path.startsWith(prefix)) throw new Error(`Storage path must start with ${prefix}`);
    return path;
  };
  if (input.operation === "public") {
    const path = checkedPath(input.path ?? "");
    return { publicUrl: `${base}/public/${encodeURIComponent(input.bucket)}/${path.split("/").map(encodeURIComponent).join("/")}` };
  }
  if (input.operation === "signed") {
    const path = checkedPath(input.path ?? "");
    const response = await fetch(`${base}/sign/${encodeURIComponent(input.bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST", headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: Math.max(60, Math.min(3600, Number(input.expiresIn) || 300)) }),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Vault signed URL failed (${response.status}): ${body.slice(0, 300)}`);
    const payload = JSON.parse(body) as { signedURL?: string };
    if (!payload.signedURL) throw new Error("Vault returned an empty signed URL");
    const signedPath = payload.signedURL.startsWith("/") ? payload.signedURL : `/${payload.signedURL}`;
    return { signedUrl: new URL(`/storage/v1${signedPath}`, baseUrl).toString() };
  }
  if (input.operation === "download") {
    const path = checkedPath(input.path ?? "");
    const response = await fetch(`${base}/${encodeURIComponent(input.bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "GET", headers: auth,
    });
    if (!response.ok) throw new Error(`Vault storage download failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 18_000_000) throw new Error("Asset exceeds the 18 MB server download limit");
    return { contentBase64: bytes.toString("base64"), contentType: response.headers.get("content-type") || "application/octet-stream" };
  }
  if (input.operation === "remove") {
    const paths = (input.paths ?? []).map(checkedPath);
    if (!paths.length || paths.length > 100) throw new Error("Invalid storage removal list");
    const response = await fetch(`${base}/${encodeURIComponent(input.bucket)}`, {
      method: "DELETE", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: paths }),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Vault storage delete failed (${response.status}): ${body.slice(0, 300)}`);
    return { ok: true };
  }
  const path = checkedPath(input.path ?? "");
  if (!input.contentBase64 || input.contentBase64.length > 24_000_000) throw new Error("Asset is missing or exceeds the 18 MB server upload limit");
  const bytes = Buffer.from(input.contentBase64, "base64");
  if (bytes.length > 18_000_000) throw new Error("Asset exceeds the 18 MB server upload limit");
  const response = await fetch(`${base}/${encodeURIComponent(input.bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": input.contentType || "application/octet-stream", "x-upsert": input.upsert ? "true" : "false" },
    body: bytes,
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Vault storage upload failed (${response.status}): ${body.slice(0, 300)}`);
  return { ok: true, path, publicUrl: `${base}/public/${encodeURIComponent(input.bucket)}/${path.split("/").map(encodeURIComponent).join("/")}` };
}

const PROJECT_CONNECTION_CHECKS: Partial<Record<SupabaseProject, Array<{ table: string; label: string }>>> = {
  main: [
    { table: "🗝️HERMES_ARCHIVE", label: "Order Control" },
    { table: "🌌MULTIVERSE_xXx_NEXUS", label: "Telegram Queue" },
    { table: "🌀SINGULARITY_xXx_EXCHANGE", label: "Order Change History" },
    { table: "🛒product_master", label: "Product Master" },
    { table: "🌍GALACTIC_GATEWAY_TOKEN", label: "Page Tokens (server-only)" },
  ],
  tracking: [
    { table: "parcels", label: "Parcel Lookup" },
    { table: "🦅ROGUE_xXx_SHIPPINGz", label: "Tracking Queue" },
    { table: "📓DEAD_xXx_NOTE", label: "Tracking History" },
  ],
  parcel: [
    { table: "parcels", label: "Parcel Lookup" },
    { table: "🦅ROGUE_xXx_SHIPPINGz", label: "Tracking Queue" },
    { table: "📓DEAD_xXx_NOTE", label: "Tracking History" },
  ],
  vault: [
    { table: "🛒product_master", label: "Product Catalog" },
    { table: "thailand_address_master", label: "Thai Address Master" },
    { table: "sales_script_cards", label: "Sales Script Cards" },
    { table: "app_themes", label: "Themes" },
    { table: "app_chat_frames", label: "Chat Frames" },
    { table: "app_sounds", label: "Sounds" },
  ],
  chat: [
    { table: CHAT_CUSTOMER_TABLE, label: "Customer Chat History" },
    { table: CHAT_PAGE_TABLE, label: "Page Chat History" },
    { table: CHAT_PAGE_TOKEN_TABLE, label: "Page Tokens (server-only)" },
  ],
};

export async function checkServerProject(project: "main" | "tracking" | "parcel" | "vault" | "chat") {
  const checks = PROJECT_CONNECTION_CHECKS[project] ?? [];
  const results = await Promise.all(checks.map(async ({ table, label }) => {
    try {
      const result = await executeProjectQuery({ project, table, method: "HEAD", params: { select: "*", limit: "0" }, prefer: "count=exact" });
      return { table, label, status: "ready" as const, count: result.count };
    } catch (error) {
      return { table, label, status: "error" as const, detail: error instanceof Error ? error.message : String(error) };
    }
  }));
  return { project: project === "tracking" || project === "parcel" ? "trackingParcel" : project, results };
}

export async function lookupParcelByPhone(phone: string) {
  const searchPhone = phone.replace(/\D/g, "");
  if (!/^0\d{9}$/.test(searchPhone)) throw new Error("กรุณากรอกเบอร์โทรศัพท์ 10 หลัก");
  const { baseUrl, key } = config("parcel");
  const response = await fetch(`${baseUrl}/rest/v1/rpc/get_parcel_by_phone_v2`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ search_phone: searchPhone }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`get_parcel_by_phone_v2 HTTP ${response.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text) as unknown; } catch { throw new Error("Parcel RPC returned invalid JSON"); }
}
export function getChatSupabaseConfig(credentials?: ChatSupabaseCredentials) {
  return config("chat");
}
export async function supabaseGet<T>(path: string, project: SupabaseProject = "main", browserChatCredentials?: ChatSupabaseCredentials): Promise<T> {
  const { baseUrl, key } = config(project);
  const target = `${baseUrl}/rest/v1/${path.replace(/^\/+/, "")}`;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(target, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json", "Cache-Control": "no-cache" } });
      const body = await response.text();
      if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status} for ${path}: ${body.slice(0, 500)}`);
      try { return JSON.parse(body) as T; } catch { throw new Error(`Supabase returned non-JSON for ${path}: ${body.slice(0, 300)}`); }
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  throw new Error(`Supabase connection failed after 3 attempts (${path}): ${lastError instanceof Error ? lastError.message : String(lastError)}. Target=${target}`);
}
// สัญญาอ่าน ChatHub: อ่านสองฝั่งต้นทางโดยตรง แล้วให้ canonical layer รวมเป็นห้องเดียว
const CHAT_READ_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
type ChatReadFilter = { pageId?: string; threadId?: string };
function chatReadPath(table: string, filter: ChatReadFilter = {}, history = false) {
  const query = new URLSearchParams();
  query.set("select", "*");
  // รายการห้องใช้ recent window เพื่อลดภาระ แต่ห้องที่เปิดอยู่ต้องเห็นประวัติทั้ง thread
  if (!history) query.set("occurred_at", `gte.${new Date(Date.now() - CHAT_READ_WINDOW_MS).toISOString()}`);
  query.set("order", "occurred_at.desc");
  query.set("limit", "10000");
  if (filter.pageId) query.set("page_id", `eq.${filter.pageId}`);
  if (filter.threadId) query.set("thread_id", `eq.${filter.threadId}`);
  return `${encodeURIComponent(table)}?${query.toString()}`;
}
async function fetchChatRows(filter: ChatReadFilter = {}, credentials?: ChatSupabaseCredentials, history = false): Promise<Array<Record<string, unknown>>> {
  const [customerRows, pageRows] = await Promise.all([
    supabaseGet<Array<Record<string, unknown>>>(chatReadPath(CHAT_CUSTOMER_TABLE, filter, history), "chat", credentials),
    supabaseGet<Array<Record<string, unknown>>>(chatReadPath(CHAT_PAGE_TABLE, filter, history), "chat", credentials),
  ]);
  return [
    ...customerRows.map(row => ({ ...row, _source_table: CHAT_CUSTOMER_TABLE })),
    ...pageRows.map(row => ({ ...row, _source_table: CHAT_PAGE_TABLE })),
  ];
}
function isChatStatusEnabled(value: unknown) {
  const status = String(value ?? "").trim().toUpperCase();
  if (!status) return false;
  if (["OFF", "FALSE", "0", "INACTIVE", "DISABLED", "CLOSED", "ปิด", "ปิดใช้งาน"].some(disabled => status === disabled || status.includes(disabled))) return false;
  return ["ON", "TRUE", "1", "ACTIVE", "เปิด", "เปิดใช้งาน", "ใช้งาน", "✅", "🟢"].some(enabled => status === enabled || status.includes(enabled));
}
function effectiveWebStatus(row: Record<string, unknown>) {
  return Object.prototype.hasOwnProperty.call(row, "status_web") && String(row.status_web ?? "").trim() ? row.status_web : row.status;
}
function effectiveChatStatus(row: Record<string, unknown>, surface: "web" | "mobile") {
  return surface === "mobile" ? row.status : effectiveWebStatus(row);
}
async function getActiveChatPageIds(credentials?: ChatSupabaseCredentials, surface: "web" | "mobile" = "web") {
  const query = new URLSearchParams({ select: "page_id,status,status_web", limit: "5000" });
  const rows = await supabaseGet<Array<Record<string, unknown>>>(`${encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)}?${query.toString()}`, "chat", credentials);
  if (!rows.some(row => Object.prototype.hasOwnProperty.call(row, "status_web") || Object.prototype.hasOwnProperty.call(row, "status"))) return null;
  return new Set(rows.filter(row => isChatStatusEnabled(effectiveChatStatus(row, surface))).map(row => String(row.page_id ?? "").trim()).filter(Boolean));
}
export async function fetchChatPages(credentials?: ChatSupabaseCredentials) {
  const query = new URLSearchParams({ select: "page_id,page_name,status,status_web", order: "page_name.asc", limit: "5000" });
  const rows = await supabaseGet<Array<Record<string, unknown>>>(`${encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)}?${query.toString()}`, "chat", credentials);
  return rows.map(row => ({ pageId: String(row.page_id ?? "").trim(), pageName: String(row.page_name ?? "ไม่ระบุเพจ").trim() || "ไม่ระบุเพจ", status: row.status ?? null, statusWeb: row.status_web ?? row.status ?? null, enabledMobile: isChatStatusEnabled(row.status), enabledWeb: isChatStatusEnabled(effectiveWebStatus(row)) })).filter(row => row.pageId);
}
export async function saveChatPage(input: { pageId: string; pageName: string; accessToken?: string; enabledMobile: boolean; enabledWeb: boolean }, credentials?: ChatSupabaseCredentials) {
  const pageId = input.pageId.trim();
  const body: Record<string, unknown> = { page_id: pageId, page_name: input.pageName.trim(), status: input.enabledMobile ? "ON" : "OFF", status_web: input.enabledWeb ? "ON" : "OFF", updated_at: new Date().toISOString() };
  if (input.accessToken?.trim()) body.access_token = input.accessToken.trim();
  const query = `${encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)}?page_id=eq.${encodeURIComponent(pageId)}`;
  const existing = await supabaseGet<Array<Record<string, unknown>>>(`${query}&select=page_id`, "chat", credentials);
  if (existing.length) return (await supabasePatch<Array<Record<string, unknown>>>(query, body, "chat", credentials))[0] ?? null;
  if (!body.access_token) throw new Error("เพิ่มเพจใหม่ต้องใส่ Page Access Token");
  return (await supabasePost<Array<Record<string, unknown>>>(encodeURIComponent(CHAT_PAGE_TOKEN_TABLE), body, "chat", "return=representation", credentials))[0] ?? null;
}
export async function deleteChatPage(pageId: string, credentials?: ChatSupabaseCredentials) {
  return supabaseDelete<Array<Record<string, unknown>>>(`${encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)}?page_id=eq.${encodeURIComponent(pageId)}`, "chat", credentials);
}
export async function setChatPageWebStatus(pageId: string, enabled: boolean, credentials?: ChatSupabaseCredentials) {
  const query = `${encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)}?page_id=eq.${encodeURIComponent(pageId)}`;
  return supabasePatch<Array<Record<string, unknown>>>(query, { status_web: enabled ? "ON" : "OFF" }, "chat", credentials);
}
export async function setChatPageAppStatus(pageId: string, enabled: boolean, credentials?: ChatSupabaseCredentials) {
  const query = `${encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)}?page_id=eq.${encodeURIComponent(pageId)}`;
  return supabasePatch<Array<Record<string, unknown>>>(query, { status: enabled ? "ON" : "OFF" }, "chat", credentials);
}
export async function assertChatPageEnabled(pageId: string, credentials?: ChatSupabaseCredentials, surface: "web" | "mobile" = "web") {
  const activeIds = await getActiveChatPageIds(credentials, surface);
  if (activeIds && !activeIds.has(pageId.trim())) throw new Error("เพจนี้ถูกปิดใช้งานโดยผู้ดูแลระบบ");
}
export async function fetchChatThreadRows(credentials?: ChatSupabaseCredentials, surface: "web" | "mobile" = "web") {
  const [rows, activeIds] = await Promise.all([fetchChatRows({}, credentials), getActiveChatPageIds(credentials, surface)]);
  return activeIds ? rows.filter(row => activeIds.has(String(row.page_id ?? "").trim())) : rows;
}
export async function fetchChatNotificationRows(afterRowId: string | null, credentials?: ChatSupabaseCredentials) {
  const relation = encodeURIComponent(CHAT_CUSTOMER_TABLE);
  if (afterRowId === null) {
    const query = new URLSearchParams({ select: "message_row_id", order: "message_row_id.desc", limit: "1" });
    const latest = await supabaseGet<Array<Record<string, unknown>>>(`${relation}?${query.toString()}`, "chat", credentials);
    return { rows: [], cursorRowId: String(latest[0]?.message_row_id ?? "0") };
  }
  if (!/^\d+$/.test(afterRowId)) throw new Error("Chat notification cursor ไม่ถูกต้อง");

  const pageSize = 1000;
  const rows: Array<Record<string, unknown>> = [];
  let pageCursor = BigInt(afterRowId).toString();
  while (true) {
    const query = new URLSearchParams({
      select: "*",
      message_row_id: `gt.${pageCursor}`,
      order: "message_row_id.asc",
      limit: String(pageSize),
    });
    const page = await supabaseGet<Array<Record<string, unknown>>>(`${relation}?${query.toString()}`, "chat", credentials);
    if (!Array.isArray(page)) throw new Error("Chat notification response ไม่ใช่รายการข้อมูล");
    rows.push(...page.map(row => ({ ...row, _source_table: CHAT_CUSTOMER_TABLE })));
    if (page.length < pageSize) break;

    const lastRowId = String(page[page.length - 1]?.message_row_id ?? "");
    if (!/^\d+$/.test(lastRowId) || BigInt(lastRowId) <= BigInt(pageCursor)) {
      throw new Error("Chat notification page cursor ไม่ขยับ; หยุดเพื่อป้องกันการข้ามข้อความ");
    }
    pageCursor = lastRowId;
  }
  const cursorRowId = String(rows[rows.length - 1]?.message_row_id ?? afterRowId);
  return { rows, cursorRowId };
}
export async function fetchChatMessageRows(input: { pageId: string; threadId: string }, credentials?: ChatSupabaseCredentials, surface: "web" | "mobile" = "web") {
  await assertChatPageEnabled(input.pageId, credentials, surface);
  return fetchChatRows({ pageId: input.pageId, threadId: input.threadId }, credentials, true);
}
const CHAT_CONNECTION_CHECKS = [
  { name: CHAT_CUSTOMER_TABLE, columns: "id,page_id,thread_id,message_text,customer_message_text,phone" },
  { name: CHAT_PAGE_TABLE, columns: "id,page_id,thread_id,message_text" },
  { name: CHAT_PAGE_TOKEN_TABLE, columns: "page_id,access_token" },
  { name: "delivery_pre_send_checks", columns: "*" },
  { name: "delivery_red_zone_provinces", columns: "*" },
  { name: "delivery_telegram_urgent_queue", columns: "*" },
  { name: "line_channels", columns: "*" },
  { name: "line_messages", columns: "*" },
  { name: "🌓VAGABOND_xXx_DISMISS", columns: "*" },
  { name: "🏴‍☠️SIRIUS_xXx_CRASH", columns: "*" },
] as const;
export async function checkChatConnection(credentials?: ChatSupabaseCredentials) {
  const results = await Promise.all(CHAT_CONNECTION_CHECKS.map(async ({ name, columns }) => {
    const query = new URLSearchParams({ select: columns, limit: "0" });
    try {
      await supabaseGet<Array<Record<string, unknown>>>(`${encodeURIComponent(name)}?${query.toString()}`, "chat", credentials);
      return { name, status: "ready" as const };
    } catch {
      return { name, status: "error" as const };
    }
  }));
  // ส่งกลับเฉพาะชื่อและสถานะ object; ห้ามส่ง page token หรือข้อมูลแชทออกจาก server
  return {
    checked: results.filter(result => result.status === "ready").map(({ name }) => name),
    results,
  };
}
export async function supabasePost<T>(path: string, body: unknown, project: SupabaseProject = "main", prefer?: string, browserChatCredentials?: ChatSupabaseCredentials): Promise<T> { const { baseUrl, key } = config(project); const headers: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }; if (prefer) headers.Prefer = prefer; const response = await fetch(`${baseUrl}/rest/v1/${path}`, { method: "POST", headers, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`); return response.json() as Promise<T>; }

export type ChatProductHighlights = { configured: boolean; productNames: string[] };
function normalizeChatProductHighlights(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map(item => item.trim().slice(0, 120)).filter(Boolean))].slice(0, 30);
}
export async function fetchChatProductHighlights(appKey: "BB_STORE_ORDERS" | "BB_STORE_ORDERS"): Promise<ChatProductHighlights> {
  const rows = await supabaseGet<Array<{ product_names?: unknown }>>(`chat_product_highlights?select=product_names&app_key=eq.${encodeURIComponent(appKey)}&limit=1`, "vault");
  return { configured: rows.length > 0, productNames: normalizeChatProductHighlights(rows[0]?.product_names) };
}
export async function saveChatProductHighlights(appKey: "BB_STORE_ORDERS" | "BB_STORE_ORDERS", productNames: unknown): Promise<ChatProductHighlights> {
  const normalized = normalizeChatProductHighlights(productNames);
  const rows = await supabasePost<Array<{ product_names?: unknown }>>("chat_product_highlights?on_conflict=app_key", { app_key: appKey, product_names: normalized }, "vault", "resolution=merge-duplicates,return=representation");
  return { configured: true, productNames: normalizeChatProductHighlights(rows[0]?.product_names ?? normalized) };
}
export async function supabasePatch<T>(path: string, body: unknown, project: SupabaseProject = "main", browserChatCredentials?: ChatSupabaseCredentials): Promise<T> { const { baseUrl, key } = config(project); const response = await fetch(`${baseUrl}/rest/v1/${path.replace(/^\/+/, "")}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`); const text = await response.text(); return (text ? JSON.parse(text) : []) as T; }
export async function supabaseDelete<T>(path: string, project: SupabaseProject = "main", browserChatCredentials?: ChatSupabaseCredentials): Promise<T> { const { baseUrl, key } = config(project); const response = await fetch(`${baseUrl}/rest/v1/${path.replace(/^\/+/, "")}`, { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=representation" } }); if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`); const text = await response.text(); return (text ? JSON.parse(text) : []) as T; }
export async function recordOutgoingChatMessage(input: { portalKey?: string; chatLinkKey?: string; pageId: string; pageName?: string; threadId: string; recipientId: string; messageId?: string; text?: string; imageUrl?: string; occurredAt?: Date }, credentials?: ChatSupabaseCredentials) {
  const occurredAt = input.occurredAt ?? new Date();
  const iso = occurredAt.toISOString();
  const messageId = input.messageId?.trim() || null;
  const roomChatLinkKey = input.chatLinkKey?.trim() || `${input.pageId}_t_${input.threadId}`;
  // ST's current Pg schema uses chat_link_key as the primary key even though
  // one room contains many messages. Keep the canonical room key as a prefix,
  // but make each persisted outgoing row unique so polling cannot lose it.
  const chatLinkKey = `${roomChatLinkKey}:${messageId || iso}`;
  // Pg Chat is append-only for outgoing messages. Keep this payload limited to
  // columns that exist in Pg_Chat⭐BINARY_xXx_STAR; do not write to the order
  // control table from the chat lane.
  const attachmentUrl = input.imageUrl?.trim() || null;
  const pageMessagePayload = {
    chat_link_key: chatLinkKey,
    page_id: input.pageId,
    page_name: input.pageName?.trim() || null,
    portal_key: input.portalKey?.trim() || null,
    thread_id: input.threadId,
    recipient_id: input.recipientId,
    message_id: messageId,
    speaker: "page",
    is_sent: true,
    time: iso,
    occurred_at: iso,
    message_time_display: iso,
    message_text: input.text?.trim() || (input.imageUrl ? "📷 ส่งรูปภาพ" : null),
    page_message_text: input.text?.trim() || (input.imageUrl ? "📷 ส่งรูปภาพ" : null),
    has_attachment: Boolean(attachmentUrl),
    attachment_type: attachmentUrl ? "image" : null,
    attachment_url: attachmentUrl,
    attachment_urls: attachmentUrl ? [attachmentUrl] : [],
    attachments_raw: attachmentUrl ? [{ url: attachmentUrl, type: "image" }] : [],
    page_latest_message: input.text?.trim() || (input.imageUrl ? "📷 ส่งรูปภาพ" : null),
    page_message_time_th: iso,
    sync_status: "SENT",
    dedupe_key: messageId ? `${roomChatLinkKey}:${messageId}` : `${roomChatLinkKey}:${iso}`,
  };
  const isMissingPageMessageTextColumn = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error ?? "");
    return /page_message_text/i.test(message) && /PGRST204|42703|column|schema cache|could not find/i.test(message);
  };
  const postPageMessage = (payload: unknown) =>
    supabasePost<Record<string, unknown>[]>(encodeURIComponent(CHAT_PAGE_TABLE), payload, "chat", "return=representation", credentials);
  try {
    return await postPageMessage(pageMessagePayload);
  } catch (error) {
    let insertError = error;
    // The base chat DDL has message_text; page_message_text is an optional follow-up migration.
    // Retry with the BB-compatible base field if that migration is not present in this project.
    if (isMissingPageMessageTextColumn(error)) {
      const { page_message_text: _unsupportedField, ...legacyPayload } = pageMessagePayload;
      try {
        return await postPageMessage(legacyPayload);
      } catch (legacyError) {
        insertError = legacyError;
      }
    }
    // A webhook may have inserted the Meta message first. In that race, the
    // provider message_id is unique; enrich that existing row with the image
    // instead of losing the attachment after the next polling refresh.
    if (!messageId || !attachmentUrl) throw insertError;
    const patchPayload = {
      page_message_text: pageMessagePayload.page_message_text,
      message_text: pageMessagePayload.message_text,
      has_attachment: true,
      attachment_type: "image",
      attachment_url: attachmentUrl,
      attachment_urls: [attachmentUrl],
      attachments_raw: [{ url: attachmentUrl, type: "image" }],
      is_sent: true,
      sync_status: "SENT",
    };
    try {
      const patched = await supabasePatch<Record<string, unknown>[]>(
        `${encodeURIComponent(CHAT_PAGE_TABLE)}?message_id=eq.${encodeURIComponent(messageId)}`,
        patchPayload,
        "chat",
        credentials,
      );
      if (patched.length) return patched;
    } catch (patchError) {
      if (!isMissingPageMessageTextColumn(patchError)) throw patchError;
      const { page_message_text: _unsupportedField, ...legacyPatchPayload } = patchPayload;
      const patched = await supabasePatch<Record<string, unknown>[]>(
        `${encodeURIComponent(CHAT_PAGE_TABLE)}?message_id=eq.${encodeURIComponent(messageId)}`,
        legacyPatchPayload,
        "chat",
        credentials,
      );
      if (patched.length) return patched;
    }
    throw insertError;
  }
}
export async function fetchParcelMappingQueue(input: { status: "all" | "sent"; limit: number }) {
  // These are quoted PostgreSQL relation names; keep the space after the emoji.
  // n8n owns the pipeline mutations. This room only reads the queue and history.
  const activeView = encodeURIComponent("🦅ROGUE_xXx_SHIPPINGz");
  const sentView = encodeURIComponent("📓DEAD_xXx_NOTE");
  const activeQuery = `select=*&limit=${input.limit}`;
  const sentQuery = `select=*&limit=${input.limit}`;
  const active = input.status === "sent" ? [] : await supabaseGet<Array<Record<string, unknown>>>(`${activeView}?${activeQuery}`, "parcel");
  const sent = input.status === "sent" ? await supabaseGet<Array<Record<string, unknown>>>(`${sentView}?${sentQuery}`, "parcel") : [];
  return [...active, ...sent].slice(0, input.limit);
}
export async function purgeOldParcels() {
  const deleted = await supabasePost<number>("rpc/ST_purge_old_parcels_3day", {}, "parcel");
  return { deleted: Number(deleted) || 0 };
}
function text(v: unknown) { return v == null ? null : String(v); }
function num(v: unknown) { const n = Number(v); return v == null || v === "" || !Number.isFinite(n) ? null : n; }
function bool(v: unknown) { return v === true || v === "true" || v === 1; }
function timeline(v: unknown) { if (Array.isArray(v)) return v.map(String).filter(Boolean); if (typeof v === "string" && v.trim()) { try { const parsed = JSON.parse(v); if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean); } catch {} return v.split("\n").map(s => s.trim()).filter(Boolean); } return []; }
function normalizeItem(r: Record<string, unknown>): LiveOrderItem { return { id: num(r.id) ?? undefined, order_id: num(r.order_id), product_id: num(r.product_id), sku: text(r.sku), th_name: text(r.th_name), product_name: text(r.product_name), label_display: text(r.label_display), emoji: text(r.emoji), extracted_emoji: text(r.extracted_emoji), display_for_packer: text(r.display_for_packer), telegram_final_mapped: text(r.display_for_packer), quantity: num(r.quantity), qty: num(r.quantity), extracted_qty: num(r.extracted_qty), unit_price: num(r.unit_price), expected_cod: num(r.expected_cod), mapping_status: text(r.mapping_status), stock_qty: num(r.stock_qty), stock_status: text(r.stock_status), raw_product_text: text(r.raw_product_text), raw_product_text_norm: text(r.raw_product_text_norm), parser_confidence: num(r.parser_confidence), match_method: text(r.match_method), candidate_skus: r.candidate_skus, evidence_sources: r.evidence_sources, reject_reason: text(r.reject_reason) }; }
function normalizeOrder(r: Record<string, unknown>, items: LiveOrderItem[]): LiveOrder { const sourcePayload = (() => { if (r.source_payload && typeof r.source_payload === "object") return r.source_payload as Record<string, unknown>; if (typeof r.source_payload === "string") { try { const parsed = JSON.parse(r.source_payload); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {}; } catch { return {}; } } return {}; })(); const raw = text(r.source_text ?? r.clean_text ?? sourcePayload.raw_text); const chat = timeline(r.chat_timeline ?? sourcePayload.chat_timeline ?? raw); const thread = text(r.source_chat_id); const cod = num(r.cod_amount) ?? num(r.expected_cod); const orderTime = text(r.order_time); return { id: num(r.id) ?? 0, upsert_key: text(r.upsert_key), order_number: text(r.order_number) ?? `#${r.id ?? "unknown"}`, order_date: orderTime?.slice(0, 10) ?? text(r.created_at)?.slice(0, 10) ?? null, order_time: orderTime, order_time_display: text(r.order_time_display), created_at: text(r.created_at), updated_at: text(r.updated_at), customer_name: text(r.customer_name ?? r.facebook_name), facebook_name: text(r.facebook_name), phone: text(r.phone), full_address: text(r.full_address), address_line_1: text(r.address_line_1), address_line_2: text(r.address_line_2), district: text(r.district), amphoe: text(r.amphoe), province: text(r.province), zipcode: text(r.zipcode), address_display_packer: text(r.full_address), page_name: text(r.page_name), page_id: text(r.page_id), thread_id: thread, threadId: thread, recipient_id: text(r.recipient_id), cod_amount: cod, expected_cod: num(r.expected_cod) ?? cod, sku: items[0]?.sku ?? null, th_name: items[0]?.th_name ?? null, emoji: items[0]?.emoji ?? null, display_for_packer: items.map(i => i.display_for_packer ?? i.label_display ?? i.product_name ?? i.raw_product_text ?? i.sku ?? "").filter(Boolean).join("\n") || null, label_display: items[0]?.label_display ?? null, telegram_status: text(r.view_status), order_status: text(r.order_status), audit_status: text(r.mapping_status), audit_flags: text(r.warning_text), cod_check_status: text(r.cod_check_status) ?? (cod == null ? "CHECK" : "PASS"), is_ready_to_pack: text(r.mapping_status) === "MATCHED" && text(r.order_status) === "READY", telegram_message: text(r.telegram_body_view), telegram_copy_text: text(r.telegram_body_view), telegram_chat_id: text(r.telegram_view_chat_id), source_text: raw, raw_text_with_phone: raw, raw_text_with_phone_timed: raw, full_chunk_text: raw, chat_timeline: chat, items_json: items, items_text: items.map(i => i.display_for_packer ?? i.product_name ?? i.raw_product_text ?? i.sku ?? "").join("\n"), items_count: items.length, total_quantity: items.reduce((s, i) => s + Number(i.quantity ?? 0), 0), items }; }
function parseObjectArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).items)) return (parsed as any).items.filter((item: unknown) => Boolean(item) && typeof item === "object" && !Array.isArray(item));
    } catch { /* plain text is handled by the HERMES row fallback below */ }
  }
  return [];
}
function hermesItems(row: Record<string, unknown>): LiveOrderItem[] {
  for (const value of [row.product_items_matched, row.product_items_v5, row.product_map_items, row.orderItems]) {
    const parsed = parseObjectArray(value);
    if (parsed.length) return parsed.map(normalizeItem);
  }
  const product = text(row.final_display_for_packer ?? row.order_fibo_product ?? row.for_packer_st_display ?? row.manus_for_packer ?? row.google_for_packer ?? row.telegram_product_display);
  if (!product && !row.sku) return [];
  return [normalizeItem({
    sku: row.master_sku ?? row.sku,
    th_name: row.trusted_product ?? row.final_product ?? row.sku,
    product_name: product,
    display_for_packer: product,
    quantity: row.final_order_qty ?? row.extracted_text_qty ?? row.qty_display_th,
    mapping_status: row.mapping_status ?? row.product_mapping_status,
    expected_cod: row.expected_cod,
  })];
}
function stableOrderId(key: unknown, index: number) {
  const source = String(key ?? "");
  if (!source) return index + 1;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) hash = (hash * 31 + source.charCodeAt(i)) | 0;
  return Math.abs(hash) || index + 1;
}
async function orderRows(limit = 3000) {
  const relation = encodeURIComponent("🗝️HERMES_ARCHIVE");
  return supabaseGet<Array<Record<string, unknown>>>(`${relation}?select=*&order=order_time_display.desc.nullslast&limit=${limit}`);
}
export async function fetchLiveOrders(search?: string) {
  const response = await orderRows();
  const rows = Array.isArray(response)
    ? response.filter((row): row is Record<string, unknown> => row !== null && typeof row === "object" && !Array.isArray(row))
    : [];
  const q = search?.trim().toLowerCase();
  return rows.map((row, index) => {
    const items = hermesItems(row);
    const eligible = bool(row.send_eligible) || bool(row.telegram_bill_send_eligible) || bool(row.bill_data_complete);
    const viewRow = {
      ...row,
      id: num(row.id) ?? stableOrderId(row.upsert_key, index),
      source_chat_id: row.source_chat_id ?? row.threadId ?? row.thread_id,
      source_text: row.source_text ?? row.original ?? row.telegram_copy_text ?? row.telegram_message,
      full_address: row.final_address_for_bill ?? row.full_address ?? row.address_display_packer ?? row.addressclean,
      order_status: eligible ? "READY" : row.life_status ?? row.status_color ?? row.routing_tag,
      mapping_status: row.mapping_status ?? row.product_mapping_status ?? (eligible ? "MATCHED" : null),
      view_status: row.telegram_status ?? row.delivery_state ?? row.delivery_status,
      telegram_body_view: row.telegram_message_for_send_final ?? row.telegram_main_bill ?? row.telegram_body ?? row.telegram_copy_text ?? row.telegram_message,
    };
    return normalizeOrder(viewRow, items);
  }).filter(order => !q || JSON.stringify(order).toLowerCase().includes(q));
}
export function getLiveOrderStats(orders: LiveOrder[]): LiveOrderStats { const safeOrders = Array.isArray(orders) ? orders.filter((order): order is LiveOrder => order !== null && typeof order === "object") : []; return { total: safeOrders.length, mapped: safeOrders.filter(o => o.is_ready_to_pack).length, review: safeOrders.filter(o => !o.is_ready_to_pack).length, codCheck: safeOrders.filter(o => o.cod_check_status !== "PASS").length, sent: safeOrders.filter(o => String(o.telegram_status ?? "").toUpperCase() === "SENT").length, pages: new Set(safeOrders.map(o => o.page_id).filter(Boolean)).size }; }
export async function fetchLiveThreads(search?: string) { const orders = await fetchLiveOrders(search); const map = new Map<string, LiveThread>(); for (const order of orders) { const key = `${order.page_id ?? ""}:${order.thread_id ?? order.order_number}`; const current = map.get(key) ?? { key, pageName: order.page_name ?? "ไม่ระบุเพจ", pageId: order.page_id, threadId: order.thread_id, customerId: order.recipient_id ?? null, latestAt: order.created_at, latestOrderNumber: order.order_number, customerName: order.customer_name, preview: order.source_text ?? order.display_for_packer ?? "", orderCount: 0, unread: false, sentCount: 0, messageCount: 0, customerMessages: 0, pageMessages: 0, orderSignals: 0, snippets: [], orders: [], chatTimeline: [], searchText: "" }; current.orders.push(order); current.orderCount++; current.messageCount += order.chat_timeline.length; current.customerMessages = (current.customerMessages ?? 0) + order.chat_timeline.filter(x => !/เพจ|admin|แอดมิน/i.test(x)).length; current.pageMessages = (current.pageMessages ?? 0) + order.chat_timeline.filter(x => /เพจ|admin|แอดมิน/i.test(x)).length; current.orderSignals = current.orderCount; current.snippets = [...(current.snippets ?? []), ...order.chat_timeline.slice(0, 3)]; current.chatTimeline.push(...order.chat_timeline); current.searchText += ` ${order.customer_name ?? ""} ${order.source_text ?? ""} ${order.order_number}`; map.set(key, current); } return Array.from(map.values()).sort((a, b) => String(b.latestAt).localeCompare(String(a.latestAt))); }
export async function fetchExternalChatMessages(pageId: string, threadId: string): Promise<ExternalChatMessage[]> { const orders = (await fetchLiveOrders()).filter(o => o.page_id === pageId && o.thread_id === threadId); return orders.flatMap(o => o.chat_timeline.map((line, i) => { const outbound = /เพจ|admin|แอดมิน/i.test(line); return { id: o.id * 10000 + i, providerMessageId: null, pageId, pageName: o.page_name, threadId, senderId: o.recipient_id ?? "", senderName: o.customer_name, customerName: o.customer_name, sender_name: o.customer_name, customer_name: o.customer_name, speaker_type: outbound ? "page" : "customer", senderType: outbound ? "page" : "customer", side: outbound ? "right" : "left", direction: outbound ? "outbound" : "inbound", text: line, message_text: line, attachmentsJson: null, occurredAt: o.order_time, occurred_at: o.order_time, source_created_at: o.created_at, createdAt: o.created_at, source_message_id: null, dedupe_key: `:` }; })); }
export async function fetchConversationEvidence(pageId: string, threadId: string) { return fetchExternalChatMessages(pageId, threadId); }
export async function fetchDailyChatOrderSummary(date: string) { const orders = await fetchDailyOrderHistory(date); const threads = await fetchLiveThreads(); const dayThreads = threads.filter(t => t.orders.some(o => o.order_date === date)); return { date, total: orders.total, orders: orders.orders, threads: dayThreads, totalMessages: dayThreads.reduce((s, t) => s + t.messageCount, 0), customerMessages: dayThreads.reduce((s, t) => s + t.chatTimeline.filter(x => !/เพจ|admin|แอดมิน/i.test(x)).length, 0), pageMessages: dayThreads.reduce((s, t) => s + t.chatTimeline.filter(x => /เพจ|admin|แอดมิน/i.test(x)).length, 0), threadCount: dayThreads.length, orderSignalThreads: dayThreads.filter(t => t.orderCount > 0).length }; }
export async function fetchDailyOrderHistory(date: string, search?: string) { const orders = (await fetchLiveOrders(search)).filter(o => (o.order_date ?? o.created_at?.slice(0, 10)) === date); return { date, total: orders.length, orders }; }
export async function fetchStockProducts(): Promise<StockProduct[]> { const products = await supabaseGet<Array<Record<string, unknown>>>("product_master?select=*&order=sku.asc&limit=5000"); const [inventoryResult, aliasesResult] = await Promise.allSettled([supabaseGet<Array<Record<string, unknown>>>("inventory?select=*&limit=5000"), supabaseGet<Array<Record<string, unknown>>>("product_aliases?select=*&mapping_status=eq.APPROVED&limit=10000")]); const inventory = inventoryResult.status === "fulfilled" ? inventoryResult.value : []; const aliases = aliasesResult.status === "fulfilled" ? aliasesResult.value : []; const inv = new Map(inventory.map(r => [String(r.product_id), r])); const alias = new Map<string, string>(); for (const a of aliases) { const k = String(a.product_id); alias.set(k, [...(alias.get(k)?.split(", ") ?? []), String(a.alias_text ?? "")].filter(Boolean).join(", ")); } return products.map(r => { const i = inv.get(String(r.id)); return { id: Number(r.id), sku: String(r.sku ?? ""), label: String(r.label_display ?? r.display_for_packer ?? r.name_standard ?? r.sku ?? ""), price: num(r.unit_price), emoji: text(r.emoji), aliases: alias.get(String(r.id)) ?? null, thName: text(r.th_name), stockQty: num(i?.stock_qty), stockStatus: text(i?.stock_status), status: text(r.status), updatedAt: text(i?.updated_at ?? r.updated_at) }; }); }
export async function fetchStockWarnings(): Promise<StockWarning[]> { const p = await supabaseGet<Array<Record<string, unknown>>>("product_master?select=sku,th_name,label_display&limit=5000"); const seen = new Set<string>(); const warnings: StockWarning[] = []; for (const r of p) { const sku = text(r.sku); if (!sku) warnings.push({ kind: "missing_sku", sku: null, label: text(r.th_name ?? r.label_display) }); else if (seen.has(sku)) warnings.push({ kind: "duplicate_sku", sku, label: text(r.th_name ?? r.label_display) }); else seen.add(sku); } return warnings; }
export async function updateStockProduct(id: number, input: { stockQty?: number; stockStatus?: string; labelDisplay?: string; unitPrice?: number }) { const { baseUrl, key } = config(); if (input.labelDisplay !== undefined || input.unitPrice !== undefined) { const body: Record<string, unknown> = {}; if (input.labelDisplay !== undefined) body.label_display = input.labelDisplay; if (input.unitPrice !== undefined) body.unit_price = input.unitPrice; await fetch(`${baseUrl}/rest/v1/product_master?id=eq.${id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); } if (input.stockQty !== undefined || input.stockStatus !== undefined) { const body: Record<string, unknown> = {}; if (input.stockQty !== undefined) body.stock_qty = input.stockQty; if (input.stockStatus !== undefined) body.stock_status = input.stockStatus; await fetch(`${baseUrl}/rest/v1/inventory?product_id=eq.${id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); } return fetchStockProducts(); }
export async function updateProductMapAlias(sku: string, alias: string) { const products = await supabaseGet<Array<{ id: number }>>(`product_master?select=id&sku=eq.${encodeURIComponent(sku)}&limit=1`); const product = products[0]; if (!product) throw new Error(`SKU not found: ${sku}`); const { baseUrl, key } = config(); await fetch(`${baseUrl}/rest/v1/product_aliases`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ product_id: product.id, alias_text: alias.trim(), alias_norm: alias.trim().toLowerCase(), mapping_status: "APPROVED" }) }); return { ok: true, sku, alias: alias.trim() }; }
export async function fetchOrdersForThread(pageId: string, threadId: string) { return (await fetchLiveOrders()).filter(o => o.page_id === pageId && o.thread_id === threadId); }

export type ProductAlienTerm = Record<string, unknown>;
export async function listProductAlienTerms(search = "") {
  const filter = search.trim() ? `&or=(raw_text.ilike.*${encodeURIComponent(search.trim())}*,alias_text.ilike.*${encodeURIComponent(search.trim())}*,order_number.ilike.*${encodeURIComponent(search.trim())}*)` : "";
  return supabaseGet<ProductAlienTerm[]>(`product_alien_terms?select=*&order=created_at.desc&limit=500${filter}`);
}
export async function createProductAlienTerm(input: ProductAlienTerm) {
  return supabasePost<ProductAlienTerm>("product_alien_terms", { ...input, raw_text: String(input.raw_text ?? ""), mapping_status: input.mapping_status ?? "REVIEW" });
}
export async function listProductAlienMapReviews() {
  return supabaseGet<ProductAlienTerm[]>("product_alien_map_reviews?select=*&order=created_at.desc&limit=500");
}
export async function createProductAlienMapReview(input: ProductAlienTerm) {
  return supabasePost<ProductAlienTerm>("product_alien_map_reviews", { ...input, raw_text: String(input.raw_text ?? ""), mapping_status: input.mapping_status ?? "REVIEW" });
}
export async function listCanonicalAliases() { return supabaseGet<Array<Record<string, unknown>>>("product_aliases?select=*&order=updated_at.desc&limit=10000"); }
export async function createCanonicalAlias(input: { alias: string; canonicalSku: string; canonicalLabel: string }) { const products = await supabaseGet<Array<{ id: number }>>(`product_master?select=id&sku=eq.${encodeURIComponent(input.canonicalSku)}&limit=1`); const product = products[0]; if (!product) throw new Error(`SKU not found: ${input.canonicalSku}`); await supabasePost("product_aliases", { product_id: product.id, alias_text: input.alias.trim(), alias_norm: input.alias.trim().toLowerCase(), mapping_status: "APPROVED", note: input.canonicalLabel }); return listCanonicalAliases(); }
export async function updateCanonicalAlias(input: { id: number; alias: string; canonicalSku: string; canonicalLabel: string; isActive?: boolean }) { const products = await supabaseGet<Array<{ id: number }>>(`product_master?select=id&sku=eq.${encodeURIComponent(input.canonicalSku)}&limit=1`); const { baseUrl, key } = config(); const body = { product_id: products[0]?.id ?? null, alias_text: input.alias.trim(), alias_norm: input.alias.trim().toLowerCase(), mapping_status: input.isActive === false ? "REJECTED" : "APPROVED", note: input.canonicalLabel }; await fetch(`${baseUrl}/rest/v1/product_aliases?id=eq.${input.id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); return listCanonicalAliases(); }
