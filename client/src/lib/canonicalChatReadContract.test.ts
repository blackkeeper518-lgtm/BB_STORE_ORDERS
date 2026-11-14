import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_CUSTOMER_TABLE,
  CHAT_MATRIX_VIEW,
  CHAT_PAGE_TABLE,
  CHAT_PAGE_TOKEN_TABLE,
  checkChatConnection,
  fetchChatMessageRows,
  fetchChatThreadRows,
} from "../../../server/supabase";
import { mapChatRowsToMessages, mapChatRowsToThreads, reconcileOptimisticMessages } from "./canonical";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ChatHub read contract v5", () => {
  it("reads Cust and Pg source tables with dedicated Chat credentials", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://zxmczmgmtbnammtljdls.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "test-chat-service-role-key");
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      const isPage = url.includes(encodeURIComponent(CHAT_PAGE_TABLE));
      return new Response(JSON.stringify(isPage
        ? [{ speaker: "page", id: 2, message_text: "page message" }]
        : [{ speaker: "customer", id: 1, facebook_name: "Facebook customer", message_text: "customer message" }]), { status: 200, headers: { "content-type": "application/json" } });
    });

    const rows = await fetchChatThreadRows();
    expect(requests).toHaveLength(2);
    expect(requests.map(url => url.url)).toEqual(expect.arrayContaining([
      expect.stringContaining(`/rest/v1/${encodeURIComponent(CHAT_CUSTOMER_TABLE)}?`),
      expect.stringContaining(`/rest/v1/${encodeURIComponent(CHAT_PAGE_TABLE)}?`),
    ]));
    expect(requests.every(({ url }) => new URL(url).searchParams.get("select") === "*")).toBe(true);
    expect(rows.map(row => row._source_table)).toEqual([CHAT_CUSTOMER_TABLE, CHAT_PAGE_TABLE]);
    expect(requests.every(({ init }) => (init?.headers as Record<string, string>).Authorization === "Bearer test-chat-service-role-key")).toBe(true);
  });

  it("uses browser-selected Chat credentials for the protected two-table read", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://server-chat.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "server-chat-key");
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    await fetchChatThreadRows({
      url: "https://browser-chat.supabase.co",
      serviceRoleKey: "browser-chat-key",
    });

    expect(requests).toHaveLength(2);
    expect(requests.every(({ url }) => url.startsWith("https://browser-chat.supabase.co/rest/v1/"))).toBe(true);
    expect(requests.every(({ init }) => (init?.headers as Record<string, string>).Authorization === "Bearer browser-chat-key")).toBe(true);
  });

  it("filters selected-room messages in both source-table requests", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://zxmczmgmtbnammtljdls.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "test-chat-service-role-key");
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    await expect(fetchChatMessageRows({ pageId: "page-1", threadId: "thread-1" })).resolves.toEqual([]);
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      const url = new URL(request);
      expect(url.pathname).toContain("/rest/v1/");
      expect(url.searchParams.get("page_id")).toBe("eq.page-1");
      expect(url.searchParams.get("thread_id")).toBe("eq.thread-1");
      expect(url.searchParams.get("select")).toBe("*");
      expect(url.searchParams.has("occurred_at")).toBe(false);
    }
  });

  it("checks all six renamed Chat objects without returning any token value", async () => {
    vi.stubEnv("CHAT_SUPABASE_URL", "https://zxmczmgmtbnammtljdls.supabase.co");
    vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "test-chat-service-role-key");
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    const result = await checkChatConnection();
    expect(result.checked).toHaveLength(6);
    expect(requests).toHaveLength(6);
    expect(requests.some(({ url }) => url.includes(encodeURIComponent(CHAT_MATRIX_VIEW)))).toBe(true);
    expect(requests.some(({ url }) => url.includes(encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)) && url.includes("select=page_id%2Caccess_token"))).toBe(true);
    expect(requests.every(({ init }) => (init?.headers as Record<string, string>).Authorization === "Bearer test-chat-service-role-key")).toBe(true);
    expect(JSON.stringify(result)).not.toContain("access_token");
  });

  it("treats delivery_status as optional instead of requiring it in every row", () => {
    const baseRow = {
      page_id: "page-1",
      page_name: "เจ๊บี 🅱🅱",
      thread_id: "thread-1",
      customer_name: "ลูกค้าตัวอย่าง",
      speaker: "customer",
      message_text: "ข้อความทดสอบ",
    };
    const [withStatus] = mapChatRowsToThreads([{ ...baseRow, delivery_status: "🔥SENT" }]);
    const [withoutStatus] = mapChatRowsToThreads([baseRow]);
    expect(withStatus.delivery_status).toBe("🔥SENT");
    expect(withoutStatus.delivery_status).toBeNull();
  });

  it("uses facebook_name first and never displays the bill customer_name as the room name", () => {
    const [thread] = mapChatRowsToThreads([
      {
        page_id: "page-1",
        thread_id: "thread-1",
        speaker: "customer",
        facebook_name: "ชื่อ Facebook จาก API",
        customer_name: "ชื่อในบิล",
        message_text: "สวัสดี",
        occurred_at: "2026-11-13T08:00:00.000Z",
      },
      {
        page_id: "page-1",
        thread_id: "thread-1",
        speaker: "page",
        customer_name: "ชื่อบิลแถวล่าสุด",
        message_text: "ตอบกลับ",
        occurred_at: "2026-11-13T08:01:00.000Z",
      },
    ]);
    expect(thread.customerName).toBe("ชื่อ Facebook จาก API");
  });

  it("does not replace a missing Facebook name with the bill customer_name", () => {
    const [thread] = mapChatRowsToThreads([{
      page_id: "page-1",
      thread_id: "thread-1",
      speaker: "customer",
      customer_name: "ชื่อจากแถวแชท",
      recipient_name: "ชื่อผู้รับ",
      message_text: "สวัสดี",
    }]);

    expect(thread.customerName).toBe("");
  });

  it("does not create an empty room from rows without page_id or thread_id", () => {
    const threads = mapChatRowsToThreads([
      { page_id: null, thread_id: null, speaker: "customer", customer_name: "ไม่มีห้อง", message_text: "metadata" },
      { page_id: "page-1", thread_id: "", speaker: "page", page_name: "เพจ", message_text: "ไม่มีคีย์" },
      { page_id: "page-1", thread_id: "thread-1", speaker: "customer", facebook_name: "ชื่อ Facebook จริง", customer_name: "ชื่อในบิล", message_text: "มีห้อง" },
    ]);

    expect(threads).toHaveLength(1);
    expect(threads[0].key).toBe("page-1:thread-1");
    expect(threads[0].customerName).toBe("ชื่อ Facebook จริง");
  });

  it("does not create an empty room from a delivery-status-only row", () => {
    const threads = mapChatRowsToThreads([{
      _source_table: CHAT_PAGE_TABLE,
      page_id: "page-1",
      thread_id: "thread-status-only",
      speaker: "page",
      delivery_status: "🔥SENT",
      parcel_status_emoji: "🔴",
      tracking_number: "TH123456789",
      message_text: null,
      facebook_tracking_message: null,
    }]);

    expect(threads).toEqual([]);
  });

  it("does not create a room from page-only rows", () => {
    const threads = mapChatRowsToThreads([{
      _source_table: CHAT_PAGE_TABLE,
      page_id: "page-only",
      thread_id: "thread-only",
      message_text: "ข้อความที่เพจส่งออกไป",
      occurred_at: "2026-11-14T04:50:06.000Z",
    }]);

    expect(threads).toEqual([]);
  });

  it("preserves the existing order-slot and tracking fields for ChatHub filters", () => {
    const [thread] = mapChatRowsToThreads([{
      page_id: "page-1",
      thread_id: "thread-1",
      speaker: "page",
      page_name: "เพจตัวอย่าง",
      facebook_name: "ลูกค้าตัวอย่าง",
      message_text: "มีเลขพัสดุแล้ว",
      time_slot_label: "🌤 ออเดอร์รอบบ่าย [สั่ง:13/11/2026 18:11 น.]",
      tracking_number: "TH123456789",
      tracking_created_at: "2026-11-12T00:00:00.000Z",
      parcel_status_emoji: "🔴",
    }, {
      page_id: "page-1",
      thread_id: "thread-1",
      speaker: "customer",
      message_text: "ลูกค้าทักเข้ามา",
    }]);

    expect(thread.timeSlotLabel).toContain("ออเดอร์รอบบ่าย");
    expect(thread.tracking_number).toBe("TH123456789");
    expect(thread.trackingAgeMs).toBeGreaterThan(24 * 60 * 60 * 1000);
    expect(thread.parcel_status_emoji).toBe("🔴");
  });

  it("keeps search tokens from every order row in the same room", () => {
    const [thread] = mapChatRowsToThreads([
      { page_id: "page-1", thread_id: "thread-1", speaker: "customer", facebook_name: "ลูกค้า", message_text: "สั่งรอบแรก", phone: "0811111111", order_number: "ORD-OLD-001" },
      { page_id: "page-1", thread_id: "thread-1", speaker: "page", message_text: "ยืนยันรอบล่าสุด", phone: "0899999999", order_number: "ORD-NEW-002" },
    ]);

    expect(thread.searchText).toContain("ORD-OLD-001");
    expect(thread.searchText).toContain("ORD-NEW-002");
    expect(thread.searchText).toContain("0811111111");
  });

  it("reconciles sent optimistic messages by provider message_id, not duplicate text", () => {
    const optimistic = [{ id: "optimistic-1", messageId: "meta-new", text: "👍", direction: "outbound" }];
    const previousSameText = [{ messageId: "meta-old", text: "👍", direction: "outbound" }];
    const persistedSameMessage = [{ messageId: "meta-new", text: "👍", direction: "outbound" }];
    expect(reconcileOptimisticMessages(optimistic, previousSameText)).toEqual(optimistic);
    expect(reconcileOptimisticMessages(optimistic, persistedSameMessage)).toEqual([]);
  });

  it("uses message_text for bubbles and preserves latest customer/page text independently", () => {
    const row = {
      _source_table: CHAT_CUSTOMER_TABLE,
      id: 41,
      page_id: "page-1",
      page_name: "ร้านตัวอย่าง",
      portal_key: "BB_06",
      chat_link_key: "page-1_t_thread-1",
      thread_id: "thread-1",
      customer_id: "customer-1",
      recipient_id: "customer-1",
      customer_name: "ลูกค้าตัวอย่าง",
      phone: "0812345678",
      message_id: "message-1",
      speaker: "customer",
      message_text: "ส่งของยังคัย",
      message_raw: "ข้อความต้องไม่ถูกใช้",
      customer_latest_message: "ส่งของยังคัย",
      customer_message_time_th: "09/11/2569 11:50:06",
      page_latest_message: "Your AI agent transferred this chat to you.",
      page_message_time_th: "09/11/2569 11:50:27",
      message_time_display: "09/11 11:50",
      time_th: "09/11/2569 11:50:06",
      occurred_at: "2026-11-09T04:50:06.000Z",
      time: "2026-11-09T04:50:06.000Z",
      upsert_key: "BB_06_ORD-081126-192451_0615107528_22180",
      order_number: "ORD-081126-192451",
      order_time_display: "09/11 11:50",
      cod_amount: 990,
      parcel_status_emoji: "⚡SENT",
      delivery_status: "🔥SENT",
    };

    const [message] = mapChatRowsToMessages([row]);
    expect(message.text).toBe("ส่งของยังคัย");
    expect(message.message_text).toBe("ส่งของยังคัย");
    expect(message.customerLatestMessage).toBe("ส่งของยังคัย");
    expect(message.pageLatestMessage).toBe("Your AI agent transferred this chat to you.");
    expect(message.customerMessageTimeTh).toBe("09/11/2569 11:50:06");
    expect(message.pageMessageTimeTh).toBe("09/11/2569 11:50:27");

    const [thread] = mapChatRowsToThreads([row]);
    expect(thread.preview).toBe("ส่งของยังคัย");
    expect(thread.customerLatestMessage).toBe("ส่งของยังคัย");
    expect(thread.pageLatestMessage).toBe("Your AI agent transferred this chat to you.");
    expect(thread.customerPhone).toBe("0812345678");
    expect(thread.upsert_key).toBe("BB_06_ORD-081126-192451_0615107528_22180");
    expect(thread.order_number).toBe("ORD-081126-192451");
    expect(thread.cod_amount).toBe(990);
    expect(thread.parcel_status_emoji).toBe("⚡SENT");
    expect(thread.delivery_status).toBe("🔥SENT");
  });

  it("uses customer_latest_message when the customer source row has no message_text", () => {
    const [message] = mapChatRowsToMessages([{
      _source_table: CHAT_CUSTOMER_TABLE,
      page_id: "page-1",
      thread_id: "thread-1",
      speaker: "CUSTOMER",
      facebook_name: "ลูกค้าตัวอย่าง",
      message_text: null,
      customer_latest_message: "ลูกค้าทักมาก่อน ขอเช็กค่าส่งหน่อยค่ะ",
      page_latest_message: "Your AI agent transferred this chat to you.",
      occurred_at: "2026-11-13T08:00:00.000Z",
    }]);

    expect(message.senderType).toBe("customer");
    expect(message.direction).toBe("inbound");
    expect(message.text).toBe("ลูกค้าทักมาก่อน ขอเช็กค่าส่งหน่อยค่ะ");
  });

  it("splits customer and page latest fields when staggered flows write one summary row", () => {
    const messages = mapChatRowsToMessages([{
      _source_table: CHAT_PAGE_TABLE,
      page_id: "page-1",
      thread_id: "thread-1",
      message_text: null,
      customer_latest_message: "🔥ร้อนๆมีป่าว",
      customer_message_time_th: "14/11/2569 11:17:38",
      page_latest_message: "รับโปรลับในแชทนะเจ้าค่ะ",
      page_message_time_th: "14/11/2569 11:17:37",
      time_th: "14/11/2569 10:00:00",
    }]);

    expect(messages).toHaveLength(2);
    expect(messages.map(message => [message.senderType, message.text])).toEqual([
      ["page", "รับโปรลับในแชทนะเจ้าค่ะ"],
      ["customer", "🔥ร้อนๆมีป่าว"],
    ]);
    expect(messages.map(message => message.timeTh)).toEqual([
      "14/11/2569 11:17:37",
      "14/11/2569 11:17:38",
    ]);
  });

  it("uses the source table as authority when speaker metadata is wrong", () => {
    const [message] = mapChatRowsToMessages([{
      _source_table: CHAT_CUSTOMER_TABLE,
      source_side: "page",
      page_id: "page-1",
      thread_id: "thread-1",
      speaker: "page",
      message_text: "ข้อความจากลูกค้า",
      occurred_at: "2026-11-09T04:50:06.000Z",
    }]);

    expect(message.senderType).toBe("customer");
    expect(message.direction).toBe("inbound");
    expect(message.side).toBe("left");
  });
});
