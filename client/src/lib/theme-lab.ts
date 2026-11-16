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
