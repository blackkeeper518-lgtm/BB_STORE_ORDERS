import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mobileCss = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("mobile inbox safe-area layout", () => {
  it("keeps the conversation header below the status bar even when the browser reports no top safe inset", () => {
    expect(mobileCss).toContain("--mobile-inbox-top-clearance:max(40px,calc(env(safe-area-inset-top) + 8px))");
    expect(mobileCss).toContain("height:calc(64px + var(--mobile-inbox-top-clearance))");
  });

  it("sizes the mobile Order Deck to the remaining viewport while preserving the bottom safe area", () => {
    expect(mobileCss).toContain("padding:var(--mobile-inbox-top-clearance) 6px max(8px,env(safe-area-inset-bottom))");
    expect(mobileCss).toContain("height:calc(100dvh - var(--mobile-inbox-top-clearance) - max(8px,env(safe-area-inset-bottom)))");
    expect(mobileCss).not.toContain("@media(max-width:560px){.mobile-inbox-order-deck{padding:max(6px,env(safe-area-inset-top))");
  });
});
