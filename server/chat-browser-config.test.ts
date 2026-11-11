import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(chatSupabaseCredentials?: TrpcContext["chatSupabaseCredentials"]): TrpcContext {
  return {
    user: { id: 1, role: "admin" } as NonNullable<TrpcContext["user"]>,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    chatSupabaseCredentials,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Chat browser credentials", () => {
  it("does not query Supabase or use server env when this browser has no Chat config", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(appRouter.createCaller(context()).chat.threads())
      .rejects.toThrow("กรอก Chat Supabase URL และ service-role key ใน ROOM 02 ก่อนใช้งานแชท");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the Chat project explicitly configured in this browser", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    await appRouter.createCaller(context({
      url: "https://browser-chat.supabase.co",
      serviceRoleKey: "browser-chat-key",
    })).chat.threads();

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toContain("https://browser-chat.supabase.co/rest/v1/");
    expect((requests[0].init?.headers as Record<string, string>).Authorization)
      .toBe("Bearer browser-chat-key");
  });
});
