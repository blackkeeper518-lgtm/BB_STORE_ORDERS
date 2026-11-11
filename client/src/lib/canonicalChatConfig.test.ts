import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "./canonical";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubStorage(values: Record<string, string>) {
  const data = new Map(Object.entries(values));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
  });
}

describe("Chat browser isolation", () => {
  it("ignores legacy Chat anon config in the browser database helper", () => {
    stubStorage({
      "bb-chat-supabase-config": JSON.stringify({
        url: "https://old-chat-project.example",
        anonKey: "old-chat-anon-key",
      }),
    });

    expect(getSupabaseConfig(undefined, "main")).toBeNull();
    expect(getSupabaseConfig(undefined, "tracking")).toBeNull();
    expect(getSupabaseConfig(undefined, "parcel")).toBeNull();
  });
});
