import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMetaMessage } from "../../../server/meta";

const tokenTablePath = encodeURIComponent("🌈MILKY_WAY_xXx_TOKEN _PAGE");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sendMetaMessage", () => {
  it("looks up the page token by page_id and POSTs a response to Meta", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://chat-project.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    for (const name of [
      "MAIN_ORDER_SUPABASE_URL", "MAIN_ORDER_SUPABASE_SERVICE_ROLE_KEY",
      "ORDER_SUPABASE_URL", "ORDER_SUPABASE_SERVICE_ROLE_KEY",
      "TRACKING_SUPABASE_URL", "TRACKING_SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "META_PAGES_JSON",
      "META_PAGE_ID", "META_PAGE_ACCESS_TOKEN",
    ]) vi.stubEnv(name, "");

    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.startsWith(`https://chat-project.supabase.co/rest/v1/${tokenTablePath}?`)) {
        return new Response(JSON.stringify([{ page_id: "page-123", page_name: "Test page", access_token: "test-page-token" }]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ recipient_id: "customer-456", message_id: "mid.test-789" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const result = await sendMetaMessage({
      pageId: "page-123",
      portalKey: "BB_05",
      recipientId: "customer-456",
      text: "ทดสอบเส้นทางส่ง",
    });

    expect(result.message_id).toBe("mid.test-789");
    expect(requests).toHaveLength(2);

    const tokenLookup = new URL(requests[0].url);
    expect(tokenLookup.pathname).toBe(`/rest/v1/${tokenTablePath}`);
    expect(tokenLookup.searchParams.get("select")).toBe("page_id,page_name,access_token");
    expect(tokenLookup.searchParams.get("page_id")).toBe("eq.page-123");
    expect(tokenLookup.searchParams.has("portal_key")).toBe(false);

    const graphRequest = new URL(requests[1].url);
    expect(graphRequest.pathname).toBe("/v26.0/page-123/messages");
    expect(graphRequest.searchParams.get("access_token")).toBe("test-page-token");
    expect(JSON.parse(String(requests[1].init?.body))).toEqual({
      recipient: { id: "customer-456" },
      messaging_type: "RESPONSE",
      message: { text: "ทดสอบเส้นทางส่ง" },
    });
  });

  it("uses the browser Chat credentials for token lookup when supplied", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.startsWith(`https://browser-chat.supabase.co/rest/v1/${tokenTablePath}?`)) {
        return new Response(JSON.stringify([{ page_id: "page-123", access_token: "browser-page-token" }]), { status: 200 });
      }
      return new Response(JSON.stringify({ recipient_id: "customer-456", message_id: "mid.browser-123" }), { status: 200 });
    });

    await sendMetaMessage({ pageId: "page-123", recipientId: "customer-456", text: "ทดสอบ browser config" }, {
      url: "https://browser-chat.supabase.co",
      serviceRoleKey: "browser-chat-key",
    });

    expect(requests[0].url).toContain("https://browser-chat.supabase.co/rest/v1/");
    expect((requests[0].init?.headers as Record<string, string>).Authorization)
      .toBe("Bearer browser-chat-key");
    expect(new URL(requests[1].url).searchParams.get("access_token")).toBe("browser-page-token");
  });

  it("does not fall back to a default or another project when CHAT_SUPABASE_URL is empty", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "test-chat-service-role-key");
    for (const name of [
      "MAIN_ORDER_SUPABASE_URL", "MAIN_ORDER_SUPABASE_SERVICE_ROLE_KEY",
      "ORDER_SUPABASE_URL", "ORDER_SUPABASE_SERVICE_ROLE_KEY",
      "TRACKING_SUPABASE_URL", "TRACKING_SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "META_PAGES_JSON",
      "META_PAGE_ID", "META_PAGE_ACCESS_TOKEN",
    ]) vi.stubEnv(name, "");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendMetaMessage({ pageId: "page-123", recipientId: "customer-456", text: "ทดสอบ URL ห้องแชท" }))
      .rejects.toThrow("CHAT_SUPABASE_URL is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not use alternate token column names when access_token is empty", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://chat-project.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "test-chat-service-role-key");
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(JSON.stringify([{ page_access_token: "legacy-token", pageAccessToken: "legacy-token", token: "legacy-token" }]), { status: 200 });
    });

    await expect(sendMetaMessage({ pageId: "page-123", recipientId: "customer-456", text: "ทดสอบ" }))
      .rejects.toThrow("No Meta page token configured for page page-123");
    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain(`/rest/v1/${tokenTablePath}?`);
  });

  it("does not fall back to another Supabase account when Chat credentials are missing", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://zxmczmgmtbnammtljdls.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "");
    for (const [name, value] of Object.entries({
      MAIN_ORDER_SUPABASE_URL: "https://main-order.example",
      MAIN_ORDER_SUPABASE_SERVICE_ROLE_KEY: "main-key",
      ORDER_SUPABASE_URL: "https://order.example",
      ORDER_SUPABASE_SERVICE_ROLE_KEY: "order-key",
      TRACKING_SUPABASE_URL: "https://tracking.example",
      TRACKING_SUPABASE_SERVICE_ROLE_KEY: "tracking-key",
      SUPABASE_URL: "https://legacy.example",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-key",
      META_PAGES_JSON: "",
      META_PAGE_ID: "",
      META_PAGE_ACCESS_TOKEN: "",
    })) vi.stubEnv(name, value);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendMetaMessage({ pageId: "page-123", recipientId: "customer-456", text: "ทดสอบ" }))
      .rejects.toThrow("CHAT_SUPABASE_SERVICE_ROLE_KEY is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
