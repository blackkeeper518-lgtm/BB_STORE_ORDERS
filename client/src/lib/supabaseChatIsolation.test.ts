import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseGet } from "../../../server/supabase";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Chat Supabase lane isolation", () => {
  it("fails without Chat credentials instead of borrowing another lane", async () => {
    for (const [name, value] of Object.entries({
      CHAT_SUPABASE_URL: "",
      CHAT_SUPABASE_SERVICE_ROLE_KEY: "",
      TRACKING_SUPABASE_URL: "https://tracking.example",
      TRACKING_SUPABASE_SERVICE_ROLE_KEY: "tracking-key",
      MAIN_ORDER_SUPABASE_URL: "https://main-order.example",
      MAIN_ORDER_SUPABASE_SERVICE_ROLE_KEY: "main-order-key",
      ORDER_SUPABASE_URL: "https://order.example",
      ORDER_SUPABASE_SERVICE_ROLE_KEY: "order-key",
      SUPABASE_URL: "https://legacy.example",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-key",
    })) vi.stubEnv(name, value);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(supabaseGet("chat_threads?select=*", "chat"))
      .rejects.toThrow("Supabase chat secrets are not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
