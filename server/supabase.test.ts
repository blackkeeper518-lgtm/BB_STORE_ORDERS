import { describe, expect, it, vi } from "vitest";
import { getLiveOrderStats, recordOutgoingChatMessage, type LiveOrder } from "./supabase";

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
});
