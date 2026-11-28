import {
  type CentralVisualProfile,
  type AccentKey,
  type BackgroundKey,
  type CardMaterialKey,
  type FrameKey,
  type MotionKey,
  DEFAULT_CENTRAL_VISUAL_PROFILE,
  isDesktopVisualScope,
  resolveCentralVisualTokens,
} from "@/lib/central-visual-contract";

export type VisualStyleObject = Readonly<Record<string, string>>;

type AppearanceSelectionLike = Readonly<{
  atmosphereKey?: string;
  backgroundKey?: string;
  cardStyleKey?: string;
  frameKey?: string | null;
}>;

function inferAccent(themeKey: string | null | undefined): AccentKey {
  const key = String(themeKey ?? "").toLowerCase();
  if (/(crimson|ruby|red|mars|scarlet|ember)/.test(key)) return "crimson";
  if (/(amber|gold|copper|orange|solar|sand)/.test(key)) return "amber";
  if (/(moss|emerald|green|lime|matrix)/.test(key)) return "moss";
  if (/(violet|purple|orchid|magenta|pink|ultraviolet)/.test(key)) return "violet";
  return "cyan";
}

function normalizeBackground(value: string | undefined): BackgroundKey {
  return value === "ops-blue" || value === "quiet-black" || value === "signal-amber" ? value : "original-space";
}

function normalizeCardMaterial(value: string | undefined): CardMaterialKey {
  return value === "glass" || value === "dense" || value === "solid" ? value : "balanced";
}

function normalizeFrame(value: string | null | undefined): FrameKey {
  return value === "signal" || value === "corner" || value === "none" ? value : "minimal";
}

function normalizeMotion(value: string | undefined): MotionKey {
  return value === "still" || value === "reduced" ? value : "subtle";
}

export function centralVisualProfileFromAppearance(
  selection: AppearanceSelectionLike,
  themeKey: string | null | undefined,
  scope: CentralVisualProfile["scope"] = "desktop-app",
): CentralVisualProfile {
  const background = normalizeBackground(selection.backgroundKey ?? selection.atmosphereKey);
  return {
    ...DEFAULT_CENTRAL_VISUAL_PROFILE,
    scope,
    accent: inferAccent(themeKey),
    background,
    cardMaterial: normalizeCardMaterial(selection.cardStyleKey),
    frame: normalizeFrame(selection.frameKey),
    motion: normalizeMotion(background === "quiet-black" ? "still" : undefined),
  };
}

/**
 * Pure adapter for the future renderer. It has no DOM side effects and is not
 * imported by the current application runtime during Phase 2.
 */
export function resolveDesktopVisualStyle(profile: CentralVisualProfile): VisualStyleObject {
  if (!isDesktopVisualScope(profile.scope)) return {};
  return resolveCentralVisualTokens(profile);
}

export function visualStyleToCssText(style: VisualStyleObject): string {
  return Object.entries(style)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}: ${value};`)
    .join(" ");
}

export function visualStyleToInlineStyle(style: VisualStyleObject): Record<string, string> {
  return { ...style };
}
