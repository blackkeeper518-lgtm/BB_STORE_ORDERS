import { describe, expect, it } from "vitest";
import { DEFAULT_CENTRAL_VISUAL_PROFILE } from "@/lib/central-visual-contract";
import { centralVisualProfileFromAppearance, resolveDesktopVisualStyle, visualStyleToCssText } from "@/lib/central-visual-adapter";

describe("central visual adapter", () => {
  it("resolves the default desktop profile into central tokens", () => {
    const style = resolveDesktopVisualStyle(DEFAULT_CENTRAL_VISUAL_PROFILE);

    expect(style["--app-canvas"]).toBe("#030508");
    expect(style["--app-background"]).toBe("#060913");
    expect(style["--card-surface"]).toBe("rgba(7, 12, 24, 0.82)");
    expect(style["--accent-primary"]).toBe("#22d3ee");
  });

  it("changes accent without recoloring the dark base or card material", () => {
    const cyan = resolveDesktopVisualStyle(DEFAULT_CENTRAL_VISUAL_PROFILE);
    const crimson = resolveDesktopVisualStyle({ ...DEFAULT_CENTRAL_VISUAL_PROFILE, accent: "crimson" });

    expect(crimson["--accent-primary"]).not.toBe(cyan["--accent-primary"]);
    expect(crimson["--app-canvas"]).toBe(cyan["--app-canvas"]);
    expect(crimson["--app-gutter"]).toBe(cyan["--app-gutter"]);
    expect(crimson["--card-surface"]).toBe(cyan["--card-surface"]);
    expect(crimson["--card-opacity"]).toBe(cyan["--card-opacity"]);
  });

  it("changes background without changing card material", () => {
    const space = resolveDesktopVisualStyle(DEFAULT_CENTRAL_VISUAL_PROFILE);
    const black = resolveDesktopVisualStyle({ ...DEFAULT_CENTRAL_VISUAL_PROFILE, background: "quiet-black" });

    expect(black["--app-background"]).not.toBe(space["--app-background"]);
    expect(black["--card-surface"]).toBe(space["--card-surface"]);
    expect(black["--card-opacity"]).toBe(space["--card-opacity"]);
    expect(black["--card-blur"]).toBe(space["--card-blur"]);
  });

  it("changes card material without changing accent identity", () => {
    const balanced = resolveDesktopVisualStyle(DEFAULT_CENTRAL_VISUAL_PROFILE);
    const glass = resolveDesktopVisualStyle({ ...DEFAULT_CENTRAL_VISUAL_PROFILE, cardMaterial: "glass" });

    expect(glass["--card-opacity"]).not.toBe(balanced["--card-opacity"]);
    expect(glass["--card-blur"]).not.toBe(balanced["--card-blur"]);
    expect(glass["--accent-primary"]).toBe(balanced["--accent-primary"]);
    expect(glass["--app-background"]).toBe(balanced["--app-background"]);
  });

  it("does not emit desktop visual tokens for the protected Mobile Inbox scope", () => {
    const style = resolveDesktopVisualStyle({ ...DEFAULT_CENTRAL_VISUAL_PROFILE, scope: "mobile-inbox" });

    expect(style).toEqual({});
  });

  it("serializes tokens deterministically for a future style boundary", () => {
    const css = visualStyleToCssText({ "--z": "last", "--a": "first" });

    expect(css).toBe("--a: first; --z: last;");
  });

  it("adapts existing appearance selections without changing the persistence shape", () => {
    const profile = centralVisualProfileFromAppearance(
      { backgroundKey: "quiet-black", cardStyleKey: "glass", frameKey: "corner" },
      "PLASMA-ORCHID",
    );

    expect(profile.accent).toBe("violet");
    expect(profile.background).toBe("quiet-black");
    expect(profile.cardMaterial).toBe("glass");
    expect(profile.frame).toBe("corner");
    expect(profile.motion).toBe("still");
  });

  it("keeps the mobile scope explicit when adapting an existing selection", () => {
    const profile = centralVisualProfileFromAppearance({}, "ROOM 04", "mobile-inbox");

    expect(profile.scope).toBe("mobile-inbox");
    expect(resolveDesktopVisualStyle(profile)).toEqual({});
  });
});
