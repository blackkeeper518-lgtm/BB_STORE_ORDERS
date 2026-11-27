import type React from "react";

export type SkinMaterial = "glass" | "hud" | "oled" | "holo" | "solid";
export type SkinFrame = "rounded" | "cut-corner" | "rail" | "minimal" | "pill";
export type SkinBorderMotion = "beam" | "pulse" | "scan" | "none";

export type SkinConfig = {
  themeKey: string;
  name: string;
  description: string;
  category: string;
  material: SkinMaterial;
  frame: SkinFrame;
  borderMotion: SkinBorderMotion;
  bg: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  radius: number;
  blur: number;
  glow: number;
  motion: boolean;
  fontBody: string;
  fontHeading: string;
  graphicUrl: string;
  audio: { notification?: string; click?: string; switch?: string; volume: number; enabled: boolean };
  config: Record<string, unknown>;
  preset: number;
};

export type SkinRow = Record<string, unknown>;

const fallbackColors = {
  bg: "#08040f", surface: "#13091f", surfaceAlt: "#1b1028", primary: "#ad5cff", accent: "#5de9ff",
  textPrimary: "#ffffff", textSecondary: "#c9bfd2", border: "rgba(173,92,255,.32)",
};
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const json = (value: unknown) => { if (typeof value === "string") { try { return asRecord(JSON.parse(value)); } catch { return {}; } } return asRecord(value); };
const str = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim() : fallback;
const num = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const bool = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;

export function normalizeSkinRow(row: SkinRow, index = 0, related?: { frame?: SkinRow; sound?: SkinRow }): SkinConfig {
  const legacy = row;
  const config = { ...json(row.config), ...json(row.theme_config), ...json(row.style_config), ...json(row.visual_config) };
  const colors = { ...asRecord(config.colors), ...asRecord(row.colors) };
  const frame = { ...asRecord(config.frame), ...asRecord(row.frame), ...asRecord(related?.frame?.config) };
  const audio = { ...asRecord(config.audio), ...asRecord(row.audio), ...asRecord(related?.sound?.config) };
  const value = (...parts: (string | Record<string, unknown>)[]) => { const key = parts.find(part => typeof part === "string") as string | undefined; return parts.filter((part): part is Record<string, unknown> => typeof part === "object").map(source => key ? source[key] : undefined).find(item => item !== undefined); };
  const fallbackKey = `theme-${String(index + 1).padStart(3, "0")}`;
  return {
    themeKey: str(value("theme_key", legacy, config), fallbackKey), name: str(value("name", legacy, config), `DARKSIDE ${index + 1}`),
    description: str(value("description", legacy, config), "Data-driven tactical skin"), category: str(value("category", legacy, config), "Cyberpunk"),
    material: ["glass", "hud", "oled", "holo", "solid"].includes(String(value("material", frame, legacy, config))) ? String(value("material", frame, legacy, config)) as SkinMaterial : "solid",
    frame: ["rounded", "cut-corner", "rail", "minimal", "pill"].includes(String(value("shape", "frame_style", frame, legacy, config))) ? String(value("shape", "frame_style", frame, legacy, config)) as SkinFrame : "rounded",
    borderMotion: ["beam", "pulse", "scan", "none"].includes(String(value("border_motion", "motion", frame, legacy, config))) ? String(value("border_motion", "motion", frame, legacy, config)) as SkinBorderMotion : "beam",
    bg: str(value("bg", "background", "background_color", colors, legacy, config), fallbackColors.bg),
    surface: str(value("surface", "surface_color", colors, legacy, config), fallbackColors.surface),
    surfaceAlt: str(value("surface_alt", "surfaceAlt", "surface_color_alt", colors, legacy, config), fallbackColors.surfaceAlt),
    primary: str(value("primary", "primary_color", colors, legacy, config), fallbackColors.primary),
    accent: str(value("accent", "accent_color", colors, legacy, config), fallbackColors.accent),
    textPrimary: str(value("text_primary", "textPrimary", "text_primary_color", colors, legacy, config), fallbackColors.textPrimary),
    textSecondary: str(value("text_secondary", "textSecondary", "text_secondary_color", colors, legacy, config), fallbackColors.textSecondary),
    border: str(value("border", "border_color", "border_style_color", colors, legacy, config), fallbackColors.border),
    radius: num(value("radius", "border_radius", legacy, frame, config), 16), blur: num(value("blur", "backdrop_blur", legacy, frame, config), 16), glow: num(value("glow", "glow_strength", legacy, frame, config), 18),
    motion: bool(value("motion_enabled", "motion", legacy, config), true), fontBody: str(value("font_body", legacy, config), "Space Grotesk"), fontHeading: str(value("font_heading", legacy, config), "IBM Plex Mono"),
    graphicUrl: str(value("graphic_url", "background_url", legacy, config), ""),
    audio: { notification: str(value("notification", "notification_url", audio, related?.sound ?? {}, legacy), "") || undefined, click: str(value("click", "click_url", audio, related?.sound ?? {}, legacy), "") || undefined, switch: str(value("switch", "switch_url", audio, related?.sound ?? {}, legacy), "") || undefined, volume: Math.min(1, Math.max(0, num(value("volume", audio, related?.sound ?? {}, legacy), .35))), enabled: bool(value("enabled", "audio_enabled", audio, related?.sound ?? {}, legacy), true) },
    config, preset: index,
  };
}

function luminanceFromRgb(r: number, g: number, b: number) {
  const channels = [r, g, b].map(channel => { const value = channel / 255; return value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}
export function colorLuminance(value: string): number {
  const input = value.trim().toLowerCase();
  const hex = input.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) { const raw = hex[1].length === 3 ? hex[1].split("").map(x => x + x).join("") : hex[1]; return luminanceFromRgb(parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)); }
  const rgb = input.match(/rgba?\(([^)]+)\)/);
  if (rgb) { const parts = rgb[1].split(/[ ,/]+/).slice(0, 3).map(Number); if (parts.every(Number.isFinite)) return luminanceFromRgb(parts[0], parts[1], parts[2]); }
  const hsl = input.match(/hsla?\(([^)]+)\)/);
  if (hsl) { const [h, s, l] = hsl[1].split(/[ ,/]+/).slice(0, 3).map(Number); const sat = s / 100, light = l / 100, c = (1 - Math.abs(2 * light - 1)) * sat, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = light - c / 2; const rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return luminanceFromRgb((rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255); }
  return .05;
}
export function contrastText(background: string) { return colorLuminance(background) > .42 ? "#090611" : "#ffffff"; }

export function injectSkin(skin: SkinConfig) {
  const root = document.documentElement;
  const text = contrastText(skin.bg);
  const muted = colorLuminance(skin.bg) > .42 ? "#26313b" : skin.textSecondary;
  const radius = `${skin.radius}px`;
  const glow = `${skin.glow}px`;
  const graphic = skin.graphicUrl ? `url("${skin.graphicUrl.replace(/"/g, "\\\"")}")` : "none";
  const vars: Record<string, string> = {
    // Keep the existing preview variables for the gallery.
    "--skin-bg": skin.bg, "--skin-surface": skin.surface, "--skin-surface-alt": skin.surfaceAlt,
    "--skin-primary": skin.primary, "--skin-accent": skin.accent, "--skin-text": text,
    "--skin-text-primary": skin.textPrimary || text, "--skin-text-secondary": muted, "--skin-border": skin.border,
    "--skin-radius": radius, "--skin-blur": `${skin.blur}px`, "--skin-glow": glow,
    "--skin-font-body": skin.fontBody, "--skin-font-heading": skin.fontHeading,
    // Exactly the same source colors MobileInbox reads from app_themes.
    "--mobile-bg": skin.bg, "--mobile-surface": skin.surface, "--mobile-primary": skin.primary,
    "--mobile-accent": skin.accent, "--mobile-radius": radius, "--mobile-glow": glow,
    // Variables used by the dashboard's global CSS layer.
    "--global-bg": skin.bg, "--global-surface": skin.surface, "--global-primary": skin.primary,
    "--global-accent": skin.accent, "--global-text": text, "--global-text-muted": muted,
    "--global-border": skin.border, "--global-radius": radius, "--global-glow": glow, "--global-motion": skin.motion ? "1" : "0",
    "--global-font-body": skin.fontBody, "--global-font-heading": skin.fontHeading, "--global-graphic": graphic,
    // Older shadcn/Tailwind tokens also point to the same source of truth.
    "--background": skin.bg, "--foreground": text, "--card": skin.surface, "--card-foreground": text,
    "--primary": skin.primary, "--primary-foreground": contrastText(skin.primary), "--secondary": skin.surfaceAlt,
    "--secondary-foreground": text, "--muted": skin.surfaceAlt, "--muted-foreground": muted,
    "--accent": skin.accent, "--accent-foreground": contrastText(skin.accent), "--border": skin.border,
    "--input": skin.border, "--ring": skin.primary, "--radius": radius,
  };
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.dataset.skin = skin.themeKey; root.dataset.skinMaterial = skin.material; root.dataset.skinFrame = skin.frame; root.dataset.skinMotion = skin.motion && skin.borderMotion !== "none" ? skin.borderMotion : "none"; root.dataset.skinContrast = colorLuminance(skin.bg) > .42 ? "light" : "dark";
  document.body.style.backgroundColor = skin.bg; document.body.style.color = text;
}

class TacticalAudioEngine {
  private cache = new Map<string, HTMLAudioElement>();
  private muted = false;
  setMuted(value: boolean) { this.muted = value; localStorage.setItem("darkside-audio-muted-v1", String(value)); }
  isMuted() { return this.muted || localStorage.getItem("darkside-audio-muted-v1") === "true"; }
  preload(skin: SkinConfig) { Object.values(skin.audio).forEach(url => { if (typeof url === "string" && /^https?:\/\//i.test(url) && !this.cache.has(url)) { const audio = new Audio(url); audio.preload = "auto"; this.cache.set(url, audio); } }); }
  play(kind: "notification" | "click" | "switch", skin: SkinConfig) { if (this.isMuted() || !skin.audio.enabled) return; const url = skin.audio[kind]; if (url) { const audio = this.cache.get(url) ?? new Audio(url); audio.volume = skin.audio.volume; audio.currentTime = 0; void audio.play().catch(() => undefined); return; } try { const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!Ctx) return; const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = kind === "click" ? "square" : "sine"; osc.frequency.value = kind === "switch" ? 740 : kind === "notification" ? 880 : 520; gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(Math.max(.01, skin.audio.volume), ctx.currentTime + .01); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + (kind === "notification" ? .28 : .08)); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .32); window.setTimeout(() => void ctx.close(), 500); } catch { /* browser audio is gesture-gated */ } }
}
export const tacticalAudio = new TacticalAudioEngine();

export function extractOrderFields(text: string) { const phone = text.match(/(?:0\d{1,2}[- .]?\d{3,4}[- .]?\d{3,4}|\+66\s?\d{8,10})/)?.[0] ?? ""; const zipcode = text.match(/\b\d{5}\b/)?.[0] ?? ""; const name = text.match(/(?:ชื่อ|นามผู้รับ)\s*[:：-]?\s*([^\n,]+)/i)?.[1]?.trim() ?? ""; const address = text.match(/(?:ที่อยู่|ส่งที่อยู่)\s*[:：-]?\s*([^\n]+)/i)?.[1]?.trim() ?? ""; return { name, phone, address, zipcode }; }
export function detectTrackingNumber(text: string) { return text.match(/\b(?:TH|LP|SPX|J&T|KERRY|BEST|FLASH)?[- ]?\d{8,18}\b/i)?.[0] ?? ""; }
export function fuzzyScore(query: string, candidate: string) { const q = query.toLowerCase().replace(/\s+/g, ""); const c = candidate.toLowerCase().replace(/\s+/g, ""); if (!q) return 0; if (c === q) return 100; if (c.includes(q)) return 75 - Math.min(30, c.length - q.length); let qi = 0; for (const char of c) if (char === q[qi]) qi++; return Math.round((qi / q.length) * 60); }
export function cssVarsForSkin(skin: SkinConfig): React.CSSProperties { return { "--skin-bg": skin.bg, "--skin-surface": skin.surface, "--skin-primary": skin.primary, "--skin-accent": skin.accent, "--skin-text": contrastText(skin.bg), "--skin-radius": `${skin.radius}px`, "--skin-blur": `${skin.blur}px` } as React.CSSProperties; }
