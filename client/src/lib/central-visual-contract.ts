/**
 * Central Visual System contract source.
 *
 * Phase 2 safety rule: this module is intentionally not imported by the
 * existing runtime yet. It defines the future contract in one place without
 * changing current rendering, persistence, or business workflows.
 */

export const CENTRAL_VISUAL_CONTRACT_VERSION = "v1" as const;

export const VISUAL_SCOPES = {
  desktopApp: "desktop-app",
  mobileInbox: "mobile-inbox",
} as const;

export type VisualScope = (typeof VISUAL_SCOPES)[keyof typeof VISUAL_SCOPES];
export type AccentKey = "crimson" | "amber" | "moss" | "violet" | "cyan";
export type BackgroundKey = "original-space" | "ops-blue" | "quiet-black" | "signal-amber";
export type CardMaterialKey = "balanced" | "glass" | "dense" | "solid";
export type FrameKey = "minimal" | "signal" | "corner" | "none";
export type MotionKey = "subtle" | "still" | "reduced";

export type VisualTokenName =
  | "app-canvas"
  | "app-background"
  | "app-gutter"
  | "room-surface"
  | "room-surface-muted"
  | "room-surface-raised"
  | "panel-surface"
  | "card-surface"
  | "card-surface-raised"
  | "card-border"
  | "card-border-strong"
  | "card-accent"
  | "card-shadow"
  | "card-radius"
  | "card-opacity"
  | "card-blur"
  | "text-primary"
  | "text-secondary"
  | "text-muted"
  | "state-success"
  | "state-warning"
  | "state-danger"
  | "state-info"
  | "control-surface"
  | "control-border"
  | "control-focus";

export type VisualTokenMap = Readonly<Record<`--${VisualTokenName}`, string>>;

export type AccentProfile = Readonly<{
  key: AccentKey;
  label: string;
  primary: string;
  secondary: string;
  soft: string;
  contrast: string;
  glow: string;
}>;

export type BackgroundProfile = Readonly<{
  key: BackgroundKey;
  label: string;
  description: string;
  base: string;
  layers: readonly string[];
  size: string;
  motion: MotionKey;
}>;

export type CardMaterialProfile = Readonly<{
  key: CardMaterialKey;
  label: string;
  description: string;
  opacity: string;
  blur: string;
  radius: string;
  shadow: string;
  padding: string;
}>;

export type FrameProfile = Readonly<{
  key: FrameKey;
  label: string;
  borderWidth: string;
  opacity: string;
  style: "solid" | "dashed" | "double" | "none";
  glow: string;
}>;

export type MotionProfile = Readonly<{
  key: MotionKey;
  duration: string;
  easing: string;
  backgroundAnimation: string;
  glowAnimation: string;
}>;

export type CentralVisualProfile = Readonly<{
  version: typeof CENTRAL_VISUAL_CONTRACT_VERSION;
  scope: VisualScope;
  accent: AccentKey;
  background: BackgroundKey;
  cardMaterial: CardMaterialKey;
  frame: FrameKey;
  motion: MotionKey;
}>;

export const DARK_BASE_TOKENS = {
  "--app-canvas": "#030508",
  "--app-background": "#060913",
  "--app-gutter": "#030508",
  "--room-surface": "rgba(7, 12, 24, 0.72)",
  "--room-surface-muted": "rgba(4, 8, 16, 0.62)",
  "--room-surface-raised": "rgba(12, 19, 35, 0.78)",
  "--panel-surface": "rgba(8, 14, 27, 0.78)",
  "--card-surface": "rgba(7, 12, 24, 0.82)",
  "--card-surface-raised": "rgba(13, 21, 39, 0.88)",
  "--card-border": "rgba(148, 163, 184, 0.2)",
  "--card-border-strong": "rgba(148, 163, 184, 0.42)",
  "--card-accent": "rgba(148, 163, 184, 0.34)",
  "--card-shadow": "0 18px 55px rgba(0, 0, 0, 0.32)",
  "--card-radius": "14px",
  "--card-opacity": "0.82",
  "--card-blur": "14px",
  "--text-primary": "#f4f7fb",
  "--text-secondary": "#b4c0d1",
  "--text-muted": "#718096",
  "--state-success": "#5ee6a8",
  "--state-warning": "#f6c453",
  "--state-danger": "#ff6b7a",
  "--state-info": "#61c7ff",
  "--control-surface": "rgba(10, 17, 31, 0.86)",
  "--control-border": "rgba(148, 163, 184, 0.28)",
  "--control-focus": "#61c7ff",
} satisfies VisualTokenMap;

export const ACCENT_PROFILES: Readonly<Record<AccentKey, AccentProfile>> = {
  crimson: { key: "crimson", label: "Crimson", primary: "#f0445f", secondary: "#ff7a8d", soft: "rgba(240, 68, 95, 0.16)", contrast: "#fff7f8", glow: "rgba(240, 68, 95, 0.34)" },
  amber: { key: "amber", label: "Amber", primary: "#f59e0b", secondary: "#fbbf24", soft: "rgba(245, 158, 11, 0.16)", contrast: "#171006", glow: "rgba(245, 158, 11, 0.3)" },
  moss: { key: "moss", label: "Moss", primary: "#75b798", secondary: "#a3d9a5", soft: "rgba(117, 183, 152, 0.16)", contrast: "#07110c", glow: "rgba(117, 183, 152, 0.28)" },
  violet: { key: "violet", label: "Violet", primary: "#a78bfa", secondary: "#d8b4fe", soft: "rgba(167, 139, 250, 0.16)", contrast: "#10091d", glow: "rgba(167, 139, 250, 0.32)" },
  cyan: { key: "cyan", label: "Cyan", primary: "#22d3ee", secondary: "#67e8f9", soft: "rgba(34, 211, 238, 0.16)", contrast: "#041114", glow: "rgba(34, 211, 238, 0.3)" },
};

export const BACKGROUND_PROFILES: Readonly<Record<BackgroundKey, BackgroundProfile>> = {
  "original-space": {
    key: "original-space",
    label: "Original Space",
    description: "พื้นอวกาศเดิมของระบบ เห็นผ่าน gutter และ card material",
    base: "#060913",
    layers: ["radial-gradient(circle at 18% 8%, rgba(70,120,255,.18), transparent 32%)", "radial-gradient(circle at 82% 22%, rgba(164,76,255,.16), transparent 30%)"],
    size: "auto",
    motion: "subtle",
  },
  "ops-blue": {
    key: "ops-blue",
    label: "Operations Blue",
    description: "น้ำเงินเข้มสำหรับหน้าปฏิบัติการ",
    base: "#06111f",
    layers: ["radial-gradient(circle at 12% 0%, rgba(14,165,233,.2), transparent 34%)", "linear-gradient(145deg, #06111f, #071a2b 55%, #07101b)"],
    size: "auto",
    motion: "subtle",
  },
  "quiet-black": {
    key: "quiet-black",
    label: "Quiet Black",
    description: "ดำสงบสำหรับข้อมูลหนาแน่น",
    base: "#050608",
    layers: ["radial-gradient(circle at 80% 0%, rgba(148,163,184,.1), transparent 30%)"],
    size: "auto",
    motion: "still",
  },
  "signal-amber": {
    key: "signal-amber",
    label: "Signal Amber",
    description: "บรรยากาศอำพันสำหรับห้องสัญญาณ",
    base: "#100b06",
    layers: ["radial-gradient(circle at 16% 0%, rgba(245,158,11,.16), transparent 31%)", "linear-gradient(145deg, #100b06, #1b1208 55%, #080706)"],
    size: "auto",
    motion: "subtle",
  },
};

export const CARD_MATERIAL_PROFILES: Readonly<Record<CardMaterialKey, CardMaterialProfile>> = {
  balanced: { key: "balanced", label: "Balanced", description: "อ่านง่ายและคง atmosphere ไว้", opacity: "0.82", blur: "14px", radius: "14px", shadow: "0 18px 55px rgba(0,0,0,.32)", padding: "var(--space-6)" },
  glass: { key: "glass", label: "Glass", description: "โปร่งและเห็นพื้นอวกาศชัดขึ้น", opacity: "0.58", blur: "22px", radius: "18px", shadow: "0 18px 70px rgba(0,0,0,.28)", padding: "var(--space-6)" },
  dense: { key: "dense", label: "Dense Ops", description: "แน่นสำหรับข้อมูลปฏิบัติการ", opacity: "0.9", blur: "6px", radius: "10px", shadow: "0 10px 28px rgba(0,0,0,.34)", padding: "var(--space-4)" },
  solid: { key: "solid", label: "Solid", description: "นิ่งและอ่านง่ายเมื่อข้อมูลซับซ้อน", opacity: "0.96", blur: "0px", radius: "12px", shadow: "0 12px 34px rgba(0,0,0,.38)", padding: "var(--space-5)" },
};

export const FRAME_PROFILES: Readonly<Record<FrameKey, FrameProfile>> = {
  minimal: { key: "minimal", label: "Minimal", borderWidth: "1px", opacity: "0.7", style: "solid", glow: "none" },
  signal: { key: "signal", label: "Signal", borderWidth: "1px", opacity: "0.9", style: "solid", glow: "var(--accent-glow)" },
  corner: { key: "corner", label: "Corner Mark", borderWidth: "1px", opacity: "0.8", style: "dashed", glow: "none" },
  none: { key: "none", label: "None", borderWidth: "0px", opacity: "0", style: "none", glow: "none" },
};

export const MOTION_PROFILES: Readonly<Record<MotionKey, MotionProfile>> = {
  subtle: { key: "subtle", duration: "18s", easing: "ease-in-out", backgroundAnimation: "drift", glowAnimation: "pulse-soft" },
  still: { key: "still", duration: "0ms", easing: "linear", backgroundAnimation: "none", glowAnimation: "none" },
  reduced: { key: "reduced", duration: "0ms", easing: "linear", backgroundAnimation: "none", glowAnimation: "none" },
};

export const DEFAULT_CENTRAL_VISUAL_PROFILE: CentralVisualProfile = {
  version: CENTRAL_VISUAL_CONTRACT_VERSION,
  scope: VISUAL_SCOPES.desktopApp,
  accent: "cyan",
  background: "original-space",
  cardMaterial: "balanced",
  frame: "minimal",
  motion: "subtle",
};

export function accentTokens(accentKey: AccentKey): Readonly<Record<string, string>> {
  const accent = ACCENT_PROFILES[accentKey] ?? ACCENT_PROFILES.cyan;
  return {
    "--accent-primary": accent.primary,
    "--accent-secondary": accent.secondary,
    "--accent-soft": accent.soft,
    "--accent-contrast": accent.contrast,
    "--accent-glow": accent.glow,
    "--card-accent": accent.soft,
    "--card-border-strong": accent.primary,
    "--control-focus": accent.primary,
  };
}

export function backgroundTokens(backgroundKey: BackgroundKey): Readonly<Record<string, string>> {
  const background = BACKGROUND_PROFILES[backgroundKey] ?? BACKGROUND_PROFILES["original-space"];
  return {
    "--app-background": background.base,
    "--app-background-layers": background.layers.join(", "),
    "--app-background-size": background.size,
    "--app-background-motion": background.motion,
  };
}

export function cardMaterialTokens(cardMaterialKey: CardMaterialKey): Readonly<Record<string, string>> {
  const card = CARD_MATERIAL_PROFILES[cardMaterialKey] ?? CARD_MATERIAL_PROFILES.balanced;
  return {
    "--card-opacity": card.opacity,
    "--card-blur": card.blur,
    "--card-radius": card.radius,
    "--card-shadow": card.shadow,
    "--card-padding": card.padding,
  };
}

export function frameTokens(frameKey: FrameKey): Readonly<Record<string, string>> {
  const frame = FRAME_PROFILES[frameKey] ?? FRAME_PROFILES.minimal;
  return {
    "--frame-width": frame.borderWidth,
    "--frame-opacity": frame.opacity,
    "--frame-style": frame.style,
    "--frame-glow": frame.glow,
  };
}

export function motionTokens(motionKey: MotionKey): Readonly<Record<string, string>> {
  const motion = MOTION_PROFILES[motionKey] ?? MOTION_PROFILES.reduced;
  return {
    "--motion-duration": motion.duration,
    "--motion-easing": motion.easing,
    "--motion-background": motion.backgroundAnimation,
    "--motion-glow": motion.glowAnimation,
  };
}

export function resolveCentralVisualTokens(profile: CentralVisualProfile): Readonly<Record<string, string>> {
  return {
    ...DARK_BASE_TOKENS,
    ...accentTokens(profile.accent),
    ...backgroundTokens(profile.background),
    ...cardMaterialTokens(profile.cardMaterial),
    ...frameTokens(profile.frame),
    ...motionTokens(profile.motion),
  };
}

export function isDesktopVisualScope(scope: string | undefined): scope is "desktop-app" {
  return scope === VISUAL_SCOPES.desktopApp;
}

export function isProtectedVisualScope(scope: string | undefined): scope is "mobile-inbox" {
  return scope === VISUAL_SCOPES.mobileInbox;
}
