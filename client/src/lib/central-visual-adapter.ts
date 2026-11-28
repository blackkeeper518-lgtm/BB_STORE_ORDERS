import {
  type CentralVisualProfile,
  isDesktopVisualScope,
  resolveCentralVisualTokens,
} from "@/lib/central-visual-contract";

export type VisualStyleObject = Readonly<Record<string, string>>;

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
