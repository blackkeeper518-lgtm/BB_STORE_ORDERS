import { describe, expect, it, vi } from "vitest";
import { clearLegacyBrowserSupabaseSettings } from "./server-project-client";

describe("legacy browser Supabase cleanup", () => {
  it("leaves legacy backup values untouched without reading or deleting them", () => {
    const getItem = vi.fn(() => "user-backup");
    const removeItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem, removeItem });
    clearLegacyBrowserSupabaseSettings();
    expect(getItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
