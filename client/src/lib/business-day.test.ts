import { describe, expect, it } from "vitest";
import { isCurrentBangkokBusinessDay, isTimestampInCurrentBangkokBusinessDay } from "./business-day";

describe("BB Bangkok business day from order_time_display", () => {
  it("uses the previous day's 14:00 boundary before 14:00 Bangkok", () => {
    const now = new Date("2026-11-25T06:59:00.000Z"); // 25 Nov 13:59 Bangkok
    expect(isCurrentBangkokBusinessDay("24/11/69 14:00:00", now)).toBe(true);
    expect(isCurrentBangkokBusinessDay("24/11/69 13:59:59", now)).toBe(false);
    expect(isCurrentBangkokBusinessDay("25/11/69 13:59:00", now)).toBe(true);
  });

  it("starts the new business day exactly at 14:00 Bangkok", () => {
    const now = new Date("2026-11-25T07:00:00.000Z"); // 25 Nov 14:00 Bangkok
    expect(isCurrentBangkokBusinessDay("25/11/69 14:00:00", now)).toBe(true);
    expect(isCurrentBangkokBusinessDay("25/11/69 13:59:59", now)).toBe(false);
    expect(isCurrentBangkokBusinessDay("26/11/69 13:59:59", now)).toBe(true);
  });

  it("handles four-digit Buddhist years and midnight in Bangkok", () => {
    const now = new Date("2026-11-25T18:00:00.000Z"); // 26 Nov 01:00 Bangkok
    expect(isCurrentBangkokBusinessDay("25/11/2569 23:00:00", now)).toBe(true);
    expect(isCurrentBangkokBusinessDay("24/11/2569 13:59:59", now)).toBe(false);
  });

  it("returns false for missing or malformed display timestamps without falling back to another field", () => {
    const now = new Date("2026-11-25T07:00:00.000Z");
    expect(isCurrentBangkokBusinessDay(null, now)).toBe(false);
    expect(isCurrentBangkokBusinessDay("2026-11-25T07:00:00.000Z", now)).toBe(false);
    expect(isCurrentBangkokBusinessDay("31/02/69 14:00", now)).toBe(false);
  });
});

describe("BB Bangkok business day from chat message timestamps", () => {
  it("uses the same 14:00 cutoff for chat messages", () => {
    const beforeCutoff = new Date("2026-11-26T03:00:00.000Z"); // 26 Nov 10:00 Bangkok
    expect(isTimestampInCurrentBangkokBusinessDay("2026-11-26T06:59:59.000Z", beforeCutoff)).toBe(true);
    expect(isTimestampInCurrentBangkokBusinessDay("2026-11-25T06:59:59.000Z", beforeCutoff)).toBe(false);

    const atCutoff = new Date("2026-11-26T07:00:00.000Z"); // 26 Nov 14:00 Bangkok
    expect(isTimestampInCurrentBangkokBusinessDay("2026-11-26T06:59:59.000Z", atCutoff)).toBe(false);
    expect(isTimestampInCurrentBangkokBusinessDay("2026-11-26T07:00:00.000Z", atCutoff)).toBe(true);
  });
});
