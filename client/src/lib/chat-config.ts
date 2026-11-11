export type BrowserChatConfig = {
  url: string;
  serviceRoleKey: string;
};

export const CHAT_BROWSER_CONFIG_KEY = "binary-star-chat-config-v1";

export function readBrowserChatConfig(): BrowserChatConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHAT_BROWSER_CONFIG_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<BrowserChatConfig>;
    const url = typeof value.url === "string" ? value.url.trim().replace(/\/$/, "") : "";
    const serviceRoleKey = typeof value.serviceRoleKey === "string" ? value.serviceRoleKey.trim() : "";
    return url && serviceRoleKey ? { url, serviceRoleKey } : null;
  } catch {
    return null;
  }
}

export function saveBrowserChatConfig(config: BrowserChatConfig) {
  const url = config.url.trim().replace(/\/$/, "");
  const serviceRoleKey = config.serviceRoleKey.trim();
  if (!url) throw new Error("กรุณาใส่ Chat Supabase URL");
  if (!serviceRoleKey) throw new Error("กรุณาใส่ Chat service-role key");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Chat Supabase URL ไม่ถูกต้อง");
  }
  if (parsed.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/i.test(parsed.hostname) || parsed.pathname !== "/" || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash) {
    throw new Error("URL ต้องเป็น https://<project>.supabase.co เท่านั้น");
  }
  if (typeof window === "undefined") throw new Error("บันทึกค่า Chat ได้จาก browser เท่านั้น");
  window.localStorage.setItem(CHAT_BROWSER_CONFIG_KEY, JSON.stringify({ url, serviceRoleKey }));
}

export function clearBrowserChatConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAT_BROWSER_CONFIG_KEY);
}
