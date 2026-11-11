import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_BROWSER_CONFIG_KEY,
  clearBrowserChatConfig,
  readBrowserChatConfig,
  saveBrowserChatConfig,
} from "./chat-config";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockBrowserStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  return values;
}

describe("browser Chat configuration", () => {
  it("saves the dedicated Chat URL and service key in this browser only", () => {
    const values = mockBrowserStorage();
    saveBrowserChatConfig({
      url: "https://chat-project.supabase.co/",
      serviceRoleKey: " chat-service-key ",
    });

    expect(JSON.parse(values.get(CHAT_BROWSER_CONFIG_KEY) ?? "{}")).toEqual({
      url: "https://chat-project.supabase.co",
      serviceRoleKey: "chat-service-key",
    });
    expect(readBrowserChatConfig()).toEqual({
      url: "https://chat-project.supabase.co",
      serviceRoleKey: "chat-service-key",
    });
  });

  it("rejects non-Supabase or non-HTTPS URLs", () => {
    mockBrowserStorage();
    expect(() => saveBrowserChatConfig({ url: "http://chat-project.supabase.co", serviceRoleKey: "key" }))
      .toThrow("URL ต้องเป็น https://<project>.supabase.co เท่านั้น");
    expect(() => saveBrowserChatConfig({ url: "https://example.com", serviceRoleKey: "key" }))
      .toThrow("URL ต้องเป็น https://<project>.supabase.co เท่านั้น");
  });

  it("clears the browser-local Chat configuration", () => {
    const values = mockBrowserStorage();
    saveBrowserChatConfig({ url: "https://chat-project.supabase.co", serviceRoleKey: "chat-service-key" });
    clearBrowserChatConfig();

    expect(values.has(CHAT_BROWSER_CONFIG_KEY)).toBe(false);
    expect(readBrowserChatConfig()).toBeNull();
  });
});
