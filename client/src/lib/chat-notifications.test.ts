import { describe, expect, it } from "vitest";
import {
  countUnreadChatMessages,
  filterChatNotificationsForEnabledPages,
  isChatNotificationPageEnabled,
  markChatNotificationsRead,
  reconcileChatNotificationRows,
  resolveChatNotificationSoundKey,
  type ChatNotificationState,
} from "./chat-notifications";

const initial: ChatNotificationState = {
  version: 2,
  initialized: false,
  cursorRowId: null,
  seenMessageKeys: [],
  pending: [],
};

const customerRow = (messageId: string, text: string, threadId = "thread-1", rowId = 1) => ({
  _source_table: "Cust_Chat⭐BINARY_xXx_STAR",
  id: rowId,
  message_row_id: rowId,
  page_id: "page-1",
  page_name: "เพจตัวอย่าง",
  thread_id: threadId,
  facebook_name: "ลูกค้าตัวอย่าง",
  message_id: messageId,
  speaker: "customer",
  message_text: text,
  customer_message_time_th: "15/11/2569 10:00:00",
  occurred_at: "2026-11-15T03:00:00.000Z",
});

describe("chat notification reconciliation", () => {
  it("uses the first delta response as a baseline instead of alerting historical messages", () => {
    const result = reconcileChatNotificationRows(initial, [customerRow("old-1", "ข้อความเดิม")], 100);
    expect(result.newMessageCount).toBe(0);
    expect(result.state.initialized).toBe(true);
    expect(result.state.seenMessageKeys).toContain("page-1:thread-1:old-1");
    expect(result.state.pending).toEqual([]);
  });

  it("counts each new customer message once by message_id", () => {
    const baseline = reconcileChatNotificationRows(initial, [customerRow("old-1", "ข้อความเดิม", "thread-1", 1)], 100).state;
    const result = reconcileChatNotificationRows(baseline, [
      customerRow("new-1", "ส่งแล้วหรือยัง", "thread-1", 2),
      customerRow("new-1", "ส่งแล้วหรือยัง", "thread-1", 2),
    ], 200);
    expect(result.newMessageCount).toBe(1);
    expect(result.state.pending).toHaveLength(1);
    expect(result.state.pending[0].count).toBe(1);
    expect(result.state.pending[0].message).toBe("ส่งแล้วหรือยัง");
  });

  it("uses the per-message customer text and occurred_at before room summary fields", () => {
    const baseline = reconcileChatNotificationRows(initial, [], 100).state;
    const result = reconcileChatNotificationRows(baseline, [{
      ...customerRow("fresh-1", "สรุปห้องเก่า", "thread-1", 2),
      customer_message_text: "ข้อความลูกค้าสด",
      customer_latest_message: "ข้อความ snapshot เก่า",
      customer_message_time_th: "15/11/2569 10:59:00",
      occurred_at: "2026-11-15T04:00:00.000Z",
    }], 200);

    expect(result.newMessageCount).toBe(1);
    expect(result.state.pending[0].message).toBe("ข้อความลูกค้าสด");
    expect(result.state.pending[0].messageAt).toBe("2026-11-15T04:00:00.000Z");
  });

  it("falls back to dedupe_key when message_id is the literal string null", () => {
    const baseline = reconcileChatNotificationRows(initial, [{
      ...customerRow("row-old", "ข้อความเดิม", "thread-1", 1),
      message_id: "null",
      dedupe_key: "old-dedupe-key",
    }], 100).state;
    const result = reconcileChatNotificationRows(baseline, [{
      ...customerRow("row-new", "ข้อความใหม่", "thread-1", 2),
      message_id: "null",
      dedupe_key: "new-dedupe-key",
    }], 200);
    expect(result.newMessageCount).toBe(1);
    expect(result.state.pending[0].messageId).toBe("new-dedupe-key");
  });

  it("groups real new messages per room and keeps the badge count exact", () => {
    const baseline = reconcileChatNotificationRows(initial, [], 100).state;
    const result = reconcileChatNotificationRows(baseline, [
      customerRow("m-1", "อันแรก", "thread-1", 1),
      customerRow("m-2", "อันที่สอง", "thread-1", 2),
      customerRow("m-3", "อันที่สาม", "thread-2", 3),
    ], 200);
    expect(result.newMessageCount).toBe(3);
    expect(result.state.pending).toHaveLength(2);
    expect(result.state.pending.find(item => item.threadId === "thread-1")?.count).toBe(2);
    expect(countUnreadChatMessages(result.state)).toBe(3);
  });

  it("does not treat page messages as incoming customer notifications", () => {
    const baseline = reconcileChatNotificationRows(initial, [], 100).state;
    const result = reconcileChatNotificationRows(baseline, [{
      ...customerRow("page-1", "เพจตอบแล้ว"),
      _source_table: "Pg_Chat⭐BINARY_xXx_STAR",
      speaker: "page",
    }], 200);
    expect(result.newMessageCount).toBe(0);
    expect(result.state.pending).toEqual([]);
  });

  it("marks one room or all pending rooms read without resetting the cursor", () => {
    const baseline = reconcileChatNotificationRows(initial, [], 100).state;
    const changed = reconcileChatNotificationRows(baseline, [customerRow("new-1", "ข้อความใหม่", "thread-1", 1)], 200).state;
    const one = markChatNotificationsRead(changed, "page-1:thread-1");
    const all = markChatNotificationsRead(changed);
    expect(one.pending).toEqual([]);
    expect(all.pending).toEqual([]);
    expect(all.cursorRowId).toBe(changed.cursorRowId);
    expect(all.seenMessageKeys).toEqual(changed.seenMessageKeys);
  });

  it("resumes from the last completely observed row after an outage without replaying it", () => {
    const baseline = reconcileChatNotificationRows(initial, [], 100, "900").state;
    const firstBatch = reconcileChatNotificationRows(baseline, [
      customerRow("m-901", "ข้อความ 901", "thread-1", 901),
      customerRow("m-902", "ข้อความ 902", "thread-1", 902),
    ], 200, "902");
    const resumed = reconcileChatNotificationRows(firstBatch.state, [
      customerRow("m-902", "ข้อความ 902", "thread-1", 902),
      customerRow("m-903", "ข้อความ 903", "thread-1", 903),
    ], 300, "903");

    expect(firstBatch.state.cursorRowId).toBe("902");
    expect(resumed.newMessageCount).toBe(1);
    expect(resumed.state.cursorRowId).toBe("903");
  });
});

describe("per-page chat notification settings", () => {
  it("keeps existing pages enabled unless explicitly disabled", () => {
    expect(isChatNotificationPageEnabled("page-1", {})).toBe(true);
    expect(isChatNotificationPageEnabled("page-1", { "page-1": true })).toBe(true);
    expect(isChatNotificationPageEnabled("page-1", { "page-1": false })).toBe(false);
  });

  it("filters only notifications from pages explicitly switched off", () => {
    const items = [
      { pageId: "page-1", threadKey: "page-1:thread-1" },
      { pageId: "page-2", threadKey: "page-2:thread-2" },
    ];
    expect(filterChatNotificationsForEnabledPages(items, { "page-1": false })).toEqual([items[1]]);
  });
});

describe("per-page chat notification sounds", () => {
  it("uses a page-specific sound without changing the default sound for other pages", () => {
    const pageSounds = { "page-1": "bell-page" };
    expect(resolveChatNotificationSoundKey("page-1", pageSounds, "default-ping")).toBe("bell-page");
    expect(resolveChatNotificationSoundKey("page-2", pageSounds, "default-ping")).toBe("default-ping");
  });

  it("falls back to the global default when no global sound is configured", () => {
    expect(resolveChatNotificationSoundKey("page-2", {}, undefined)).toBeUndefined();
  });
});
