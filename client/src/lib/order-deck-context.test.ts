import { describe, expect, it } from "vitest";
import { buildOrderDeckContextMessage, isSelectableCustomerMessage } from "./order-deck-context";

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
    expect(isSelectableCustomerMessage({ direction: "inbound", senderType: "customer" })).toBe(true);
    expect(isSelectableCustomerMessage({ direction: "inbound", senderType: "system" })).toBe(false);
    expect(isSelectableCustomerMessage({ direction: "inbound", senderType: "page" })).toBe(false);
    expect(isSelectableCustomerMessage({ direction: "outbound", senderType: "customer" })).toBe(false);
  });

  it("caps imported text at 2,400 characters", () => {
    const message = buildOrderDeckContextMessage({ pageName: "BB Store", selectedCustomerMessage: "x".repeat(3_000) }, true);
    expect(message).toMatchObject({ selectedCustomerMessage: "x".repeat(2_400) });
  });
});
