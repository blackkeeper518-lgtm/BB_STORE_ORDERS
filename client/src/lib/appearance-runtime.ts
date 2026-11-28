import { THEME_LAB_ROOMS, type ThemeLabRoom } from "@/lib/theme-lab";

export const APPEARANCE_ARCHITECTURE_ENABLED = true;
export const APPEARANCE_EVENT = "bb-appearance-selection-change";
const APPEARANCE_APPLIED_KEY = "bb-appearance-applied-v1";
const APPEARANCE_DRAFT_KEY = "bb-appearance-draft-v1";
const APPEARANCE_APP_KEY = "BB_STORE";
const APPEARANCE_ASSET_TYPES = ["theme", "frame", "atmosphere", "card_style", "background"] as const;
const BACKGROUND_CATALOG_KEY = "bb-appearance-background-catalog-v1";

type AppearanceApi = { from: (table: string) => any };
type AppearanceAssetType = (typeof APPEARANCE_ASSET_TYPES)[number];
type AppearanceSelectionRow = { app_key: string; scope_key: string; asset_type: AppearanceAssetType; asset_key: string; is_active: boolean };
export type BackgroundOption = { key: string; name: string; description: string; type: string; config: Record<string, unknown> };

export type AtmosphereKey = "original-space" | "ops-blue" | "quiet-black" | "signal-amber";
export type CardStyleKey = "balanced" | "glass" | "dense" | "solid";

export type AppearanceSelection = {
  atmosphereKey: AtmosphereKey;
  themeKey: string | null;
  cardStyleKey: CardStyleKey;
  frameKey: string | null;
  backgroundKey: string;
};

export type AppearanceStore = Record<string, AppearanceSelection>;

export const DEFAULT_APPEARANCE: AppearanceSelection = {
  atmosphereKey: "original-space",
  themeKey: null,
  cardStyleKey: "balanced",
  frameKey: null,
  backgroundKey: "original-space",
};

export const ATMOSPHERES: ReadonlyArray<{ key: AtmosphereKey; label: string; description: string; background: string }> = [
  { key: "original-space", label: "Original Space", description: "อวกาศเดิมของระบบ · เป็นค่าเริ่มต้นทุกห้อง", background: "radial-gradient(circle at 18% 8%, rgba(70,120,255,.18), transparent 32%), radial-gradient(circle at 82% 22%, rgba(164,76,255,.16), transparent 30%), #060913" },
  { key: "ops-blue", label: "Operations Blue", description: "น้ำเงินอ่านง่าย เหมาะกับงานปฏิบัติการ", background: "radial-gradient(circle at 12% 0%, rgba(14,165,233,.24), transparent 34%), linear-gradient(145deg, #06111f, #071a2b 55%, #07101b)" },
  { key: "quiet-black", label: "Quiet Black", description: "ดำสงบ ลดสิ่งรบกวนสำหรับหน้าข้อมูลหนาแน่น", background: "radial-gradient(circle at 80% 0%, rgba(148,163,184,.12), transparent 30%), #050608" },
  { key: "signal-amber", label: "Signal Amber", description: "อำพันสำหรับห้องติดตามสถานะและสัญญาณ", background: "radial-gradient(circle at 16% 0%, rgba(245,158,11,.18), transparent 31%), linear-gradient(145deg, #100b06, #1b1208 55%, #080706)" },
];

export const CARD_STYLES: ReadonlyArray<{ key: CardStyleKey; label: string; description: string; vars: Record<string, string> }> = [
  { key: "balanced", label: "Balanced", description: "สมดุล อ่านง่าย ใช้เป็นค่าเริ่มต้น", vars: { "--appearance-card-opacity": ".82", "--appearance-card-blur": "14px", "--appearance-card-radius": "18px", "--appearance-card-shadow": "0 18px 55px rgba(0,0,0,.28)" } },
  { key: "glass", label: "Glass", description: "โปร่งใสและมีมิติ เหมาะกับ atmosphere อวกาศ", vars: { "--appearance-card-opacity": ".52", "--appearance-card-blur": "22px", "--appearance-card-radius": "22px", "--appearance-card-shadow": "0 18px 70px rgba(20,80,180,.22)" } },
  { key: "dense", label: "Dense Ops", description: "แน่นขึ้น ใช้พื้นที่คุ้มกับงานปฏิบัติการ", vars: { "--appearance-card-opacity": ".9", "--appearance-card-blur": "6px", "--appearance-card-radius": "12px", "--appearance-card-shadow": "0 10px 28px rgba(0,0,0,.3)" } },
  { key: "solid", label: "Solid", description: "ทึบและนิ่ง ลดการรบกวนจากพื้นหลัง", vars: { "--appearance-card-opacity": ".98", "--appearance-card-blur": "0px", "--appearance-card-radius": "14px", "--appearance-card-shadow": "0 12px 34px rgba(0,0,0,.35)" } },
];

const roomKeys = new Set<string>(THEME_LAB_ROOMS.map(room => room.key));
const validAtmosphere = (value: unknown): value is AtmosphereKey => ATMOSPHERES.some(item => item.key === value);
const validCardStyle = (value: unknown): value is CardStyleKey => CARD_STYLES.some(item => item.key === value);

function normalizeSelection(value: unknown): AppearanceSelection {
  const row = value && typeof value === "object" ? value as Partial<AppearanceSelection> : {};
  return {
    atmosphereKey: validAtmosphere(row.atmosphereKey) ? row.atmosphereKey : DEFAULT_APPEARANCE.atmosphereKey,
    themeKey: typeof row.themeKey === "string" && row.themeKey.trim() ? row.themeKey : null,
    cardStyleKey: validCardStyle(row.cardStyleKey) ? row.cardStyleKey : DEFAULT_APPEARANCE.cardStyleKey,
    frameKey: typeof row.frameKey === "string" && row.frameKey.trim() ? row.frameKey : null,
    backgroundKey: typeof row.backgroundKey === "string" && row.backgroundKey.trim() ? row.backgroundKey : DEFAULT_APPEARANCE.backgroundKey,
  };
}

function readStore(key: string): AppearanceStore {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([room]) => room === "global" || roomKeys.has(room)).map(([room, selection]) => [room, normalizeSelection(selection)]));
  } catch {
    return {};
  }
}

function writeStore(key: string, store: AppearanceStore) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(store));
}

function emitAppearanceChange(room: ThemeLabRoom | "global", selection: AppearanceSelection) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: { room, selection } }));
}

export function readAppliedAppearances(): AppearanceStore { return readStore(APPEARANCE_APPLIED_KEY); }
export function readDraftAppearances(): AppearanceStore { return readStore(APPEARANCE_DRAFT_KEY); }
export function readAppliedAppearance(room: ThemeLabRoom | "global"): AppearanceSelection {
  const store = readAppliedAppearances();
  return { ...DEFAULT_APPEARANCE, ...(store[room] ?? store.global ?? {}) };
}
export function readDraftAppearance(room: ThemeLabRoom | "global"): AppearanceSelection {
  const store = readDraftAppearances();
  return { ...readAppliedAppearance(room), ...(store[room] ?? {}) };
}
export function saveDraftAppearance(room: ThemeLabRoom | "global", selection: AppearanceSelection) {
  const store = readDraftAppearances();
  store[room] = normalizeSelection(selection);
  writeStore(APPEARANCE_DRAFT_KEY, store);
}
export function applyAppearance(room: ThemeLabRoom | "global", selection: AppearanceSelection) {
  const applied = readAppliedAppearances();
  applied[room] = normalizeSelection(selection);
  writeStore(APPEARANCE_APPLIED_KEY, applied);
  const drafts = readDraftAppearances();
  delete drafts[room];
  writeStore(APPEARANCE_DRAFT_KEY, drafts);
  emitAppearanceChange(room, applied[room]);
}
export function resetDraftAppearance(room: ThemeLabRoom | "global") {
  const drafts = readDraftAppearances();
  delete drafts[room];
  writeStore(APPEARANCE_DRAFT_KEY, drafts);
}
export function resetRoomAppearance(room: ThemeLabRoom | "global") {
  const applied = readAppliedAppearances();
  delete applied[room];
  writeStore(APPEARANCE_APPLIED_KEY, applied);
  resetDraftAppearance(room);
  emitAppearanceChange(room, readAppliedAppearance(room));
}
export function resetGlobalAppearance() {
  localStorage.removeItem(APPEARANCE_APPLIED_KEY);
  localStorage.removeItem(APPEARANCE_DRAFT_KEY);
  emitAppearanceChange("global", DEFAULT_APPEARANCE);
}

function rowsToStore(rows: AppearanceSelectionRow[]): AppearanceStore {
  const store: AppearanceStore = {};
  for (const row of rows) {
    if (!row?.is_active || !row.scope_key || !row.asset_key) continue;
    const current = store[row.scope_key] ?? { ...DEFAULT_APPEARANCE };
    if (row.asset_type === "theme") current.themeKey = row.asset_key;
    if (row.asset_type === "frame") current.frameKey = row.asset_key;
    if (row.asset_type === "atmosphere" && validAtmosphere(row.asset_key)) current.atmosphereKey = row.asset_key;
    if (row.asset_type === "card_style" && validCardStyle(row.asset_key)) current.cardStyleKey = row.asset_key;
    if (row.asset_type === "background") current.backgroundKey = row.asset_key;
    store[row.scope_key] = current;
  }
  return store;
}

export async function syncAppliedAppearances(api: AppearanceApi): Promise<boolean> {
  const result = await api.from("app_customization_selections")
    .select("scope_key,asset_type,asset_key,is_active")
    .eq("app_key", APPEARANCE_APP_KEY)
    .eq("is_active", true)
    .limit(100);
  if (result.error) return false;
  const store = rowsToStore((result.data ?? []) as AppearanceSelectionRow[]);
  writeStore(APPEARANCE_APPLIED_KEY, store);
  emitAppearanceChange("global", readAppliedAppearance("global"));
  return true;
}

export async function persistAppearance(api: AppearanceApi, room: ThemeLabRoom | "global", selection: AppearanceSelection): Promise<boolean> {
  const normalized = normalizeSelection(selection);
  const rows = [
    ["theme", normalized.themeKey],
    ["frame", normalized.frameKey],
    ["atmosphere", normalized.atmosphereKey],
    ["card_style", normalized.cardStyleKey],
    ["background", normalized.backgroundKey],
  ].filter((entry): entry is [AppearanceAssetType, string] => Boolean(entry[1]))
    .map(([asset_type, asset_key]) => ({ app_key: APPEARANCE_APP_KEY, scope_key: room, asset_type, asset_key, is_active: true, updated_by: "appearance-control-room" }));
  const upsert = await api.from("app_customization_selections").upsert(rows, { onConflict: "app_key,scope_key,asset_type" });
  if (upsert.error) return false;
  for (const assetType of ["theme", "frame"] as const) {
    if (assetType === "theme" && normalized.themeKey) continue;
    if (assetType === "frame" && normalized.frameKey) continue;
    const removed = await api.from("app_customization_selections").delete().eq("app_key", APPEARANCE_APP_KEY).eq("scope_key", room).eq("asset_type", assetType);
    if (removed.error) return false;
  }
  return true;
}

export async function resetAppearanceInSupabase(api: AppearanceApi, room: ThemeLabRoom | "global"): Promise<boolean> {
  const result = await api.from("app_customization_selections").delete().eq("app_key", APPEARANCE_APP_KEY).eq("scope_key", room);
  return !result.error;
}

export function readBackgroundCatalog(): BackgroundOption[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(BACKGROUND_CATALOG_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.key === "string") as BackgroundOption[] : [];
  } catch { return []; }
}

export async function syncBackgroundCatalog(api: AppearanceApi): Promise<BackgroundOption[]> {
  const result = await api.from("app_backgrounds").select("background_key,name,description,background_type,config").eq("is_enabled", true).order("sort_order", { ascending: true }).limit(100);
  if (result.error) return readBackgroundCatalog();
  const catalog = ((result.data ?? []) as Array<Record<string, unknown>>).map(row => ({
    key: String(row.background_key ?? ""),
    name: String(row.name ?? row.background_key ?? "Background"),
    description: String(row.description ?? ""),
    type: String(row.background_type ?? "css-animated"),
    config: row.config && typeof row.config === "object" ? row.config as Record<string, unknown> : {},
  })).filter(item => item.key);
  if (typeof window !== "undefined") localStorage.setItem(BACKGROUND_CATALOG_KEY, JSON.stringify(catalog));
  return catalog;
}

export function appearanceRoomFromPath(path: string): ThemeLabRoom | "global" {
  const cleanPath = path.split(/[?#]/, 1)[0] || "/";
  return THEME_LAB_ROOMS.find(room => cleanPath === room.path || cleanPath.startsWith(`${room.path}/`))?.key ?? "global";
}

export function appearanceCssVars(selection: AppearanceSelection): Record<string, string> {
  const style = CARD_STYLES.find(item => item.key === selection.cardStyleKey) ?? CARD_STYLES[0];
  const atmosphere = ATMOSPHERES.find(item => item.key === selection.atmosphereKey) ?? ATMOSPHERES[0];
  const background = readBackgroundCatalog().find(item => item.key === selection.backgroundKey);
  const config = background?.config ?? {};
  const layers = Array.isArray(config.layers) ? config.layers.filter(value => typeof value === "string").join(",") : "none";
  return { ...(style?.vars ?? {}), "--appearance-atmosphere": selection.atmosphereKey, "--appearance-room-background": atmosphere?.background ?? "#060913", "--appearance-frame-key": selection.frameKey ?? "none", "--appearance-background-key": selection.backgroundKey, "--appearance-background-base": typeof config.base === "string" ? config.base : "transparent", "--appearance-background-layers": layers, "--appearance-background-size": typeof config.backgroundSize === "string" ? config.backgroundSize : "auto" };
}
