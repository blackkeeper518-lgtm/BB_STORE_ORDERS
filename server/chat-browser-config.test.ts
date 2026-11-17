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
  it("uses server Render config when this browser has no Chat config", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await appRouter.createCaller(context()).chat.threads();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("https://server-chat.supabase.co/rest/v1/");
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe("Bearer server-chat-key");
  });

  it("uses the latest message_row_id as the initial baseline without replaying history", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response(JSON.stringify([{ message_row_id: 900 }]), { status: 200, headers: { "content-type": "application/json" } });
    });

    const result = await appRouter.createCaller(context({
      url: "https://browser-chat.supabase.co",
      serviceRoleKey: "browser-chat-key",
    })).chat.pollNotifications({ afterRowId: null });

    expect(requests).toHaveLength(1);
    const url = new URL(requests[0].url);
    expect(decodeURIComponent(url.pathname)).toContain("Cust_Chat⭐BINARY_xXx_STAR");
    expect(url.searchParams.get("select")).toBe("message_row_id");
    expect(url.searchParams.get("order")).toBe("message_row_id.desc");
    expect(result).toEqual({ rows: [], cursorRowId: "900" });
    expect((requests[0].init?.headers as Record<string, string>).Authorization)
      .toBe("Bearer browser-chat-key");
  });

  it("keyset-paginates every customer row beyond the 1,000-row page size", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fullPage = Array.from({ length: 1000 }, (_, index) => ({
      message_row_id: index + 101,
      page_id: "page-1",
      thread_id: "thread-1",
      message_id: `message-${index + 101}`,
      message_text: "ข้อความ",
    }));
    const finalRow = [{ message_row_id: 1101, page_id: "page-1", thread_id: "thread-1", message_id: "message-1101", message_text: "ข้อความ" }];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      const filter = new URL(url).searchParams.get("message_row_id");
      const payload = filter === "gt.100" ? fullPage : filter === "gt.1100" ? finalRow : [];
      return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
    });

    const result = await appRouter.createCaller(context({
      url: "https://browser-chat.supabase.co",
      serviceRoleKey: "browser-chat-key",
    })).chat.pollNotifications({ afterRowId: "100" });

    expect(requests).toHaveLength(2);
    expect(new URL(requests[0].url).searchParams.get("message_row_id")).toBe("gt.100");
    expect(new URL(requests[1].url).searchParams.get("message_row_id")).toBe("gt.1100");
    expect(result.rows).toHaveLength(1001);
    expect(result.rows.every(row => row._source_table === "Cust_Chat⭐BINARY_xXx_STAR")).toBe(true);
    expect(result.cursorRowId).toBe("1101");
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

    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request.url).toContain("https://browser-chat.supabase.co/rest/v1/");
      expect((request.init?.headers as Record<string, string>).Authorization)
        .toBe("Bearer browser-chat-key");
    }
  });
});
