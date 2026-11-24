import { describe, expect, it } from "vitest";
import { getOrderBusinessDayRange } from "./order-business-day";

describe("BB order business day", () => {
  it("keeps the prior business date until one minute before the 14:00 Bangkok cutoff", () => {
    const range = getOrderBusinessDayRange(new Date("2026-11-24T06:59:00.000Z"));

    expect(range).toEqual({
      startKey: 202611231400,
      endKey: 202611241400,
    });
  });

  it("starts the new business date exactly at 14:00 Bangkok time", () => {
    const range = getOrderBusinessDayRange(new Date("2026-11-24T07:00:00.000Z"));

    expect(range).toEqual({
      startKey: 202611241400,
      endKey: 202611251400,
    });
  });
});
