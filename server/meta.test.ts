import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMetaMessage } from "./meta";

const credentials = {
  url: "https://chat-project.supabase.co",
  serviceRoleKey: "test-service-role-key",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.stubEnv("CHAT_SUPABASE_URL", credentials.url);
  vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", credentials.serviceRoleKey);
});

function pageFetch(page: Record<string, unknown>) {
  const requests: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    requests.push(url);
    if (url.includes("/rest/v1/")) {
      return new Response(JSON.stringify([page]), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ message_id: "meta-message-1" }), { status: 200, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, requests };
}

describe("Meta Page surface status", () => {
  it("sends multiple images in one attachments array without singular attachment payload", async () => {
    const bodies: Array<Record<string, any>> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/rest/v1/")) {
        return new Response(JSON.stringify([{ page_id: "page-123", access_token: "test-page-token", status: "ON", status_web: "ON" }]), { status: 200 });
      }
      bodies.push(JSON.parse(String(init?.body)) as Record<string, any>);
      return new Response(JSON.stringify({ message_id: "meta-batch-1" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendMetaMessage({
      pageId: "page-123",
      recipientId: "customer-1",
      imageUrls: ["https://cdn.example.com/one.jpg", "https://cdn.example.com/two.jpg"],
      surface: "mobile",
    }, credentials)).resolves.toEqual({ message_id: "meta-batch-1" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.message?.attachment).toBeUndefined();
    expect(bodies[0]?.message?.attachments).toEqual([
      { type: "image", payload: { url: "https://cdn.example.com/one.jpg" } },
      { type: "image", payload: { url: "https://cdn.example.com/two.jpg" } },
    ]);
  });

  it("allows web replies when status_web is ON even if app status is OFF", async () => {
    const { fetchMock, requests } = pageFetch({
      page_id: "page-123",
      access_token: "test-page-token",
      status: "OFF",
      status_web: "ON",
    });

    await expect(sendMetaMessage({
      pageId: "page-123",
      recipientId: "customer-1",
      text: "ตอบจากเว็บ",
      surface: "web",
    }, credentials)).resolves.toEqual({ message_id: "meta-message-1" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(requests[0]).searchParams.get("select")).toBe("page_id,page_name,access_token,status,status_web");
    expect(requests[1]).toContain("graph.facebook.com");
  });

  it("keeps mobile replies disabled when status is OFF even if status_web is ON", async () => {
    const { fetchMock } = pageFetch({
      page_id: "page-123",
      access_token: "test-page-token",
      status: "OFF",
      status_web: "ON",
    });

    await expect(sendMetaMessage({
      pageId: "page-123",
      recipientId: "customer-1",
      text: "ตอบจากมือถือ",
      surface: "mobile",
    }, credentials)).rejects.toThrow("disabled for mobile (status=OFF)");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("blocks web replies when status_web is OFF even if app status is ON", async () => {
    const { fetchMock } = pageFetch({
      page_id: "page-123",
      access_token: "test-page-token",
      status: "ON",
      status_web: "OFF",
    });

    await expect(sendMetaMessage({
      pageId: "page-123",
      recipientId: "customer-1",
      text: "เว็บถูกปิด",
      surface: "web",
    }, credentials)).rejects.toThrow("disabled for web (status=OFF)");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry Meta internal error -1/2018012 and preserves its trace id", async () => {
    const requests: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.includes("/rest/v1/")) {
        return new Response(JSON.stringify([{
          page_id: "page-123",
          access_token: "test-page-token",
          status: "ON",
          status_web: "ON",
        }]), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({
        error: {
          message: "เกิดข้อผิดพลาดภายในที่ไม่คาดคิด",
          code: -1,
          error_subcode: 2018012,
          fbtrace_id: "AjDHu3AfyLzVj5wjsj8Rwuz",
        },
      }), { status: 500, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendMetaMessage({
      pageId: "page-123",
      recipientId: "customer-1",
      text: "ทดสอบอย่าส่งซ้ำ",
      surface: "web",
    }, credentials)).rejects.toThrow("META_TRANSIENT_INTERNAL: เกิดข้อผิดพลาดภายในที่ไม่คาดคิด (code=-1, subcode=2018012, trace=AjDHu3AfyLzVj5wjsj8Rwuz)");

    expect(requests.filter(url => url.includes("graph.facebook.com"))).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
