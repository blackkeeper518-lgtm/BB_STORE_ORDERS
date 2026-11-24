import { describe, expect, it } from "vitest";
import { CYBER_THEME_PRESETS, DEFAULT_CYBER_THEME, getThemeTextColor } from "./theme-lab";

describe("ST cyber chat theme", () => {
  it("uses the Singto orange-gold-black palette as the default without removing existing presets", () => {
    expect(DEFAULT_CYBER_THEME.name).toBe("Singto Ember");
    expect(DEFAULT_CYBER_THEME.bg).toBe("#100b06");
    expect(DEFAULT_CYBER_THEME.primary).toBe("#ff8c32");
    expect(DEFAULT_CYBER_THEME.accent).toBe("#ffd25c");
    expect(CYBER_THEME_PRESETS.some(theme => theme.name === "Cyber Neon")).toBe(true);
  });

  it("selects readable text colors for light and dark message surfaces", () => {
    expect(getThemeTextColor("#ffffff")).toBe("#17120b");
    expect(getThemeTextColor("#101827")).toBe("#fff7e6");
    expect(getThemeTextColor("invalid")).toBe("#fff7e6");
  });
});
