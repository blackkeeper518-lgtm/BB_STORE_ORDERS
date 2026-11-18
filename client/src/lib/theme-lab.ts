export const THEME_LAB_KEY = "nightops-theme-lab-v1";
export const THEME_LAB_EVENT = "nightops-theme-lab-change";

export const THEME_LAB_ROOMS = [
  { key: "orders", label: "Order Control", path: "/orders" },
  { key: "chats", label: "รวมแชทเพจ", path: "/chats" },
  { key: "parcel-mapping", label: "แมปเลขพัสดุ", path: "/parcel-mapping" },
  { key: "telegram-delivery", label: "PIONEER · คิวพัก", path: "/telegram-delivery" },
  { key: "alert-room", label: "PARADOX · ประวัติเปลี่ยนของ", path: "/alert-room" },
  { key: "blackbox", label: "BLACKBOX · DEATH NOTE", path: "/blackbox" },
  { key: "stock-room", label: "คลังสินค้า", path: "/stock-room" },
  { key: "order-history", label: "GENESIS · Log สุดท้าย", path: "/order-history" },
] as const;

export type ThemeLabRoom = (typeof THEME_LAB_ROOMS)[number]["key"];
export type ThemeLabSettings = { rooms: ThemeLabRoom[]; css: string };

export const DEFAULT_THEME_LAB: ThemeLabSettings = { rooms: [], css: "" };

export const CYBER_THEME_KEY = "bb-cyber-theme-v1";
export type CyberTheme = {
  version: 1;
  preset: number;
  name: string;
  bg: string;
  surface: string;
  primary: string;
  accent: string;
  border: "gradient" | "neon" | "rail" | "hud" | "minimal";
  button: "solid" | "outline" | "gradient";
  radius: number;
  glow: number;
  motion: boolean;
};
const CYBER_THEME_COLORS = [
  ["Cyber Neon", "#080d1d", "#101827", "#00e5ff", "#ff00d9", "ฟ้า × ชมพู"], ["Quantum Violet", "#100c20", "#1a1530", "#b89aff", "#59edff", "ม่วง × ไซแอน"],
  ["Emerald Matrix", "#071710", "#10251b", "#75ffac", "#00e5cf", "เขียว × มิ้นต์"], ["Crimson Ops", "#170b14", "#29121e", "#ff728c", "#ffc56a", "แดง × อำพัน"],
  ["Arctic Pulse", "#091721", "#122637", "#8beeff", "#c4aeff", "น้ำแข็ง × ลาเวนเดอร์"], ["Midnight Gold", "#15130b", "#252116", "#ffd477", "#7ae9ff", "ทอง × ฟ้า"],
  ["Electric Ocean", "#080f23", "#13223c", "#6fafff", "#5effd6", "น้ำเงิน × เทอร์ควอยซ์"], ["Solar Flare", "#1a0e0b", "#2b1b16", "#ffab68", "#ff72c7", "ส้ม × ชมพู"],
  ["Toxic Lime", "#0d1609", "#1b2713", "#bcff63", "#68eaff", "มะนาว × ไซแอน"], ["Rose Hologram", "#190d1e", "#2a1830", "#ff94dd", "#bba2ff", "โรส × ม่วง"],
  ["Plasma Purple", "#120920", "#211333", "#cb8cff", "#ff80aa", "พลาสมา × โรส"], ["Aqua Terminal", "#061918", "#102a29", "#5dffdf", "#9baaff", "อควา × อินดิโก"],
  ["Sakura Circuit", "#190e17", "#2c1d29", "#ffa8cc", "#7bfff0", "ซากุระ × มิ้นต์"], ["Cobalt Reactor", "#080e20", "#142039", "#82a0ff", "#ffcb6f", "โคบอลต์ × ทอง"],
  ["Amber Command", "#191409", "#2b2515", "#ffca63", "#d0ff7b", "อำพัน × ไลม์"], ["Frost Mint", "#0a1815", "#142923", "#a2ffde", "#9fc7ff", "มิ้นต์ × ฟรอสต์"],
  ["Ultraviolet Wave", "#120d23", "#211832", "#dbacff", "#ff8be3", "อัลตราไวโอเลต × ชมพู"], ["Inferno Signal", "#190d0e", "#2c171b", "#ff8872", "#ffc56b", "คอรัล × เปลวไฟ"],
  ["Silver Circuit", "#0d1420", "#1b2735", "#d7eaff", "#82dfff", "เงิน × ไอซ์บลู"], ["Galaxy Spectrum", "#100d20", "#1d1933", "#97eaff", "#ff9cdb", "กาแล็กซี × แมเจนตา"],
  ["Meta Monochrome", "#f5f5f5", "#ffffff", "#111111", "#65676b", "ขาวดำแบบ Meta"], ["Black Plain", "#050505", "#111111", "#f5f5f5", "#777777", "ดำเรียบ"],
] as const;
export const CYBER_THEME_PRESETS: CyberTheme[] = CYBER_THEME_COLORS.map(([name, bg, surface, primary, accent], preset) => ({ version: 1, preset, name, bg, surface, primary, accent, border: "gradient", button: "solid", radius: 16, glow: 12, motion: true }));
export const DEFAULT_CYBER_THEME = CYBER_THEME_PRESETS[0];
export function readCyberTheme(): CyberTheme {
  if (typeof window === "undefined") return DEFAULT_CYBER_THEME;
  try {
    const value = JSON.parse(localStorage.getItem(CYBER_THEME_KEY) || "null") as Partial<CyberTheme> | null;
    const validHex = (color: unknown) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color);
    if (!value || typeof value.name !== "string" || !validHex(value.bg) || !validHex(value.surface) || !validHex(value.primary) || !validHex(value.accent)) return DEFAULT_CYBER_THEME;
    return { ...DEFAULT_CYBER_THEME, ...value, version: 1 } as CyberTheme;
  } catch { return DEFAULT_CYBER_THEME; }
}
export function saveCyberTheme(theme: CyberTheme) {
  localStorage.setItem(CYBER_THEME_KEY, JSON.stringify(theme));
  window.dispatchEvent(new StorageEvent("storage", { key: CYBER_THEME_KEY, newValue: JSON.stringify(theme) }));
}

export function readThemeLab(): ThemeLabSettings {
  if (typeof window === "undefined") return DEFAULT_THEME_LAB;
  try {
    const parsed = JSON.parse(localStorage.getItem(THEME_LAB_KEY) || "null");
    return {
      rooms: Array.isArray(parsed?.rooms) ? parsed.rooms.filter((room: unknown): room is ThemeLabRoom => THEME_LAB_ROOMS.some(item => item.key === room)) : [],
      css: typeof parsed?.css === "string" ? parsed.css : "",
    };
  } catch {
    return DEFAULT_THEME_LAB;
  }
}

export function saveThemeLab(settings: ThemeLabSettings) {
  localStorage.setItem(THEME_LAB_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(THEME_LAB_EVENT));
}

export function prepareThemeCss(css: string) {
  const source = String(css || "");
  const cardSelector = ":is(.neon-card, .order-list-card, .order-detail-card, .order-parcel-result, .order-chat-match)";
  // The lab accepts standalone frame recipes copied from the Cyber Frame page.
  // Those recipes usually target .frame/.f35, while the real app cards use several room-specific classes.
  // Translate only these two known compatibility selectors; all other user CSS stays intact.
  if (!source.includes(".frame") && !/\.f\d+\b/.test(source) && !source.includes(".neon-card")) return source;
  const token = "__THEME_LAB_CARD__";
  return source
    .replace(/\.f\d+\b/g, token)
    .replace(/\.frame\b/g, token)
    .replace(/\.neon-card\b/g, token)
    .replace(/__THEME_LAB_CARD__/g, cardSelector)
    .replace(/\.content\b/g, `${cardSelector} > *`);
}

export function themeRoomFromPath(path: string): ThemeLabRoom | null {
  const cleanPath = path.split(/[?#]/, 1)[0] || "/";
  return THEME_LAB_ROOMS.find(room => cleanPath === room.path || cleanPath.startsWith(`${room.path}/`))?.key ?? null;
}
