import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: { id: 1, role: "admin" } as NonNullable<TrpcContext["user"]>,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    adminDeviceId: "test-device",
    userAgent: "test-agent",
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Chat server-only credentials", () => {
  it("uses server CHAT config without a client credential setup", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await appRouter.createCaller(context()).chat.threads();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(String(url)).toContain("https://server-chat.supabase.co/rest/v1/");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer server-chat-key");
    }
  });

  it("checks page chat history against base columns without requiring the optional lane text migration", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    const result = await appRouter.createCaller(context()).chat.connection();
    const pageHistoryUrl = requests.find(url => decodeURIComponent(new URL(url).pathname).includes("Pg_Chat⭐BINARY_xXx_STAR"));
    expect(pageHistoryUrl).toBeTruthy();
    expect(new URL(pageHistoryUrl!).searchParams.get("select")).toBe("id,page_id,thread_id,message_text");
    expect(result.checked).toContain("Pg_Chat⭐BINARY_xXx_STAR");
  });

  it("uses the latest message_row_id as the initial baseline with server credentials", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response(JSON.stringify([{ message_row_id: 900 }]), { status: 200, headers: { "content-type": "application/json" } });
    });

    const result = await appRouter.createCaller(context()).chat.pollNotifications({ afterRowId: null });
    expect(requests).toHaveLength(1);
    const url = new URL(requests[0].url);
    expect(url.origin).toBe("https://server-chat.supabase.co");
    expect(decodeURIComponent(url.pathname)).toContain("Cust_Chat⭐BINARY_xXx_STAR");
    expect(url.searchParams.get("select")).toBe("message_row_id");
    expect(url.searchParams.get("order")).toBe("message_row_id.desc");
    expect(result).toEqual({ rows: [], cursorRowId: "900" });
    expect((requests[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer server-chat-key");
  });

  it("keyset-paginates every customer row beyond the 1,000-row page size", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
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

    const result = await appRouter.createCaller(context()).chat.pollNotifications({ afterRowId: "100" });

    expect(requests).toHaveLength(2);
    expect(new URL(requests[0].url).searchParams.get("message_row_id")).toBe("gt.100");
    expect(new URL(requests[1].url).searchParams.get("message_row_id")).toBe("gt.1100");
    expect(result.rows).toHaveLength(1001);
    expect(result.rows.every(row => row._source_table === "Cust_Chat⭐BINARY_xXx_STAR")).toBe(true);
    expect(result.cursorRowId).toBe("1101");
  });

  it("routes every thread query through server CHAT credentials", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    await appRouter.createCaller(context()).chat.threads();
    expect(requests).toHaveLength(3);
    for (const request of requests) {
      expect(request.url).toContain("https://server-chat.supabase.co/rest/v1/");
      expect((request.init?.headers as Record<string, string>).Authorization).toBe("Bearer server-chat-key");
    }
  });
});
