import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/canonical";
import { refreshServerProjectStatus } from "@/lib/server-project-client";
import { CYBER_THEME_PRESETS, DEFAULT_CYBER_THEME, type CyberTheme } from "@/lib/theme-lab";

const GLOBAL_THEME_KEY = "st-bb-global-theme-key-v1";
const GLOBAL_THEME_EVENT = "st-bb-global-theme-change";
const GLOBAL_THEME_PAYLOAD_KEY = "st-bb-global-theme-payload-v1";

type GlobalThemeRow = {
  theme_key?: string;
  name?: string;
  description?: string;
  background_color?: string;
  surface_color?: string;
  primary_color?: string;
  accent_color?: string;
  text_primary_color?: string;
  text_secondary_color?: string;
  font_body?: string;
  font_heading?: string;
  graphic_url?: string;
  border_style?: string;
  button_style?: string;
  radius?: number | string;
  glow?: number | string;
  motion_enabled?: boolean;
  is_enabled?: boolean;
  sort_order?: number;
};

export type GlobalTheme = CyberTheme & {
  themeKey: string;
  description: string;
  textPrimary: string;
  textSecondary: string;
  fontBody: string;
  fontHeading: string;
  graphicUrl: string;
};

type GlobalThemeContextValue = {
  theme: GlobalTheme;
  themes: GlobalTheme[];
  loading: boolean;
  connected: boolean;
  selectTheme: (theme: GlobalTheme) => void;
  refreshThemes: () => Promise<void>;
};

const GlobalThemeContext = createContext<GlobalThemeContextValue | null>(null);
const validHex = (value: unknown, fallback: string) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const numberValue = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function fromRow(row: GlobalThemeRow, index: number): GlobalTheme {
  const fallback = CYBER_THEME_PRESETS[index % CYBER_THEME_PRESETS.length] ?? DEFAULT_CYBER_THEME;
  return {
    ...fallback,
    preset: index,
    themeKey: String(row.theme_key || `theme-${String(index + 1).padStart(3, "0")}`),
    name: String(row.name || fallback.name),
    description: String(row.description || ""),
    bg: validHex(row.background_color, fallback.bg),
    surface: validHex(row.surface_color, fallback.surface),
    primary: validHex(row.primary_color, fallback.primary),
    accent: validHex(row.accent_color, fallback.accent),
    textPrimary: validHex(row.text_primary_color, "#ffffff"),
    textSecondary: validHex(row.text_secondary_color, "#c9bfd2"),
    fontBody: String(row.font_body || "Noto Sans Thai"),
    fontHeading: String(row.font_heading || "Chakra Petch"),
    graphicUrl: String(row.graphic_url || ""),
    border: (row.border_style === "neon" || row.border_style === "rail" || row.border_style === "hud" || row.border_style === "minimal" ? row.border_style : "gradient") as CyberTheme["border"],
    button: (row.button_style === "outline" || row.button_style === "gradient" ? row.button_style : "solid") as CyberTheme["button"],
    radius: numberValue(row.radius, 16),
    glow: numberValue(row.glow, 12),
    motion: row.motion_enabled !== false,
  };
}

function fallbackTheme(): GlobalTheme {
  return fromRow({ theme_key: "local-default", name: DEFAULT_CYBER_THEME.name, background_color: DEFAULT_CYBER_THEME.bg, surface_color: DEFAULT_CYBER_THEME.surface, primary_color: DEFAULT_CYBER_THEME.primary, accent_color: DEFAULT_CYBER_THEME.accent }, 0);
}

export function GlobalThemeRuntime({ children }: { children: React.ReactNode }) {
  const [themes, setThemes] = useState<GlobalTheme[]>(() => [fallbackTheme()]);
  const [activeKey, setActiveKey] = useState(() => {
    try { return localStorage.getItem(GLOBAL_THEME_KEY) || ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const refreshThemes = async () => {
    setLoading(true);
    try {
      const status = await refreshServerProjectStatus();
      if (!status.vault) { setConnected(false); return; }
      const api = getSupabase("vault");
      if (!api) { setConnected(false); return; }
      const result = await api.from("app_themes").select("theme_key,name,description,background_color,surface_color,primary_color,accent_color,text_primary_color,text_secondary_color,font_body,font_heading,graphic_url,border_style,button_style,radius,glow,motion_enabled,is_enabled,sort_order").eq("is_enabled", true).order("sort_order", { ascending: true });
      if (result.error) throw result.error;
      const rows = (result.data ?? []) as GlobalThemeRow[];
      if (!rows.length) { setConnected(true); return; }
      const next = rows.map(fromRow);
      setThemes(next);
      setConnected(true);
      setActiveKey(current => next.some(item => item.themeKey === current) ? current : next[0].themeKey);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refreshThemes(); }, []);
  useEffect(() => {
    const sync = () => { try { setActiveKey(localStorage.getItem(GLOBAL_THEME_KEY) || ""); } catch { /* private mode */ } };
    window.addEventListener(GLOBAL_THEME_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(GLOBAL_THEME_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const theme = useMemo(() => themes.find(item => item.themeKey === activeKey) ?? themes[0] ?? fallbackTheme(), [activeKey, themes]);
  useEffect(() => {
    try {
      localStorage.setItem(GLOBAL_THEME_PAYLOAD_KEY, JSON.stringify(theme));
      localStorage.removeItem("st-bb-global-public-config-v1");
    } catch { /* private mode or blocked storage */ }
  }, [theme]);
  const selectTheme = (next: GlobalTheme) => {
    setActiveKey(next.themeKey);
    try { localStorage.setItem(GLOBAL_THEME_KEY, next.themeKey); window.dispatchEvent(new CustomEvent(GLOBAL_THEME_EVENT)); } catch { /* private mode */ }
  };
  const style = {
    "--global-bg": theme.bg,
    "--global-surface": theme.surface,
    "--global-primary": theme.primary,
    "--global-accent": theme.accent,
    "--global-text": theme.textPrimary,
    "--global-text-muted": theme.textSecondary,
    "--global-font-body": theme.fontBody,
    "--global-font-heading": theme.fontHeading,
    "--global-radius": `${theme.radius}px`,
    "--global-glow": `${theme.glow}px`,
    "--global-graphic": theme.graphicUrl ? `url(${theme.graphicUrl})` : "none",
  } as React.CSSProperties;

  return <GlobalThemeContext.Provider value={{ theme, themes, loading, connected, selectTheme, refreshThemes }}><div className="global-theme-runtime" data-global-theme={theme.themeKey} style={style}>{children}</div></GlobalThemeContext.Provider>;
}

export function useGlobalThemeRuntime() {
  const value = useContext(GlobalThemeContext);
  if (!value) throw new Error("useGlobalThemeRuntime must be used inside GlobalThemeRuntime");
  return value;
}
