import { describe, expect, it } from "vitest";
import { getLiveOrderStats, type LiveOrder } from "./supabase";

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
