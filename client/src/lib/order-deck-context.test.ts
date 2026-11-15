import { describe, expect, it } from "vitest";
import { buildOrderDeckContextMessage, selectLatestCustomerMessageTexts } from "./order-deck-context";

describe("Order Deck chat context", () => {
  it("imports only inbound customer text in real timestamp order and keeps the newest 20", () => {
    const rows = [
      { id: "p1", direction: "outbound", text: "เพจตอบ ไม่ควรส่งเข้า parser", occurredAt: "2026-11-15T10:10:00Z" },
      { id: "c2", direction: "inbound", text: "ตำบลท่าลาด", occurredAt: "2026-11-15T10:12:00Z" },
      { id: "c1", direction: "inbound", text: "คุณกอล์ฟ 0812345678", occurredAt: "2026-11-15T10:11:00Z" },
      { id: "empty", direction: "inbound", text: "  ", occurredAt: "2026-11-15T10:13:00Z" },
    ];

    expect(selectLatestCustomerMessageTexts(rows)).toEqual(["คุณกอล์ฟ 0812345678", "ตำบลท่าลาด"]);
  });

  it("limits context to the newest customer messages", () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      direction: "inbound",
      text: `customer-${index + 1}`,
      occurredAt: new Date(Date.UTC(2026, 10, 15, 0, index)).toISOString(),
    }));

    expect(selectLatestCustomerMessageTexts(rows)).toHaveLength(20);
    expect(selectLatestCustomerMessageTexts(rows)[0]).toBe("customer-6");
    expect(selectLatestCustomerMessageTexts(rows).at(-1)).toBe("customer-25");
  });

  it("sends only page context automatically and customer data only on explicit import", () => {
    const input = {
      pageId: "page-1",
      pageName: "BB Store",
      threadId: "thread-1",
      customerName: "Customer",
      customerPhone: "0812345678",
      customerMessages: ["customer message"],
    };
    const pageOnly = buildOrderDeckContextMessage(input);
    expect(pageOnly).toEqual({
      type: "BB_ORDER_DECK_CONTEXT",
      pageName: "BB Store",
      importCustomerMessages: false,
    });

    const imported = buildOrderDeckContextMessage(input, true);
    expect(imported).toMatchObject({
      type: "BB_ORDER_DECK_CONTEXT",
      pageName: "BB Store",
      importCustomerMessages: true,
      customerName: "Customer",
      customerPhone: "0812345678",
      customerMessages: ["customer message"],
    });
  });
});
