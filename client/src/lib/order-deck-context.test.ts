import { describe, expect, it } from "vitest";
import { buildOrderDeckContextMessage, getSelectedOrderMessageText, isSelectableCustomerMessage } from "./order-deck-context";

describe("Order Deck chat context", () => {
  it("sends no page or customer data when the Order Deck is only opened", () => {
    const message = buildOrderDeckContextMessage({
      pageName: "BB Store",
      selectedCustomerMessage: "อภิโชค เสระ 0655310082 ที่อยู่ลูกค้า",
    });

    expect(message).toEqual({ type: "BB_ORDER_DECK_CONTEXT" });
  });

  it("sends the page name and only the one customer message after explicit import", () => {
    const message = buildOrderDeckContextMessage({
      pageName: " BB Store ",
      selectedCustomerMessage: "  อภิโชค เสระ 0655310082 ที่อยู่ลูกค้า  ",
    }, true);

    expect(message).toEqual({
      type: "BB_ORDER_DECK_CONTEXT",
      importSelectedCustomerMessage: true,
      pageName: "BB Store",
      selectedCustomerMessage: "อภิโชค เสระ 0655310082 ที่อยู่ลูกค้า",
    });
    expect(message).not.toHaveProperty("customerMessages");
    expect(message).not.toHaveProperty("customerName");
    expect(message).not.toHaveProperty("customerPhone");
  });

  it("does not import the page when no message has been selected", () => {
    const message = buildOrderDeckContextMessage({ pageName: "BB Store", selectedCustomerMessage: "  " }, true);
    expect(message).toEqual({ type: "BB_ORDER_DECK_CONTEXT" });
  });

  it("allows selection only for inbound customer messages", () => {
    const validChatMessage = { direction: "inbound", senderType: "customer", source_lane: "🌌BB_CHAT", customer_message_text: "ข้อความจากคอลัมน์จริง" };
    expect(isSelectableCustomerMessage(validChatMessage)).toBe(true);
    expect(isSelectableCustomerMessage({ ...validChatMessage, source_lane: "OTHER_LANE" })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, customer_message_text: "  " })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, senderType: "system" })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, senderType: "page" })).toBe(false);
    expect(isSelectableCustomerMessage({ ...validChatMessage, direction: "outbound" })).toBe(false);
    expect(isSelectableCustomerMessage({ direction: "inbound", senderType: "customer", source_lane: "🌌BB_CHAT" })).toBe(false);
    expect(isSelectableCustomerMessage(null)).toBe(false);
    expect(isSelectableCustomerMessage(undefined)).toBe(false);
    expect(isSelectableCustomerMessage("not a message")).toBe(false);
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
    const message = buildOrderDeckContextMessage({ pageName: "BB Store", selectedCustomerMessage: "x".repeat(3_000) }, true);
    expect(message).toMatchObject({ selectedCustomerMessage: "x".repeat(2_400) });
  });
});
