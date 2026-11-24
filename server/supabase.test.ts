import { afterEach, describe, expect, it, vi } from "vitest";
import { getLiveOrderStats, recordOutgoingChatMessage, type LiveOrder } from "./supabase";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("getLiveOrderStats", () => {
  it("ignores null rows before reading telegram_status", () => {
    const orders = [
      { telegram_status: "SENT", is_ready_to_pack: true, cod_check_status: "PASS", page_id: "page-1" },
      null,
      undefined,
    ] as unknown as LiveOrder[];

    expect(getLiveOrderStats(orders)).toEqual({
      total: 1,
      mapped: 1,
      review: 0,
      codCheck: 0,
      sent: 1,
      pages: 1,
    });
  });

  it("treats missing and non-canonical status values as text safely", () => {
    const orders = [
      { telegram_status: null, is_ready_to_pack: false, cod_check_status: "CHECK", page_id: null },
      { telegram_status: "sent", is_ready_to_pack: false, cod_check_status: "PASS", page_id: "page-1" },
    ] as unknown as LiveOrder[];

    expect(getLiveOrderStats(orders).sent).toBe(1);
    expect(getLiveOrderStats(orders).total).toBe(2);
  });
});

describe("recordOutgoingChatMessage", () => {
  it("persists each outgoing image URL alongside its own provider message ID", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response("[]", { status: 201, headers: { "Content-Type": "application/json" } }),
    );
    const imageUrls = [1, 2, 3, 4].map(index => `https://cdn.example.test/image-${index}.jpg`);
    const messageIds = [1, 2, 3, 4].map(index => `meta-message-${index}`);

    try {
      await Promise.all(imageUrls.map((imageUrl, index) => recordOutgoingChatMessage({
        pageId: "page-1",
        threadId: "thread-1",
        recipientId: "customer-1",
        messageId: messageIds[index],
        text: "📷 ส่งรูปภาพ",
        imageUrl,
      }, { url: "https://chat-project.supabase.co", serviceRoleKey: "test-key" })));

      const persisted = fetchSpy.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
      expect(persisted).toHaveLength(4);
      expect(persisted.map(row => row.attachment_url)).toEqual(imageUrls);
      expect(persisted.map(row => row.message_id)).toEqual(messageIds);
      expect(persisted.map(row => row.dedupe_key)).toEqual(messageIds.map(id => `page-1_t_thread-1:${id}`));
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("retries the webhook-race PATCH without page_message_text when the migration is absent", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const missingColumn = {
      code: "PGRST204",
      message: "Could not find the 'page_message_text' column of 'Pg_Chat⭐BINARY_xXx_STAR' in the schema cache",
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(missingColumn), { status: 400, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "23505", message: "duplicate key value violates unique constraint on message_id" }), { status: 409, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(missingColumn), { status: 400, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ message_id: "meta-webhook-race" }]), { status: 200, headers: { "Content-Type": "application/json" } }));

    try {
      const result = await recordOutgoingChatMessage({
        pageId: "page-1",
        threadId: "thread-1",
        recipientId: "customer-1",
        messageId: "meta-webhook-race",
        text: "📷 ส่งรูปภาพ",
        imageUrl: "https://cdn.example.test/race.jpg",
      }, { url: "https://chat-project.supabase.co", serviceRoleKey: "test-key" });

      expect(fetchSpy).toHaveBeenCalledTimes(4);
      expect(fetchSpy.mock.calls.map(([, init]) => init?.method ?? "GET")).toEqual(["POST", "POST", "PATCH", "PATCH"]);
      const firstPatch = JSON.parse(String(fetchSpy.mock.calls[2]?.[1]?.body));
      const legacyPatch = JSON.parse(String(fetchSpy.mock.calls[3]?.[1]?.body));
      expect(firstPatch.page_message_text).toBe("📷 ส่งรูปภาพ");
      expect(legacyPatch).not.toHaveProperty("page_message_text");
      expect(legacyPatch.message_text).toBe("📷 ส่งรูปภาพ");
      expect(legacyPatch.attachment_url).toBe("https://cdn.example.test/race.jpg");
      expect(result).toEqual([{ message_id: "meta-webhook-race" }]);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("retries with the base message_text contract when page_message_text is missing", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: "PGRST204",
        message: "Could not find the 'page_message_text' column of 'Pg_Chat⭐BINARY_xXx_STAR' in the schema cache",
      }), { status: 400, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response("[]", { status: 201, headers: { "Content-Type": "application/json" } }));

    try {
      await recordOutgoingChatMessage({
        pageId: "page-1",
        threadId: "thread-1",
        recipientId: "customer-1",
        messageId: "meta-message-legacy-schema",
        text: "📷 ส่งรูปภาพ",
        imageUrl: "https://cdn.example.test/photo.jpg",
      }, { url: "https://chat-project.supabase.co", serviceRoleKey: "test-key" });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const firstPayload = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
      const retryPayload = JSON.parse(String(fetchSpy.mock.calls[1]?.[1]?.body));
      expect(firstPayload.page_message_text).toBe("📷 ส่งรูปภาพ");
      expect(retryPayload).not.toHaveProperty("page_message_text");
      expect(retryPayload.message_text).toBe("📷 ส่งรูปภาพ");
      expect(retryPayload.attachment_url).toBe("https://cdn.example.test/photo.jpg");
      expect(retryPayload.message_id).toBe("meta-message-legacy-schema");
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
