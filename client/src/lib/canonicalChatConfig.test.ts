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

describe("Chat Supabase lane configuration", () => {
  it("does not fall back to the Tracking project when Chat config is missing", () => {
    stubStorage({
      "bb-tracking-supabase-config": JSON.stringify({
        url: "https://tracking-only.example",
        anonKey: "tracking-anon-key",
      }),
    });

    const config = getSupabaseConfig(undefined, "chat");
    expect(config?.url).not.toBe("https://tracking-only.example");
    expect(config?.anonKey).not.toBe("tracking-anon-key");
  });

  it("uses the dedicated Chat config when both Chat and Tracking are configured", () => {
    stubStorage({
      "bb-chat-supabase-config": JSON.stringify({
        url: "https://chat-project.example",
        anonKey: "chat-anon-key",
      }),
      "bb-tracking-supabase-config": JSON.stringify({
        url: "https://tracking-project.example",
        anonKey: "tracking-anon-key",
      }),
    });

    expect(getSupabaseConfig(undefined, "chat")).toMatchObject({
      url: "https://chat-project.example",
      anonKey: "chat-anon-key",
    });
  });
});
