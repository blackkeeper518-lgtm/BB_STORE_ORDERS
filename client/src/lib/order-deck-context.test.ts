import { describe, expect, it } from "vitest";
import { buildOrderDeckContextMessage, getImportableLatestCustomerMessage, getLatestBBChatCustomerMessage, getSelectedOrderMessageText, isImportableLatestCustomerMessage, isSelectableCustomerMessage } from "./order-deck-context";

describe("Order Deck chat context", () => {
  it("sends the page name when the Order Deck is opened without importing a message", () => {
    const message = buildOrderDeckContextMessage({
      pageName: "ST Singto Store",
      selectedCustomerMessage: "อภิโชค เสระ 0655310082 ที่อยู่ลูกค้า",
    });

    expect(message).toEqual({ type: "ST_ORDER_DECK_CONTEXT", pageName: "ST Singto Store" });
  });

  it("sends an explicit clear request when the latest customer row is not importable", () => {
    expect(buildOrderDeckContextMessage({ pageName: "ST Singto Store" }, false, true)).toEqual({
      type: "ST_ORDER_DECK_CONTEXT",
      pageName: "ST Singto Store",
      clearSelectedCustomerMessage: true,
    });
  });

  it("sends the page name and only the one customer message after explicit import", () => {
    const message = buildOrderDeckContextMessage({
      pageName: " ST Singto Store ",
      selectedCustomerMessage: "  อภิโชค เสระ 0655310082 ที่อยู่ลูกค้า  ",
    }, true);

    expect(message).toEqual({
      type: "ST_ORDER_DECK_CONTEXT",
      importSelectedCustomerMessage: true,
      pageName: "ST Singto Store",
      selectedCustomerMessage: "อภิโชค เสระ 0655310082 ที่อยู่ลูกค้า",
    });
    expect(message).not.toHaveProperty("customerMessages");
    expect(message).not.toHaveProperty("customerName");
    expect(message).not.toHaveProperty("customerPhone");
  });

  it("does not import the message when no message has been selected", () => {
    const message = buildOrderDeckContextMessage({ pageName: "ST Singto Store", selectedCustomerMessage: "  " }, true);
    expect(message).toEqual({ type: "ST_ORDER_DECK_CONTEXT", pageName: "ST Singto Store" });
  });

  it("allows selection only for inbound customer messages", () => {
    const validChatMessage = { direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT", customer_message_text: "ข้อความจากคอลัมน์จริง" };
    expect(isSelectableCustomerMessage(validChatMessage)).toBe(true);
    expect(isSelectableCustomerMessage({ ...validChatMessage, source_lane: "OTHER_LANE" })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, customer_message_text: "  " })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, senderType: "system" })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, senderType: "page" })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, direction: "outbound" })).toBe(false);
    expect(isSelectableCustomerMessage({ direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT" })).toBe(false);
    expect(isSelectableCustomerMessage(null)).toBe(false);
    expect(isSelectableCustomerMessage(undefined)).toBe(false);
    expect(isSelectableCustomerMessage("not a message")).toBe(false);
  });

  it("uses only the newest ST_CHAT customer row and does not fall back when its text is missing", () => {
    const older = { direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT", customer_message_text: "ที่อยู่เก่ากว่า" };
    const pageReply = { direction: "outbound", senderType: "page", source_lane: "🌌ST_CHAT", page_message_text: "ขอที่อยู่ค่ะ" };
    const newest = { direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT", customer_message_text: null };

    expect(getLatestBBChatCustomerMessage([older, pageReply, newest])).toBe(newest);
    expect(isImportableLatestCustomerMessage(getLatestBBChatCustomerMessage([older, pageReply, newest]))).toBe(false);
  });

  it("returns the latest importable customer message from already-loaded chat data", () => {
    const older = { id: "old", direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT", customer_message_text: "ที่อยู่เก่า" };
    const latest = { id: "new", direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT", customer_message_text: "ที่อยู่ล่าสุด 0812345678" };

    expect(getImportableLatestCustomerMessage([older, latest])).toEqual({ id: "new", text: "ที่อยู่ล่าสุด 0812345678" });
  });

  it("does not fall back to cached text when the newest customer message is media", () => {
    const older = { id: "old", direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT", customer_message_text: "ที่อยู่เก่า" };
    const latest = { id: "new", direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT", customer_message_text: "[รูปภาพ]" };

    expect(getImportableLatestCustomerMessage([older, latest])).toBeNull();
  });

  it("does not treat media placeholders or emoji-only messages as order text", () => {
    const base = { direction: "inbound", senderType: "customer", source_lane: "🌌ST_CHAT" };
    expect(isImportableLatestCustomerMessage({ ...base, customer_message_text: "[รูปภาพ]" })).toBe(false);
    expect(isImportableLatestCustomerMessage({ ...base, customer_message_text: "🙏✨" })).toBe(false);
    expect(isImportableLatestCustomerMessage({ ...base, customer_message_text: "อภิโชค 0655310082" })).toBe(true);
    expect(isSelectableCustomerMessage({ ...base, customer_message_text: "[รูปภาพ]" })).toBe(true);
  });

  it("reads selected text only when both a selection and active thread exist", () => {
    const selection = { threadKey: "thread-1", text: "ที่อยู่ลูกค้า" };
    expect(getSelectedOrderMessageText(null, undefined)).toBe("");
    expect(getSelectedOrderMessageText(null, "thread-1")).toBe("");
    expect(getSelectedOrderMessageText(selection, undefined)).toBe("");
    expect(getSelectedOrderMessageText(selection, "thread-2")).toBe("");
    expect(getSelectedOrderMessageText(selection, "thread-1")).toBe("ที่อยู่ลูกค้า");
  });

  it("caps imported text at 2,400 characters", () => {
    const message = buildOrderDeckContextMessage({ pageName: "ST Singto Store", selectedCustomerMessage: "x".repeat(3_000) }, true);
    expect(message).toMatchObject({ selectedCustomerMessage: "x".repeat(2_400) });
  });
});
