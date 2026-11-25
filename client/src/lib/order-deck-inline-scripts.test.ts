import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const deckSourcePath = fileURLToPath(new URL("../../../DRΛKSIDE-Space-Vault-neon.html", import.meta.url));
const deckSource = readFileSync(deckSourcePath, "utf8");

function inlineScripts(source: string): string[] {
  return Array.from(source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi), match => match[1]).filter(script => script.trim().length > 0);
}

describe("Order Deck inline scripts", () => {
  it("parses every script so the clock and product image deck can initialize", () => {
    const scripts = inlineScripts(deckSource);
    expect(scripts.length).toBeGreaterThan(0);
    scripts.forEach((script, index) => {
      expect(() => new Script(script, { filename: `DRΛKSIDE-Space-Vault-neon.html#script-${index}` })).not.toThrow();
    });
    expect(deckSource).toContain("function updateClock()");
    expect(deckSource).toContain("updateClock();setInterval(updateClock,1000)");
  });
});
