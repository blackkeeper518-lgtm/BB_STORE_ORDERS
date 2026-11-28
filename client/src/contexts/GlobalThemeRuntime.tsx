import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/canonical";
import { refreshServerProjectStatus } from "@/lib/server-project-client";
import { CYBER_THEME_PRESETS, DEFAULT_CYBER_THEME, type CyberTheme } from "@/lib/theme-lab";
import { injectSkin, normalizeSkinRow, tacticalAudio, type SkinConfig, type SkinRow } from "@/lib/darkside-skin-engine";
import { APPEARANCE_ARCHITECTURE_ENABLED, APPEARANCE_EVENT, appearanceCssVars, appearanceRoomFromPath, readAppliedAppearance, syncAppliedAppearances, syncBackgroundCatalog } from "@/lib/appearance-runtime";
import { centralVisualProfileFromAppearance, resolveDesktopVisualStyle } from "@/lib/central-visual-adapter";

const GLOBAL_THEME_KEY = "st-bb-global-theme-key-v1";
const GLOBAL_THEME_EVENT = "st-bb-global-theme-change";
const GLOBAL_THEME_PAYLOAD_KEY = "st-bb-global-theme-payload-v1";
const GLOBAL_THEME_FALLBACK_KEY = "DARKSIDE-PRIME";

export type GlobalTheme = CyberTheme & SkinConfig & { themeKey: string; description: string; textPrimary: string; textSecondary: string; fontBody: string; fontHeading: string; graphicUrl: string };
type GlobalThemeContextValue = { theme: GlobalTheme; themes: GlobalTheme[]; loading: boolean; connected: boolean; muted: boolean; selectTheme: (theme: GlobalTheme) => void; refreshThemes: () => Promise<void>; setMuted: (value: boolean) => void };
const GlobalThemeContext = createContext<GlobalThemeContextValue | null>(null);

function fallbackTheme(): GlobalTheme {
  const prime = {
    ...DEFAULT_CYBER_THEME,
    name: "DARKSIDE Prime",
    bg: "#08040f",
    surface: "#13091f",
    primary: "#ad5cff",
    accent: "#5de9ff",
    border: "neon" as CyberTheme["border"],
    button: "gradient" as CyberTheme["button"],
    radius: 10,
    glow: 20,
    motion: true,
  };
  const skin = normalizeSkinRow({ theme_key: GLOBAL_THEME_FALLBACK_KEY, name: prime.name, background_color: prime.bg, surface_color: prime.surface, primary_color: prime.primary, accent_color: prime.accent, border_style: prime.border, button_style: prime.button, radius: prime.radius, glow: prime.glow, motion_enabled: prime.motion }, 0);
  return { ...prime, ...skin, themeKey: GLOBAL_THEME_FALLBACK_KEY, description: "DARKSIDE // Signature", preset: 0 } as GlobalTheme;
}
function validHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
function fromRow(row: SkinRow, index: number): GlobalTheme {
  const fallback = CYBER_THEME_PRESETS[index % CYBER_THEME_PRESETS.length] ?? DEFAULT_CYBER_THEME;
  const theme = {
    version: Number(row.version) || 1,
    preset: index,
    name: String(row.name || row.theme_key || `Theme ${index + 1}`),
    bg: String(row.background_color),
    surface: String(row.surface_color),
    primary: String(row.primary_color),
    accent: String(row.accent_color),
    border: (["gradient", "neon", "rail", "hud", "minimal"].includes(String(row.border_style)) ? String(row.border_style) : "gradient") as CyberTheme["border"],
    button: (["solid", "outline", "gradient"].includes(String(row.button_style)) ? String(row.button_style) : "solid") as CyberTheme["button"],
    radius: Number(row.radius) || 16,
    glow: Number(row.glow) || 12,
    motion: row.motion_enabled !== false,
  } satisfies CyberTheme;
  const skin = normalizeSkinRow({ ...row, theme_key: row.theme_key || `theme-${index + 1}`, background_color: theme.bg, surface_color: theme.surface, primary_color: theme.primary, accent_color: theme.accent, radius: theme.radius, glow: theme.glow, motion_enabled: theme.motion }, index);
  return { ...fallback, ...theme, ...skin, preset: index } as GlobalTheme;
}

export function GlobalThemeRuntime({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [themes, setThemes] = useState<GlobalTheme[]>(() => [fallbackTheme()]);
  const [activeKey, setActiveKey] = useState(() => { try { return localStorage.getItem(GLOBAL_THEME_KEY) || GLOBAL_THEME_FALLBACK_KEY; } catch { return GLOBAL_THEME_FALLBACK_KEY; } });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [appearanceVersion, setAppearanceVersion] = useState(0);
  const [muted, setMutedState] = useState(() => { try { return localStorage.getItem("darkside-audio-muted-v1") === "true"; } catch { return false; } });

  const refreshThemes = async () => {
    setLoading(true);
    try {
      const status = await refreshServerProjectStatus();
      if (!status.vault) { setConnected(false); return; }
      const api = getSupabase("vault");
      if (!api) { setConnected(false); return; }
      if (APPEARANCE_ARCHITECTURE_ENABLED) {
        const synced = await syncAppliedAppearances(api);
        await syncBackgroundCatalog(api);
        if (synced) setAppearanceVersion(value => value + 1);
      }
      const base = await api.from("app_themes").select("theme_key,name,description,background_color,surface_color,primary_color,accent_color,border_style,button_style,radius,glow,motion_enabled,is_enabled,sort_order,version").eq("is_enabled", true).order("sort_order", { ascending: true }).limit(100);
      if (base.error) throw base.error;
      const rows = ((base.data ?? []) as SkinRow[]).filter(row => [row.background_color, row.surface_color, row.primary_color, row.accent_color].every(validHex));
      const catalogThemes = rows.map((row, index) => fromRow(row, index));
      const next = catalogThemes.some(item => item.themeKey === GLOBAL_THEME_FALLBACK_KEY) ? catalogThemes : [fallbackTheme(), ...catalogThemes];
      setThemes(next); setConnected(true); setActiveKey(current => next.some(item => item.themeKey === current) ? current : (next.some(item => item.themeKey === GLOBAL_THEME_FALLBACK_KEY) ? GLOBAL_THEME_FALLBACK_KEY : next[0].themeKey));
      next.forEach(item => tacticalAudio.preload(item));
    } catch { setConnected(false); } finally { setLoading(false); }
  };
  useEffect(() => { void refreshThemes(); }, []);
  useEffect(() => { const sync = () => { try { setActiveKey(localStorage.getItem(GLOBAL_THEME_KEY) || GLOBAL_THEME_FALLBACK_KEY); } catch {} }; window.addEventListener(GLOBAL_THEME_EVENT, sync); window.addEventListener("storage", sync); return () => { window.removeEventListener(GLOBAL_THEME_EVENT, sync); window.removeEventListener("storage", sync); }; }, []);
  useEffect(() => { const syncAppearance = () => setAppearanceVersion(value => value + 1); window.addEventListener(APPEARANCE_EVENT, syncAppearance); window.addEventListener("storage", syncAppearance); return () => { window.removeEventListener(APPEARANCE_EVENT, syncAppearance); window.removeEventListener("storage", syncAppearance); }; }, []);
  const room = appearanceRoomFromPath(location);
  const roomThemeKey = APPEARANCE_ARCHITECTURE_ENABLED ? readAppliedAppearance(room).themeKey : null;
  const effectiveThemeKey = roomThemeKey ?? activeKey;
  const theme = useMemo(() => themes.find(item => item.themeKey === effectiveThemeKey) ?? themes[0] ?? fallbackTheme(), [effectiveThemeKey, themes, appearanceVersion]);
  useEffect(() => {
    injectSkin(theme);
    tacticalAudio.preload(theme);
    const runtimeRoot = document.querySelector<HTMLElement>(".global-theme-runtime");
    const isMobileInbox = location === "/mobile-inbox";
    if (APPEARANCE_ARCHITECTURE_ENABLED) {
      const selection = readAppliedAppearance(room);
      const root = document.documentElement;
      Object.entries(appearanceCssVars(selection)).forEach(([key, value]) => root.style.setProperty(key, value));
      root.dataset.appearanceRoom = room;
      root.dataset.appearanceAtmosphere = selection.atmosphereKey;
      root.dataset.appearanceCardStyle = selection.cardStyleKey;
      root.dataset.appearanceFrame = selection.frameKey ?? "default";
      root.dataset.appearanceBackgroundKey = selection.backgroundKey;
      if (runtimeRoot) {
        const previousKeys = (runtimeRoot.dataset.visualTokenKeys ?? "").split(",").filter(Boolean);
        previousKeys.forEach(key => runtimeRoot.style.removeProperty(key));
        const profile = centralVisualProfileFromAppearance(selection, theme.themeKey, isMobileInbox ? "mobile-inbox" : "desktop-app");
        const nextTokens = resolveDesktopVisualStyle(profile);
        Object.entries(nextTokens).forEach(([key, value]) => runtimeRoot.style.setProperty(key, value));
        runtimeRoot.dataset.visualScope = profile.scope;
        runtimeRoot.dataset.visualProfileVersion = profile.version;
        runtimeRoot.dataset.visualRoom = isMobileInbox ? "mobile-inbox" : room;
        runtimeRoot.dataset.visualTokenKeys = Object.keys(nextTokens).join(",");
      }
    }
    try { localStorage.setItem(GLOBAL_THEME_PAYLOAD_KEY, JSON.stringify(theme)); localStorage.removeItem("st-bb-global-public-config-v1"); } catch {}
  }, [theme, room, location, appearanceVersion]);
  const selectTheme = (next: GlobalTheme) => { setActiveKey(next.themeKey); tacticalAudio.play("switch", next); try { localStorage.setItem(GLOBAL_THEME_KEY, next.themeKey); window.dispatchEvent(new CustomEvent(GLOBAL_THEME_EVENT)); } catch {} };
  const setMuted = (value: boolean) => { setMutedState(value); tacticalAudio.setMuted(value); };
  return <GlobalThemeContext.Provider value={{ theme, themes, loading, connected, selectTheme, refreshThemes, muted, setMuted }}><div className="global-theme-runtime" data-global-theme={theme.themeKey} data-visual-scope={location === "/mobile-inbox" ? "mobile-inbox" : "desktop-app"}>{children}</div></GlobalThemeContext.Provider>;
}
export function useGlobalThemeRuntime() { const value = useContext(GlobalThemeContext); if (!value) throw new Error("useGlobalThemeRuntime must be used inside GlobalThemeRuntime"); return value; }
