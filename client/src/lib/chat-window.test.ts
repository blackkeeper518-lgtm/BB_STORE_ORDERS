import { describe, expect, it } from "vitest";
import { isMessengerResponseWindowExpired } from "./chat-window";

describe("Messenger response window", () => {
  it("allows a reply shortly after a customer message at midnight", () => {
    const messages = [
      { direction: "inbound", occurredAt: "2026-11-12T00:00:00+07:00" },
      { direction: "outbound", occurredAt: "2026-11-11T23:00:00+07:00" },
    ];

    expect(isMessengerResponseWindowExpired(messages, Date.parse("2026-11-12T00:45:00+07:00"))).toBe(false);
  });

  it("blocks when the latest customer message is at least 24 hours old", () => {
    const messages = [
      { direction: "inbound", occurredAt: "2026-11-10T23:59:59+07:00" },
      { direction: "outbound", occurredAt: "2026-11-11T23:59:59+07:00" },
    ];

    expect(isMessengerResponseWindowExpired(messages, Date.parse("2026-11-12T00:00:00+07:00"))).toBe(true);
  });

  it("does not block when the room has no parseable inbound timestamp", () => {
    expect(isMessengerResponseWindowExpired([
      { direction: "outbound", occurredAt: "2026-11-10T00:00:00Z" },
      { direction: "inbound", occurredAt: "not-a-date" },
    ], Date.parse("2026-11-12T00:00:00Z"))).toBe(false);
  });
});
