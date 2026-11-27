import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/canonical";
import { refreshServerProjectStatus } from "@/lib/server-project-client";
import { CYBER_THEME_PRESETS, DEFAULT_CYBER_THEME, type CyberTheme } from "@/lib/theme-lab";
import { injectSkin, normalizeSkinRow, tacticalAudio, type SkinConfig, type SkinRow } from "@/lib/darkside-skin-engine";

const GLOBAL_THEME_KEY = "st-bb-global-theme-key-v1";
const GLOBAL_THEME_EVENT = "st-bb-global-theme-change";
const GLOBAL_THEME_PAYLOAD_KEY = "st-bb-global-theme-payload-v1";

export type GlobalTheme = CyberTheme & SkinConfig & { themeKey: string; description: string; textPrimary: string; textSecondary: string; fontBody: string; fontHeading: string; graphicUrl: string };
type GlobalThemeContextValue = { theme: GlobalTheme; themes: GlobalTheme[]; loading: boolean; connected: boolean; muted: boolean; selectTheme: (theme: GlobalTheme) => void; refreshThemes: () => Promise<void>; setMuted: (value: boolean) => void };
const GlobalThemeContext = createContext<GlobalThemeContextValue | null>(null);

function fallbackTheme(): GlobalTheme {
  const skin = normalizeSkinRow({ theme_key: "local-default", name: DEFAULT_CYBER_THEME.name, background_color: DEFAULT_CYBER_THEME.bg, surface_color: DEFAULT_CYBER_THEME.surface, primary_color: DEFAULT_CYBER_THEME.primary, accent_color: DEFAULT_CYBER_THEME.accent }, 0);
  return { ...DEFAULT_CYBER_THEME, ...skin, preset: 0 } as GlobalTheme;
}
function fromRow(row: SkinRow, index: number): GlobalTheme {
  const fallback = CYBER_THEME_PRESETS[index % CYBER_THEME_PRESETS.length] ?? DEFAULT_CYBER_THEME;
  return { ...fallback, ...normalizeSkinRow(row, index), preset: index } as GlobalTheme;
}

export function GlobalThemeRuntime({ children }: { children: React.ReactNode }) {
  const [themes, setThemes] = useState<GlobalTheme[]>(() => [fallbackTheme()]);
  const [activeKey, setActiveKey] = useState(() => { try { return localStorage.getItem(GLOBAL_THEME_KEY) || ""; } catch { return ""; } });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [muted, setMutedState] = useState(() => { try { return localStorage.getItem("darkside-audio-muted-v1") === "true"; } catch { return false; } });

  const refreshThemes = async () => {
    setLoading(true);
    try {
      const status = await refreshServerProjectStatus();
      if (!status.vault) { setConnected(false); return; }
      const api = getSupabase("vault");
      if (!api) { setConnected(false); return; }
      const base = await api.from("app_themes").select("*").eq("is_enabled", true).order("sort_order", { ascending: true });
      if (base.error) throw base.error;
      const rows = (base.data ?? []) as SkinRow[];
      const next = rows.length ? rows.map((row, index) => fromRow(row, index)) : [fallbackTheme()];
      setThemes(next); setConnected(true); setActiveKey(current => next.some(item => item.themeKey === current) ? current : next[0].themeKey);
      next.forEach(item => tacticalAudio.preload(item));
    } catch { setConnected(false); } finally { setLoading(false); }
  };
  useEffect(() => { void refreshThemes(); }, []);
  useEffect(() => { const sync = () => { try { setActiveKey(localStorage.getItem(GLOBAL_THEME_KEY) || ""); } catch {} }; window.addEventListener(GLOBAL_THEME_EVENT, sync); window.addEventListener("storage", sync); return () => { window.removeEventListener(GLOBAL_THEME_EVENT, sync); window.removeEventListener("storage", sync); }; }, []);
  const theme = useMemo(() => themes.find(item => item.themeKey === activeKey) ?? themes[0] ?? fallbackTheme(), [activeKey, themes]);
  useEffect(() => { injectSkin(theme); tacticalAudio.preload(theme); try { localStorage.setItem(GLOBAL_THEME_PAYLOAD_KEY, JSON.stringify(theme)); localStorage.removeItem("st-bb-global-public-config-v1"); } catch {} }, [theme]);
  const selectTheme = (next: GlobalTheme) => { setActiveKey(next.themeKey); tacticalAudio.play("switch", next); try { localStorage.setItem(GLOBAL_THEME_KEY, next.themeKey); window.dispatchEvent(new CustomEvent(GLOBAL_THEME_EVENT)); } catch {} };
  const setMuted = (value: boolean) => { setMutedState(value); tacticalAudio.setMuted(value); };
  return <GlobalThemeContext.Provider value={{ theme, themes, loading, connected, selectTheme, refreshThemes, muted, setMuted }}><div className="global-theme-runtime" data-global-theme={theme.themeKey}>{children}</div></GlobalThemeContext.Provider>;
}
export function useGlobalThemeRuntime() { const value = useContext(GlobalThemeContext); if (!value) throw new Error("useGlobalThemeRuntime must be used inside GlobalThemeRuntime"); return value; }
